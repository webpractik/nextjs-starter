## Context

`add-docker-compose-modes` проектирует один gateway и две replicas одного Next.js standalone image.
Этот change является его продолжением и не может быть реализован раньше: он редактирует созданные
там Compose-файлы, env template и lifecycle scripts. OpenSpec CLI 1.6.0 не имеет отдельного
`dependsOn` поля, поэтому prerequisite записан в поддерживаемом `goal` metadata, proposal и первой
implementation task.

В проекте включён `cacheComponents: true`, а установленный Next.js 16.2.12 предоставляет plural
`cacheHandlers` API для `'use cache'`. Текущий default handler хранит entries и tag manifest в
памяти отдельного процесса. Singular `cacheHandler` обслуживает другой incremental-cache контур
(ISR, patched fetch, route/image cache) и не влияет на Cache Components.

Custom Cache Components handler должен реализовать `get`, `set`, `refreshTags`, `getExpiration` и
`updateTags`. `CacheEntry.value` является `ReadableStream<Uint8Array>`, а distributed invalidation
должна учитывать explicit tags и implicit soft tags, используемые `revalidatePath`.

## Goals / Non-Goals

**Goals:**

- Разделить Cache Components entries и tag invalidation state между двумя Next.js replicas.
- Добавить воспроизводимый cache-only Valkey service к обоим Compose-режимам.
- Сохранить корректную `stale`, `revalidate` и `expire` семантику Next.js при внешнем storage.
- Ограничить память, lifetime и размер entries; не хранить частичные или невалидные streams.
- Деградировать до fresh rendering при cache read/write outage без скрытого успеха invalidation.
- Доказать cross-instance hit, invalidation и restart/outage behavior на двух реальных containers.

**Non-Goals:**

- Реализация singular `cacheHandler` для ISR/fetch/image optimization или изменение
  `'use cache: private'`.
- Valkey Sentinel/Cluster, multi-host HA, persistence, backup или использование Valkey как primary
  database/session store.
- Distributed locking и полное подавление cache stampede между replicas.
- Строгая консистентность во время network partition; приоритет — безопасный miss и явная ошибка
  mutation invalidation.
- CDN cache coordination, rolling-deployment migration между несовместимыми cache formats или
  публикация диагностического API в production.

## Decisions

### 1. Apply начинается с проверки prerequisite

Перед любым кодовым изменением apply workflow проверяет, что tasks
`add-docker-compose-modes` завершены, ожидаемые Compose/Docker artifacts существуют и оба режима
проходят их verification. Если prerequisite не завершён, этот change блокируется, а не создаёт
параллельную альтернативную topology.

Новые specs не объявляют `docker-compose-runtime` modified capability: prerequisite ещё не
архивирован в `openspec/specs`, а дополнительные Valkey/cache требования выражены отдельными
capabilities этого change.

### 2. Valkey подключается как `cacheHandlers.default`

`next.config.ts` указывает custom module в `cacheHandlers.default`, поэтому существующий обычный
`'use cache'` получает shared backend без массовой замены directives. Legacy `cacheHandler` не
настраивается. Перед реализацией выполняется source audit, подтверждающий отсутствие ожиданий от
`'use cache: remote'`; named/private handlers не меняются в этой задаче.

Для transport используется exact `iovalkey@0.4.0`: это server-only Valkey client с TypeScript
types, reconnect/timeout controls и без native Alpine artifact. `@valkey/valkey-glide` не выбран,
поскольку native runtime увеличивает риск musl/standalone packaging без нужной здесь выгоды.

Handler создаёт один lazy client на Node.js process, ограничивает connect timeout и retries per
request, не держит команды бесконечно в offline queue и регистрирует sanitized error listener.
Connection URL, credentials, cache keys, tags и payload никогда не попадают в logs.

### 3. Compose запускает один изолированный cache-only Valkey

Базовая topology получает один `valkey` service на внутренней network. Используется официальный
image с exact version и digest, `valkey-cli ping` healthcheck, restart policy и никакого published
port. `nextjs` ждёт initial healthy status Valkey, после чего обе replicas используют
`redis://valkey:6379` либо эквивалентный server-only URL.

Valkey является восстанавливаемым cache: RDB/AOF и data volume выключены. `maxmemory` имеет
безопасный configurable default, container limit оставляет overhead сверх dataset, а
`volatile-ttl` eviction применяется потому, что все handler keys имеют TTL. Restart Valkey очищает
entries и tag markers вместе, после чего Next.js прогревает cache заново.

