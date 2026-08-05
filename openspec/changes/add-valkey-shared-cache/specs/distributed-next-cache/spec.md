## ADDED Requirements

### Requirement: Правильный Cache Components handler contract

Next.js MUST настраивать Valkey adapter через plural `cacheHandlers.default` для обычного
`'use cache'`; adapter MUST реализовывать `get`, `set`, `refreshTags`, `getExpiration` и
`updateTags` согласно interface установленной версии Next.js.

#### Scenario: Next.js загружает custom handler

- **WHEN** dev server или standalone server инициализирует Cache Components runtime
- **THEN** handler module успешно загружается как default без настройки legacy `cacheHandler` или
  private handler

### Requirement: Полный и атомарный CacheEntry round trip

Handler MUST полностью await/read `pendingEntry`, сохранить versioned metadata и stream bytes одной
atomic записью, а при чтении восстановить эквивалентный новый `ReadableStream<Uint8Array>`.

#### Scenario: Entry успешно записан и прочитан

- **WHEN** `set` получает complete multi-chunk stream и затем `get` вызывается с тем же key
- **THEN** bytes, tags, stale, timestamp, expire и revalidate совпадают с исходным entry

#### Scenario: Stream завершается ошибкой

- **WHEN** pending stream падает после partial data
- **THEN** handler не сохраняет partial entry и следующий `get` возвращает cache miss

### Requirement: Pending set contract

Внутри одного process `get` того же key MUST дождаться уже начатого `set`, прежде чем возвращать
entry или miss.

#### Scenario: Get приходит во время set

- **WHEN** `get` вызывается до разрешения pending entry того же cache key
- **THEN** `get` ждёт завершения local set и возвращает полностью сохранённый entry

### Requirement: Namespace, size и lifetime ограничены

Storage keys MUST использовать deployment-aware namespace и hash исходного cache key; handler
MUST отклонять oversize entries и ограничивать физический TTL configured maximum без продления
семантического lifetime Next.js.

#### Scenario: Две replicas одного deployment

- **WHEN** обе replicas используют одинаковый namespace и cache key
- **THEN** они обращаются к одной Valkey entry без раскрытия исходного key в storage key

#### Scenario: Entry превышает size limit

- **WHEN** serialized stream больше настроенного maximum bytes
- **THEN** response продолжает обслуживаться, запись пропускается и bounded metric фиксирует
  oversize outcome

#### Scenario: Next expire больше storage maximum

- **WHEN** CacheEntry объявляет `expire`, превышающий configured max TTL
- **THEN** Valkey key получает max TTL и может безопасно стать ранним cache miss

### Requirement: Time-based stale и expire semantics сохранены

До `revalidate` entry MUST быть fresh, между `revalidate` и `expire` MUST быть доступен для
stale-while-revalidate, а после `expire` MUST возвращаться miss независимо от оставшегося storage
key.

#### Scenario: Entry достиг revalidate времени

- **WHEN** entry старше `revalidate`, но моложе `expire`
- **THEN** Next.js может вернуть stale value и инициировать background regeneration

#### Scenario: Entry достиг expire времени

- **WHEN** текущий timestamp позже `entry.timestamp + entry.expire`
- **THEN** handler удаляет entry best effort и возвращает miss

### Requirement: Explicit tag invalidation разделяется между replicas

`updateTags` MUST атомарно записывать shared timestamps, а `get` MUST сравнивать explicit entry tags
с timestamp entry и применять immediate либо profiled stale/expire semantics.

#### Scenario: Immediate invalidation на другой replica

- **WHEN** replica 1 немедленно invalidates tag entry, созданного replica 2
- **THEN** следующий read replica 2 не возвращает старый entry и генерирует новое значение

#### Scenario: Profiled stale-while-revalidate

- **WHEN** tag обновлён с ненулевым `durations.expire`
- **THEN** старый entry помечается stale до указанного expiration, а затем становится miss

### Requirement: Soft tags обрабатываются через shared state

Handler MUST сигнализировать обработку soft tags внутри `get` и MUST применять shared
`revalidatePath` timestamps ко всем replicas без process-local authoritative manifest.

#### Scenario: Path invalidated на первой replica

