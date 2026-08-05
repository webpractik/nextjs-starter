# Запуск приложения через Docker Compose

> Назначение: запустить development или локальный production-режим с двумя Next.js-репликами за
> единым Traefik gateway.
>
> Актуальный статус проверок и production-ограничения поддерживаются в
> [руководстве по развёртыванию](deployment.md). Эта страница описывает только локальный запуск.

Руководство рассчитано на разработчика, знакомого с Docker Compose. Оно использует корневой
`Makefile`, общий `.env` и Compose-файлы из корня репозитория.

## Требования

- Docker Engine или Docker Desktop;
- Docker Compose v2;
- BuildKit для production-сборки;
- свободный локальный порт `3000` или другое значение `FRONT_PORT`.

## Что запускает Compose

Базовая topology состоит из двух внутренних реплик сервиса `nextjs`, общего Valkey и одного
Traefik gateway. Только Traefik публикует порт на host; application containers открывают порт
`3000`, а Valkey — `6379` только внутри project network.

Valkey используется как эфемерный shared cache, а не как durable storage:

- RDB snapshots и AOF выключены, persistent volume не подключён;
- default `VALKEY_MAXMEMORY=128mb`, container limit `VALKEY_MEMORY_LIMIT=192m`;
- при достижении `maxmemory` действует policy `volatile-ttl`, которая сначала вытесняет keys с
  ближайшим TTL;
- restart или recreation Valkey обнуляет cache и приводит к cold start.

Все записи handler получают TTL. Не публикуйте `6379` вручную для обычного запуска: Compose не
настраивает для Valkey authentication или TLS, а доступ ограничен project network.

Development и production overlays используют одинаковые project и service names. Запуск другого
режима заменяет текущие containers и удаляет orphan containers, а не создаёт вторую параллельную
topology.

## 1. Подготовьте переменные окружения

Compose и npm-команды используют один корневой `.env`. `.env.example` — единственный template;
отдельный `.env.compose.example` не нужен.

```bash
test -e .env || cp .env.example .env
```

Команда не перезаписывает существующий `.env`. Перед запуском замените placeholder credentials и
проверьте обязательные значения по [справочнику переменных окружения](environment.md).

Если `.env` был создан до появления shared cache, синхронизируйте его с `.env.example`. Для
Compose обязательны `VALKEY_URL`, `VALKEY_CACHE_NAMESPACE`, `VALKEY_CACHE_MAX_TTL_SECONDS` и
`VALKEY_CACHE_MAX_ENTRY_BYTES`; команда `compose config` остановится, если одного из них нет.
Значение URL для этой topology должно оставаться `redis://valkey:6379`.

Namespace должен отличаться между окружениями и быть одинаковым у обеих реплик. При несовместимом
изменении cache format замените версию целиком, например:

```dotenv
VALKEY_CACHE_NAMESPACE=nextjs-starter:local:v2
```