Persistent Valkey был отклонён: cache нельзя превращать в источник истины, а одновременная потеря
entries и invalidation markers безопаснее восстановления неполного старого набора. HA/managed
Valkey потребуют отдельного deployment design.

### 4. Server env отделяет адрес, namespace и safety limits

Server schema получает обязательные `VALKEY_URL` и `VALKEY_CACHE_NAMESPACE`, а также числовые
limits для максимального storage TTL и serialized entry size с валидируемыми defaults. URL
разрешает только `redis:`/`rediss:` protocol и остаётся server-only. Test allowlist, `.env.example`,
Docker build/runtime args и Compose template обновляются вместе.

Namespace включает application и deployment/cache format version и MUST совпадать у двух replicas
одного image. При несовместимом codec или deployment он меняется, чтобы новый runtime не читал
старый payload. Реальные credentials передаются только runtime env/secret source и не встраиваются
в browser bundle или image metadata.

### 5. Entries используют hashed keys и versioned atomic envelope

Handler преобразует полученный Next.js cache key через SHA-256 и хранит одну atomic value. Это
ограничивает длину/символы storage key и не раскрывает исходный key при inspection. Envelope
содержит version, `tags`, `stale`, `timestamp`, `expire`, `revalidate` и полностью прочитанные bytes
stream; формат использует length-prefixed metadata и raw body без base64 overhead.

| Key family                   | Value                                      | Lifetime                      |
| ---------------------------- | ------------------------------------------ | ----------------------------- |
| `<namespace>:entry:<sha256>` | Versioned metadata + complete stream bytes | `min(entry.expire, max TTL)`  |
| `<namespace>:tag:<sha256>`   | `staleAt`/`expiredAt` timestamps           | max entry TTL + safety margin |

`set` сначала await-ит `pendingEntry`, полностью читает stream с size limit и только затем делает
один `SET` с TTL. Stream error, oversize или serialization error не оставляет partial value.
Process-local pending map гарантирует, что concurrent `get` того же key ждёт незавершённый local
`set`, как требует Next.js interface. Межпроцессный lock сознательно не добавляется; последний
полностью завершённый atomic write побеждает.

`get` ждёт local pending write, atomically читает и валидирует envelope, восстанавливает новый
`ReadableStream` и удаляет corrupt/expired entry best effort. Storage TTL ограничивается, даже если
Next default `expire` намного больше: ранний miss корректен и ограничивает cache retention.

### 6. Tag timestamps координируются напрямую через Valkey

Handler не держит authoritative local tag manifest. `getExpiration()` возвращает `Infinity`,
сигнализируя Next.js передавать soft tags в `get`; `refreshTags()` поэтому является no-op. Один
batched read получает state explicit entry tags и soft tags непосредственно из Valkey на каждом
cache lookup.

`updateTags(tags)` записывает `expiredAt=now` для immediate invalidation. Вызов с
`durations.expire` атомарно записывает `staleAt=now` и `expiredAt=now+expire`: до expiration entry
возвращается с `revalidate=-1` для stale-while-revalidate, после — становится miss. MULTI/EXEC
обновляет группу tags как одну операцию. Tag marker TTL длиннее максимально возможного entry TTL,
поэтому marker не исчезает, пока может существовать затронутый entry.

Прямые shared reads выбраны вместо pub/sub/local manifest: они проще, не теряют invalidation при
reconnect и детерминированно проверяются на двух replicas. Цена — дополнительный batched Valkey
round trip на hit.

### 7. Build не зависит от запущенного Valkey, runtime handler входит в standalone

Cache handler path разрешается ESM-safe абсолютным путём и остаётся настроенным при build и
runtime. Во время Next production-build phase adapter работает как no-op/miss без попытки внешнего
connection; production image build не требует уже запущенного Compose service и не прогревает
runtime Valkey.

В standalone output MUST попасть сам handler, codec и `iovalkey`. Verification запускает final
image без source mounts и проверяет module loading внутри обеих replicas. Runtime env создаёт lazy
connections только после старта процесса.

### 8. Failure policy различает cache optimization и invalidation correctness

