## ADDED Requirements

### Requirement: Внутренний Valkey service

После применения prerequisite Compose topology MUST запускать один Valkey service на общей
внутренней network с двумя Next.js replicas, используя immutable pinned official image и не
публикуя Valkey port на host.

#### Scenario: Development topology

- **WHEN** operator запускает базовый Compose-файл с development overlay
- **THEN** один Valkey container доступен обеим Next.js replicas по service DNS и недоступен через
  host port mapping

#### Scenario: Production topology

- **WHEN** operator запускает базовый Compose-файл с production overlay
- **THEN** обе standalone replicas получают один и тот же server-only Valkey URL

### Requirement: Health-gated startup

Valkey service MUST иметь healthcheck через `valkey-cli ping`, а initial Next.js startup MUST ждать
healthy Valkey в documented detached lifecycle.

#### Scenario: Valkey готов принимать команды

- **WHEN** Valkey отвечает `PONG` в пределах startup timeout
- **THEN** обе Next.js replicas запускаются и общая topology достигает healthy status

#### Scenario: Valkey не готов

- **WHEN** Valkey не проходит healthcheck до истечения timeout
- **THEN** Compose startup не сообщает topology как готовую и показывает Valkey как failing
  dependency

### Requirement: Bounded cache-only memory

Valkey MUST иметь configurable `maxmemory`, container memory headroom, TTL-aware eviction policy и
MUST хранить только keys с ограниченным lifetime.

#### Scenario: Cache достигает memory limit

- **WHEN** новые entries превышают настроенный Valkey `maxmemory`
- **THEN** Valkey удаляет подходящие TTL cache keys согласно policy вместо неограниченного роста
  dataset

### Requirement: Cache не использует persistence

Compose Valkey MUST отключать RDB/AOF, не монтировать data volume и рассматриваться как полностью
восстанавливаемый cache, а не источник application data.

#### Scenario: Valkey container пересоздан

- **WHEN** Valkey container удалён и создан заново
- **THEN** старые entries и tag markers отсутствуют, а Next.js продолжает работу через cold-cache
  regeneration

### Requirement: Сетевые данные и credentials изолированы

Valkey URL и credentials MUST быть server-only, MUST NOT входить в browser bundle, image metadata,
logs или diagnostic responses; cache service MUST принимать трафик только из Compose network.

#### Scenario: Проверка конфигурации и логов

- **WHEN** operator инспектирует client bundle, image configuration и application logs
- **THEN** URL credentials и cache payload отсутствуют, а port `6379` не опубликован на host

### Requirement: Runtime outage не делает cache источником отказа rendering

После успешного startup потеря Valkey MUST переводить cache reads/writes в documented degraded
mode, сохраняя возможность fresh rendering Next.js страниц и probe GET.

#### Scenario: Valkey остановлен после прогрева

- **WHEN** обе Next.js replicas работают, а Valkey становится недоступен
- **THEN** uncached rendering остаётся доступным в пределах bounded client timeout и cache errors
  отражаются в observability