Rotation создаёт холодный cache; старые keys остаются недоступными до TTL или eviction. Подробный
контракт limits и build/runtime приведён в [справочнике переменных](environment.md#valkey-cache).

Если backend работает на Docker host, измените только существующий server URL:

```dotenv
BACK_INTERNAL_URL=http://host.docker.internal:8080
```

`NEXT_PUBLIC_BACK_URL` должен оставаться доступным браузеру на host. Compose добавляет mapping для
`host.docker.internal`, в том числе для Linux.

## 2. Запустите development-режим

Сначала проверьте объединённую конфигурацию, затем запустите topology:

```bash
make compose-config-dev
make compose-dev
```

`make compose-dev` работает в attached-режиме, поэтому в терминале видны логи обеих реплик и
gateway. После прохождения health checks откройте:

<http://nextjs-starter.127.0.0.1.nip.io:3000>

Имя содержит loopback IP в формате nip.io и работает без изменения `/etc/hosts`. Более короткое
`nextjs-starter.nip.io` не содержит IP и сейчас не имеет DNS-адреса, поэтому не может быть рабочим
default. `http://localhost:3000` остаётся эквивалентным loopback-адресом.

Development overlay:

- собирает Dockerfile target `development` и запускает два процесса `next dev`;
- монтирует рабочее дерево, чтобы обе реплики видели изменения исходников;
- выдаёт каждой реплике изолированные `/app/node_modules` и `/app/.next` volumes;
- включает dev-only cookie affinity в Traefik, чтобы HTML, chunks и HMR WebSocket одной browser
  session попадали в создавшую их реплику;
- не переносит affinity в production, где сохраняется round-robin балансировка.

## 3. Запустите production-режим

Проверьте конфигурацию и соберите image без запуска, если хотите отделить build от startup:

```bash
make compose-config-prod
make compose-build-prod
```

Запуск production выполняется detached и ожидает health checks:

```bash
make compose-prod
```

Production overlay использует минимальный non-root standalone runner, не монтирует исходники и
запускает обе реплики из одного image. `SENTRY_AUTH_TOKEN` передаётся production build как BuildKit
secret, а не как Docker build argument. Базовый Compose пока также передаёт token в runtime
environment; не используйте этот контракт как готовый production default.

Builder валидирует Valkey env с локальным служебным URL, но cache handler в build phase не выполняет
network I/O. Обе запущенные реплики получают реальный `VALKEY_URL` и общий namespace только из
runtime environment.

Для локальной browser-проверки production открывайте <http://localhost:3000>. Production CSP
содержит `upgrade-insecure-requests`, поэтому HTTP-страница на nip.io пытается загрузить assets по
HTTPS, а локальный Traefik намеренно не завершает TLS. Адрес nip.io остаётся основным для
development; production через доменное имя проверяйте уже за реальным TLS ingress.

Перед использованием production-команд проверьте текущий статус в
[руководстве по развёртыванию](deployment.md) и ограничения нескольких реплик в
[описании self-hosting](self-hosting.md).

## Справочник Compose-команд

Обычный container lifecycle находится в корневом `Makefile`. Отдельные cache test scripts из
`package.json` используют изолированные Compose projects и не заменяют эти targets.

| Команда                    | Назначение                                                        |
| -------------------------- | ----------------------------------------------------------------- |
| `make compose-config-dev`  | Проверить объединённую development-конфигурацию                   |
| `make compose-config-prod` | Проверить объединённую production-конфигурацию                    |
| `make compose-build-dev`   | Собрать development image без запуска containers                  |
| `make compose-build-prod`  | Собрать standalone production image без запуска containers        |
| `make compose-dev`         | Собрать и запустить две attached dev-реплики за Traefik           |
| `make compose-prod`        | Собрать и запустить production detached с ожиданием health checks |
| `make compose-ps`          | Показать состояние gateway, реплик и Valkey                       |
| `make compose-logs`        | Следить за логами текущего Compose project                        |
| `make compose-down`        | Удалить containers, project network и anonymous volumes           |

По умолчанию targets используют project `nextjs-starter` и корневой `.env`. Внешний env-файл
можно выбрать без копирования или дублирования application variables:

```bash
make compose-prod COMPOSE_ENV_FILE=/secure/path/app.env
```

`COMPOSE_PROJECT_NAME` пока не меняйте: Compose labels и Traefik config жёстко ссылаются на network
`nextjs-starter_default`. Cache matrix этого не обнаруживает, потому что обращается к репликам
напрямую и не запускает gateway.

`make compose-down` не удаляет рабочее дерево и `.env`.

## 4. Проверьте запущенное приложение

Проверьте состояние containers и доступность HTTP endpoints. Для development используйте адрес
nip.io, для локального production — `localhost`:

```bash
make compose-ps
base_url=http://nextjs-starter.127.0.0.1.nip.io:3000 # development
# base_url=http://localhost:3000                    # local production
curl --fail "$base_url/"
curl --fail "$base_url/api/health"
curl --fail "$base_url/api/ready"
curl --fail "$base_url/api/metrics"
```

Эти команды подтверждают доступность HTTP-процесса, но не backend и не high availability.
Сохранённые результаты smoke-проверок находятся в [deployment status](deployment.md).

### Проверьте shared cache отдельно

Focused integration test поднимает только Valkey в изолированном Compose project, временно
публикует случайный loopback port, запускает четыре handler tests и удаляет topology:

```bash
npm run test:cache:integration
```

Он проверяет обмен entries и tag invalidation между независимыми clients, а не Next.js replicas.
Для полного cache matrix через две реплики и закрытый test-only probe предусмотрены отдельные
команды. Matrix script сам собирает свежий image соответствующего режима.

```bash
npm run test:cache:matrix:dev
npm run test:cache:matrix:prod
npm run verify:cache:compose
```

Каждая matrix-команда создаёт уникальные token и namespace и проверяет cross-replica
read/invalidation, recreation реплики, cold cache после recreation Valkey, поведение при outage и
cache metrics обеих реплик, после чего выполняет Compose cleanup. Отдельная команда
`verify:cache:compose` проверяет normalized dev/prod/test models, отсутствие production
port/volume, memory/persistence/health settings, missing env и failing healthcheck. Все команды
используют `.env.example` и не входят в обычный `npm run test` или `npm run verify`. Requests matrix
идут напрямую между application containers, поэтому они не проверяют Traefik или browser behavior.

## Связанные документы

- [Переменные окружения](environment.md)
- [Развёртывание](deployment.md)
- [Self-hosting и несколько реплик](self-hosting.md)
- [Наблюдаемость и служебные endpoints](observability.md)
- [Безопасность](security.md)