| Failure                                     | Handler behavior                                                      |
| ------------------------------------------- | --------------------------------------------------------------------- |
| Entry/tag read, decode или connection error | Log sanitized event, increment error metric, return miss              |
| Entry write/oversize/stream error           | Drop write, increment metric, allow rendered response                 |
| `refreshTags`                               | No external I/O; resolve successfully                                 |
| `updateTags` write failure                  | Reject operation so mutation cannot report false invalidation success |
| Corrupt stored envelope                     | Best-effort delete, then miss                                         |

Prometheus получает bounded-label counters для hit/miss/write/error/invalidation и latency без
cache key/tag labels. Per-request success не логируется; repeated backend failures rate-limit-ятся,
чтобы outage не создавал log storm. Метрики остаются process-local, как и текущий registry.

### 9. Multi-replica test использует закрытый diagnostic probe

Добавляется route-local probe, доступный только при `CACHE_PROBE_ENABLED=true`, непроизводственном
`APP_ENV`/CI и корректном test token. Иначе route возвращает 404. Probe валидирует bounded random
key, а cached function с `cacheTag` и коротким explicit `cacheLife` возвращает `generatedBy` и
`generatedAt`; route снаружи cache scope добавляет `servedBy`.

Test overlay включает probe только для проверки. Automation обращается напрямую к Compose replica
indexes:

1. Replica 1 создаёт значение.
2. Replica 2 возвращает то же `generatedBy/generatedAt`, доказывая shared hit.
3. Replica 1 выполняет immediate tag invalidation.
4. Replica 2 создаёт новое значение, доказывая cross-instance invalidation.
5. Recreation одной Next.js replica сохраняет hit из Valkey.
6. Valkey restart даёт общий cold cache; Valkey outage оставляет GET rendering доступным, но
   invalidation корректно завершается ошибкой.

Unit tests отдельно проверяют codec/streams/limits, а integration tests с двумя независимыми
handler instances — TTL, pending sets, explicit/soft tags, corrupt data и failure policy. Probe не
становится пользовательским API и проходит security review.

## Risks / Trade-offs

- [Prerequisite ещё не применён и его файлы могут измениться] → Жёстко остановить apply до его
  завершения, затем перечитать фактические Compose/Docker/env artifacts и адаптировать минимальный
  diff без перезаписи пользовательских изменений.
- [Remote lookup добавляет latency каждому cache hit] → Использовать один entry GET и batched tag
  read, connection reuse, bounded timeouts и измерять latency/hit ratio до дальнейшей оптимизации.
- [Две replicas одновременно вычисляют один cold key] → Принимать duplicate work как cache-miss
  cost; distributed lock оставить отдельной оптимизацией после измерений.
- [Buffering stream увеличивает process memory] → Ограничить entry bytes, отбрасывать partial/
  oversize writes и не логировать payload.
- [Tag cardinality растёт] → Hash keys, bounded marker TTL длиннее bounded entry TTL и deployment
  namespace rotation.
- [Clock skew нарушает timestamp comparison] → Текущий scope — containers одного Docker host;
  multi-host deployment потребует синхронизированных clocks либо server-side Valkey TIME/Lua.
- [Valkey eviction снижает hit ratio] → Выделить maxmemory/container overhead, использовать TTL-aware
  policy и считать eviction/cold cache допустимым, но измеримым событием.
- [Valkey outage делает invalidation недоступной] → Reads/writes деградируют безопасно, но
  invalidation возвращает ошибку; readiness не маскирует нарушение консистентности.
- [Diagnostic route случайно включён] → Три независимых gate, token check, ограниченный input,
  отсутствие arbitrary cache access и security review.

## Migration Plan

1. Проверить завершение `add-docker-compose-modes` и зафиксировать его фактическую topology.
2. Добавить exact client dependency, server env и unit-tested codec/handler без включения в config.
3. Добавить Valkey service и integration tests, затем проверить memory/health/outage настройки.
4. Подключить `cacheHandlers.default`, проверить build-safe no-op и standalone trace.
5. Добавить gated probe и выполнить полный two-replica test matrix в dev и production overlays.
6. Обновить документацию/observability и только после успешной проверки включить shared handler как
   default.

Rollback: отключить custom `cacheHandlers.default`, пересобрать обе replicas и удалить Valkey
service/env после остановки topology. Данных для миграции нет; cache можно потерять полностью.

## Open Questions

Блокирующих вопросов нет. Safe example defaults для Valkey memory, entry-size и TTL limits должны
быть подтверждены измерением на fixture payload во время implementation; production capacity и
managed/HA Valkey остаются deployment-specific последующей задачей.
