## Context

Приложение — npm workspaces монорепозиторий на Node.js 24 и Next.js 16 с
`output: 'standalone'`. `next.config.ts` импортирует server/client env schemas, поэтому полный набор
обязательных значений нужен не только контейнеру во время выполнения, но и командам `next dev` и
`next build`.

Текущий Dockerfile задуман как multi-stage production build, но `deps` ссылается на удалённый
`packages/design-tokens`, builder не получает весь env-контракт, а отсутствие `.dockerignore`
позволяет отправить локальный `.env` и artifacts в build context. Compose-конфигурации нет.

Две копии приложения не могут одновременно публиковать один и тот же host-порт. Кроме того,
Next.js runtime cache и Prometheus registry находятся в памяти процесса, поэтому масштабирование
до двух контейнеров не создаёт общий cache или агрегированные метрики.

## Goals / Non-Goals

**Goals:**

- Предоставить явные, повторяемые команды запуска development или production режима через Docker
  Compose.
- По умолчанию запускать ровно две реплики выбранного Next.js-режима за одним HTTP endpoint.
- Сохранить HMR в development и проверить реальный standalone runtime в production.
- Сделать production image воспроизводимым, минимальным, непривилегированным и не содержащим
  переданные build secrets.
- Валидировать topology, health и оба режима автоматизируемыми smoke-командами.

**Non-Goals:**

- Multi-host high availability, Docker Swarm/Kubernetes, rolling deployment и автоматический
  rollback.
- TLS termination, внешний ingress, backend/database containers и production secrets manager.
- Общий Next.js cache, cross-replica invalidation, production sticky sessions или агрегация
  Prometheus registries.
- Изменение env schemas, BFF/CSP/CORS поведения, readiness semantics или CI/CD deployment pipeline.

## Decisions

### 1. Базовый Compose-файл и два mode-specific overlay

Общая topology будет описана в `compose.yaml`, а различия — в `compose.dev.yaml` и
`compose.prod.yaml`. Поддерживаемая команда всегда передаёт базовый файл и ровно один overlay.

Оба режима используют один project name и одно имя сервиса `nextjs`. При переключении raw-команда с
`--remove-orphans` пересоздаёт текущий project вместо параллельного запуска второго режима.

Compose-команды не добавляются в корневой npm application lifecycle. Корневой `Makefile` даёт
однозначные targets и сохраняет выбор env-файла и project name через переопределяемые Make
variables; документация перечисляет эти entrypoints.

Альтернатива с Compose profiles потребовала бы двух почти одинаковых Next.js services и двух
условных зависимостей gateway. Одновременное включение обоих profiles также создавало бы
неоднозначную topology. Единственный файл с shell-ветвлением по `NODE_ENV` отклонён, потому что
скрывает принципиально разные build targets и mounts.

### 2. Две внутренние реплики и один reverse proxy

Сервис `nextjs` задаёт Compose `scale: 2`, не использует `container_name`, слушает внутренний порт
`3000` и не публикует его на host. Один gateway публикует `${FRONT_PORT:-3000}` на настраиваемом
bind address и отправляет запросы по round-robin на адреса scaled service из Docker DNS.

Gateway будет основан на закреплённом официальном Traefik image с Docker provider. Labels сервиса
создают один router/load balancer для всех Compose replicas; provider следит за Docker events и
удаляет устаревшие адреса после recreation. Traefik сохраняет `Host`, формирует forwarding headers,
поддерживает WebSocket upgrade для Next.js HMR и не включает buffering middleware для streaming.
JSON access log содержит фактический `ServiceAddr`. Только gateway создаёт стабильную внешнюю точку
входа.

Development overlay включает cookie affinity на уровне Traefik service. Она удерживает HTML,
chunks и HMR WebSocket одной browser session на replica с тем же независимым `.next`, а новые
sessions по-прежнему распределяются между двумя replicas. Production overlay не включает
affinity и сохраняет обычный round-robin.

Альтернатива с динамическими host-портами для каждой replica не даёт одного URL. Swarm ingress
выходит за рамки обычного `docker compose`, а статический список адресов не переживает recreation.
Docker provider требует read-only mount Docker socket; он выбран для корректного standalone
Compose discovery, но считается привилегированной границей доверия и явно документируется.

### 3. Отдельные development и production Docker targets

Общий dependency stage использует `npm ci`, корневой lockfile и manifests только существующих
workspaces. Development target содержит зависимости и исходники и запускает `npm run dev` на
`0.0.0.0:3000`. Dev overlay монтирует рабочее дерево, но создаёт отдельные anonymous volumes для
`/app/node_modules` и `/app/.next` каждой replica: два dev process не записывают в одну build cache
директорию.

Production builder выполняет `npm run build`; runner копирует только standalone output, static и
public assets, задаёт `NODE_ENV=production` и запускает `server.js` от пользователя `nextjs`.
Обе production replicas создаются из одного image ID без bind mounts.

