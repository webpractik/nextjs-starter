## Why

Две Next.js-реплики из `add-docker-compose-modes` по умолчанию имеют независимый in-memory cache:
cache hits, tag invalidation и состояние после restart различаются между процессами. Нужен общий
Valkey backend и проверяемый custom `cacheHandlers.default`, чтобы обычный `'use cache'` работал
согласованно на обеих репликах.

## Dependency

Этот change MUST применяться только после завершения и проверки `add-docker-compose-modes`: он
расширяет созданные там `compose.yaml`, dev/prod overlays, env template и topology из двух Next.js
replicas за gateway. Зависимость также записана в `goal` файла `.openspec.yaml`.

## What Changes

- Добавить внутренний Valkey service в Compose topology: pinned image, healthcheck, memory limit,
  cache eviction policy, отсутствие host port и явно выбранная cache-only persistence policy.
- Добавить server-only Valkey connection/cache namespace settings и точную npm dependency клиента,
  совместимого с Node.js 24 и Alpine runtime.
- **BREAKING**: полный dev/build/runtime env-контракт потребует новые обязательные Valkey/cache
  значения; example и Compose env templates будут обновлены одновременно.
- Реализовать versioned custom `cacheHandlers.default` для Cache Components: безопасно
  сериализовать `ReadableStream`, хранить entries с bounded TTL, восстанавливать stream, соблюдать
  pending-set contract и ограничивать размер одной записи.
- Координировать explicit и soft tag invalidation через общий Valkey state, включая семантику
  `updateTag`, `revalidateTag` и `revalidatePath` между разными Next.js processes.
- Обеспечить контролируемую деградацию при недоступном Valkey: reads становятся cache miss, failed
  writes не ломают rendering, а неподтверждённая invalidation не скрывается как успешная.
- Добавить unit/integration tests и gated diagnostic probe, который доказывает cache hit и
  invalidation между двумя реальными standalone replicas, а также поведение при restart/outage.
- Добавить cache hit/miss/error observability без логирования URL, credentials, cache payload или
  пользовательских cache keys и обновить cache/deployment документацию.

## Capabilities

### New Capabilities

- `valkey-cache-service`: Изолированный, health-checked и ограниченный по памяти Valkey service для
  общей cache topology в dev/prod Compose.
- `distributed-next-cache`: Valkey-backed реализация Next.js `cacheHandlers.default`,
  cross-instance tag coordination, graceful degradation и multi-replica verification.

### Modified Capabilities

Нет. Изменения расширяют capability зависимого change, который ещё не архивирован в базовые specs.

## Impact

- Затрагиваются Compose/Docker/env artifacts из `add-docker-compose-modes`, `next.config.ts`, server
  env schema, `.env.example`, test env allowlist, deployment/cache документация и standalone trace.
- Появятся server-only cache handler/codec/client modules, tests и выключенный по умолчанию
  diagnostic endpoint либо эквивалентный test harness для обращения к конкретной replica.
- В корневые `package.json` и `package-lock.json` добавится exact версия `iovalkey`; browser bundle и
  публичный HTTP API приложения не получают Valkey dependency.
- Legacy `cacheHandler` для ISR/fetch/image cache и `'use cache: private'` не изменяются: задача
  настраивает plural `cacheHandlers` contract для `'use cache'`.
- Valkey остаётся производным cache, а не источником истины; его потеря может снизить
  производительность, но не должна повреждать application data.