- **WHEN** replica 1 вызывает `revalidatePath` для пути с cached value
- **THEN** replica 2 обнаруживает более новый soft-tag timestamp и не обслуживает invalid entry

### Requirement: Cache read/write failures деградируют безопасно

Entry/tag read или decode failure MUST возвращать miss, а entry write failure MUST завершаться без
ошибки rendering; corrupt payload MUST удаляться best effort.

#### Scenario: Valkey read завершается ошибкой

- **WHEN** handler не может прочитать entry или его tag state
- **THEN** cache scope вычисляется заново вместо render error или potentially invalid hit

#### Scenario: Valkey write завершается ошибкой

- **WHEN** rendered CacheEntry невозможно сохранить
- **THEN** пользователь получает fresh response, а следующий request снова является miss

#### Scenario: Payload повреждён

- **WHEN** stored envelope имеет неизвестную version, invalid metadata или truncated body
- **THEN** handler не возвращает payload, удаляет key best effort и фиксирует decode error metric

### Requirement: Invalidation failure не скрывается

`updateTags` MUST отклонять promise, если shared invalidation state не записан полностью, чтобы
mutation caller не получал ложное подтверждение cross-instance invalidation.

#### Scenario: Valkey недоступен при mutation invalidation

- **WHEN** Server Action или Route Handler инициирует tag invalidation во время Valkey outage
- **THEN** операция сообщает ошибку и не утверждает, что другие replicas увидели invalidation

### Requirement: Build и standalone packaging не требуют внешнего cache

Production build MUST работать без запущенного Valkey, а final standalone image MUST включать
handler, codec и Valkey client и активировать их только на runtime.

#### Scenario: Clean production build без Valkey

- **WHEN** `npm run build` выполняется с валидным env, но без доступного Valkey endpoint
- **THEN** build использует no-op/miss cache behavior и успешно создаёт standalone output

#### Scenario: Standalone runtime запускается

- **WHEN** final image стартует рядом с healthy Valkey
- **THEN** обе replicas загружают traced handler dependency и создают независимые client
  connections к общему storage

### Requirement: Observability имеет bounded cardinality и не раскрывает данные

Handler MUST публиковать hit/miss/write/error/invalidation counters и latency с ограниченными
labels и MUST NOT использовать cache keys, tags, payload, URL или credentials как labels/log data.

#### Scenario: Cache hit и backend error

- **WHEN** replica обслуживает hit, а затем испытывает Valkey error
- **THEN** её metrics отражают оба outcome без появления пользовательских или connection данных

### Requirement: Две реальные Next.js replicas проверяются детерминированно

Test automation MUST доказать cross-instance hit, immediate invalidation, Next replica recreation,
Valkey cold restart и outage behavior на topology из prerequisite.

#### Scenario: Cross-instance cache hit

- **WHEN** replica 1 генерирует probe value, а replica 2 читает тот же probe key
- **THEN** replica 2 сообщает собственный `servedBy`, но те же `generatedBy` и `generatedAt`

#### Scenario: Cross-instance invalidation

- **WHEN** replica 1 invalidates probe tag после shared hit
- **THEN** следующий read replica 2 возвращает новое `generatedAt` и становится generator

#### Scenario: Next replica пересоздана

- **WHEN** одна Next.js replica пересоздана при работающем Valkey
- **THEN** новая replica читает актуальный shared value без обязательной regeneration

#### Scenario: Valkey пересоздан

- **WHEN** Valkey пересоздан после прогрева обеими replicas
- **THEN** следующий request создаёт cold-cache value, который затем одинаково читают обе replicas

### Requirement: Diagnostic probe выключен и закрыт по умолчанию

Probe MUST возвращать 404 без explicit test enablement, непроизводственной среды и корректного test
token; input MUST быть bounded и не давать arbitrary read/write доступа к cache namespace.

#### Scenario: Production/default request к probe

- **WHEN** client обращается к probe без всех test gates
- **THEN** route возвращает 404 и не раскрывает hostname, cache state или configuration

#### Scenario: Авторизованный test request

- **WHEN** test overlay включает probe и передаёт корректный token и bounded random key
- **THEN** route выполняет только изолированный probe read/invalidation для namespaced test tag