Один универсальный runtime image с переключением команды отклонён: он переносил бы toolchain и
исходники в production и не проверял бы фактический standalone artifact.

### 4. Явный env-контракт и BuildKit secret

Compose получает значения из выбранного `--env-file`, явно перечисляет обязательные переменные в
`build.args` и runtime `environment`, а для отсутствующих значений использует required
interpolation. Container-specific `PORT` остаётся равен `3000`; `FRONT_PORT` управляет только
публикуемым gateway-портом.

Существующий `.env.example` остаётся единственным безопасным template для host и Compose flows;
локальный `.env` игнорируется Git и Docker build context. Для backend на Docker host документация
требует заменить единственное `BACK_INTERNAL_URL` на `host.docker.internal`, а Compose добавляет
`host-gateway` mapping для Linux. Публичный browser URL остаётся достижимым с host. Реальные
production values могут находиться во внешнем env-файле.

`SENTRY_AUTH_TOKEN` передаётся production build как BuildKit secret и экспортируется только на
время `npm run build`; он не становится Docker `ARG`/`ENV` и не копируется в final image. Runtime
пока всё равно получает token через environment, потому что существующая server schema делает его
обязательным; изменение этого контракта является отдельной задачей. Копирование `.env` в image не
используется.

### 5. Health-gated lifecycle и проверка реплик

Каждая Next.js replica получает healthcheck к существующему `/api/health`. Gateway стартует после
здорового app service и имеет собственную проверку единой точки входа. Production entrypoint
использует detached `up --build --wait --remove-orphans`; development может оставаться attached для
просмотра двух потоков логов.

Проверка включает `docker compose ... config --quiet` для каждого overlay, сборку targets, подсчёт
двух healthy containers через `docker compose ps`, HTTP smoke через gateway и подтверждение обоих
upstream адресов в gateway access log. Dev smoke отдельно проверяет HMR/WebSocket после изменения
source, production smoke — standalone process и отсутствие bind mounts.

### 6. Production-реплики считаются stateless в рамках этой topology

В production gateway не добавляет session affinity. Dev-only cookie affinity нужна только для
согласованности independently compiled assets и HMR. Документация явно указывает, что cache и
metrics остаются process-local, а `/api/ready` пока не проверяет upstream dependencies. Compose не
заявляет cross-replica cache consistency или production-grade observability; такие свойства
требуют отдельного shared backend/collector design.

## Risks / Trade-offs

- [Два `next dev` удваивают compilation CPU/RAM и имеют независимые caches] → Оставить две replica
  значением по умолчанию согласно требованию, документировать диагностический `--scale nextjs=1` и
  не разделять `.next`.
- [HMR или chunks ломаются при переходе browser между независимыми dev caches] → Явно настроить
  upgrade/forwarding headers, включить dev-only cookie affinity и browser smoke; production
  оставить без affinity.
- [Адреса containers меняются при recreation] → Использовать Traefik Docker provider и проверять
  восстановление после пересоздания одной replica.
- [Docker socket расширяет полномочия gateway] → Отключить auto-exposure/dashboard, монтировать
  socket read-only и документировать, что read-only Docker API всё равно чувствителен; для более
  жёсткой изоляции потребуется отдельный socket proxy или внешний orchestrator.
- [Один gateway остаётся single point of failure] → Зафиксировать single-host Compose scope; HA
  ingress относится к внешней production platform.
- [Process-local cache и metrics дают разные результаты на репликах] → Не хранить correctness state
  в памяти, документировать ограничение и проверять replicas независимо.
- [Build/runtime env могут расходиться, особенно `NEXT_PUBLIC_*`] → Использовать один выбранный
  env source на команду и перечислить значения явно; после изменения public env пересобирать image.
- [Secrets могут раскрыться через context, image history или вывод config] → Исключить env-файлы из
  context, использовать BuildKit secret, проверять final image и применять `config --quiet` в CI.
- [Backend `localhost` недостижим из контейнера] → Дать container-aware template,
  `host-gateway` mapping и отдельную smoke-проверку server API path при доступном backend.

## Migration Plan

1. Исправить Docker stages и добавить `.dockerignore`; отдельно собрать development и production
   targets с безопасным example env.
2. Добавить базовый Compose-файл, два overlays, gateway config и Compose-only значения в общий
   `.env.example` без дублирования application variables.
3. Добавить Makefile entrypoints и обновить environment/deployment документацию с lifecycle-командами.
4. Выполнить static config checks, затем smoke обоих режимов и сценарий recreation одной replica.
5. Существующие `npm run dev`, `npm run build` и `npm run prod` оставить без изменений, поэтому
   adoption Compose остаётся opt-in.

Rollback не требует миграции данных: остановить Compose project и вернуть Docker/Compose-файлы к
предыдущей версии. Обычный host-based npm flow продолжит работать независимо.

## Open Questions

Блокирующих вопросов нет. Production bind address, внешний TLS/ingress, реальные backend URLs и
secret source выбираются средой развертывания и не фиксируются в репозитории.
