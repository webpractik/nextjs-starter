# Переменные окружения

Эта страница объясняет, какие переменные нужны приложению, где они доступны и когда проверяются.

Для локального запуска создайте `.env` из безопасного шаблона:

```bash
test -e .env || cp .env.example .env
npm run dev
```

`.env` игнорируется Git и не должен попадать в коммит. Значения из `.env.example` подходят
только как локальные placeholders: для реального окружения замените URL и credentials.

Значение `VALKEY_URL=redis://valkey:6379` из шаблона рассчитано на Compose DNS. Если `npm run dev`
или `npm run prod` выполняется на host, передайте адрес доступного с host экземпляра, например
`VALKEY_URL=redis://127.0.0.1:6379 npm run dev`. Базовый Compose намеренно не публикует порт Valkey
на host.

Frontend по умолчанию доступен на <http://nextjs-starter.127.0.0.1.nip.io:3000>. nip.io разрешает
IP из имени в `127.0.0.1`, поэтому системный `hosts` изменять не нужно.

> Источники истины: `src/env/server.ts`, `src/env/client.ts`, `src/env/schemas.ts`,
> `next.config.ts`, `.env.example` и `compose*.yaml`.

Compose использует тот же `.env`; отдельный template или дублирование application variables не
нужны:

```bash
test -e .env || cp .env.example .env
make compose-config-dev
```

Защитная команда копирования не обновляет уже существующий `.env`. Если файл создан до появления
shared cache, вручную добавьте из `.env.example` все `VALKEY_*` application variables; иначе
Compose validation остановится до запуска containers.

Если container обращается к backend на Docker host, задайте в `.env`
`BACK_INTERNAL_URL=http://host.docker.internal:8080`. Compose добавляет `host-gateway` mapping для
Linux. `NEXT_PUBLIC_BACK_URL` должен быть доступен браузеру на host и потому обычно остаётся
`http://localhost:8080`.

Путь можно переопределить: `make compose-prod COMPOSE_ENV_FILE=/secure/path/app.env`.

## Когда происходит проверка

Приложение валидирует env через `@t3-oss/env-nextjs` и Zod. `next.config.ts` импортирует обе
схемы, поэтому `npm run dev` или `npm run build` может остановиться ещё до компиляции, если
обязательной переменной нет или её формат неверен.

Пустые строки преобразуются в `undefined`. Для обязательного значения пустая строка считается
ошибкой.

## Серверные переменные

Эти значения доступны только серверному коду. Не переносите их в `NEXT_PUBLIC_*`.

| Переменная                     | Формат                                          | Для чего нужна                                | Безопасный пример                  |
| ------------------------------ | ----------------------------------------------- | --------------------------------------------- | ---------------------------------- |
| `APP_NAME`                     | Обязательная строка                             | OTEL service, logger, metrics, Sentry project | `nextjs_starter`                   |
| `APP_ENV`                      | `LOCAL\|WORK\|RC\|PROD`                         | Server Sentry environment                     | `LOCAL`                            |
| `BACK_INTERNAL_URL`            | API base URL без trailing `/`, query и fragment | Server API transport и development rewrite    | `http://localhost:8080`            |
| `CACHE_PROBE_ENABLED`          | String boolean, default `false`                 | Включает изолированный cache probe            | `false`                            |
| `CACHE_PROBE_TOKEN`            | Необязательная строка, 32–256 символов          | Token изолированного cache probe              | Не задавать по умолчанию           |
| `CI`                           | Строка `true\|false`, преобразуется в boolean   | Test runners и доступ к cache probe           | `false`                            |
| `FRONT_HOST`                   | Обязательная строка                             | Совместимость с deployment contract           | `nextjs-starter.127.0.0.1.nip.io`  |
| `PORT`                         | Строка, преобразуется в number                  | Порт Next.js process/container                | `3000`                             |
| `HTTP_AUTH_LOGIN`              | Необязательная строка                           | Зарезервировано                               | `demo`                             |
| `HTTP_AUTH_PASS`               | Необязательная строка                           | Зарезервировано                               | `demo`                             |
| `MOCK_MODE`                    | String boolean, default `false`                 | Server mock mode и fallback для браузера      | `false`                            |
| `SENTRY_DSN`                   | Обязательный URL                                | Server Sentry                                 | `https://public@example.invalid/1` |
| `SENTRY_AUTH_TOKEN`            | Обязательная строка                             | Upload source maps в production build         | `replace-me`                       |
| `SENTRY_ORG`                   | Обязательная строка                             | Sentry build plugin                           | `example`                          |
| `SENTRY_URL`                   | Обязательный URL                                | Hosted или self-hosted Sentry                 | `https://sentry.example.invalid`   |
| `VALKEY_URL`                   | Обязательный URL `redis:` или `rediss:`         | Shared Cache Components backend               | `redis://valkey:6379`              |
| `VALKEY_CACHE_NAMESPACE`       | Обязательная строка, 1–100 символов             | Изоляция cache keys                           | `nextjs-starter:local:v1`          |
| `VALKEY_CACHE_MAX_TTL_SECONDS` | Положительное целое, default `86400`            | Верхняя граница TTL записи                    | `86400`                            |
| `VALKEY_CACHE_MAX_ENTRY_BYTES` | Положительное целое, default `1048576`          | Верхняя граница encoded entry                 | `1048576`                          |

`FRONT_HOST` и `HTTP_AUTH_*` сохранены ради deployment contract, но application code сейчас их
не использует. Наличие этих переменных не означает, что HTTP auth включена.

Sentry инициализируется условно, но текущая server schema всё равно требует все четыре server
Sentry variables.

Cache probe по умолчанию выключен. Route отвечает только при одновременных
`CACHE_PROBE_ENABLED=true`, `CI=true`, непроизводственном `APP_ENV` и корректном token. Это
диагностический test surface, а не production API; не включайте его в обычном deployment.

### Valkey cache

`VALKEY_URL` принимает только схемы `redis:` и `rediss:`. Для Compose используется внутреннее имя
сервиса `valkey`; production endpoint, credentials и TLS задаются окружением.

`VALKEY_CACHE_MAX_TTL_SECONDS` ограничивает время жизни каждой cache entry, а
`VALKEY_CACHE_MAX_ENTRY_BYTES` — общий размер сериализованных metadata и body. Entries больше
лимита не записываются. Application schema предоставляет defaults, но базовый `compose.yaml`
намеренно требует оба значения явно; актуальный `.env.example` уже содержит их.

Namespace входит во все entry и tag keys. Используйте разные namespace для окружений. При
несовместимом изменении codec или cache semantics увеличьте суффикс, например `:v1` → `:v2`, и
разверните одно значение на всех репликах release. Старые keys не очищаются командой rotation:
они становятся недоступны новому handler и исчезают по TTL или eviction. Schema разрешает только
буквы, цифры, `_`, `.`, `:`, `-` и ограничивает значение 100 символами.

## Публичные переменные для браузера

Все переменные с префиксом `NEXT_PUBLIC_` попадают в browser bundle. В них нельзя хранить secrets.

| Переменная               | Формат                                          | Для чего нужна                                   | Безопасный пример                             |
| ------------------------ | ----------------------------------------------- | ------------------------------------------------ | --------------------------------------------- |
| `NEXT_PUBLIC_APP_ENV`    | `LOCAL\|WORK\|RC\|PROD`                         | Client Sentry environment                        | `LOCAL`                                       |
| `NEXT_PUBLIC_FRONT_URL`  | Обязательный URL                                | Sitemap и разрешённый origin в development       | `http://nextjs-starter.127.0.0.1.nip.io:3000` |
| `NEXT_PUBLIC_BFF_PATH`   | Абсолютный path без trailing `/`                | Browser API base и Next.js rewrite в development | `/bff-api`                                    |
| `NEXT_PUBLIC_BACK_URL`   | API base URL без trailing `/`, query и fragment | Browser API base в production                    | `http://localhost:8080`                       |
| `NEXT_PUBLIC_MOCK_MODE`  | String boolean, default `false`                 | Browser mock mode                                | `false`                                       |
| `NEXT_PUBLIC_SENTRY_DSN` | Обязательный URL                                | Client Sentry и build-time Sentry switch         | `https://public@example.invalid/1`            |

Обычно `NEXT_PUBLIC_*` встраиваются во время `next build`. Изменение runtime env уже собранного
image не гарантирует, что поведение браузера изменится.

Если `NEXT_PUBLIC_MOCK_MODE` не задан, схема использует значение `MOCK_MODE`. Для понятного
deployment задавайте оба флага явно.

Оба mock-флага используют `z.stringbool()`. Без учёта регистра значения `true`, `1`, `yes`, `on`,
`y` и `enabled` означают `true`; `false`, `0`, `no`, `off`, `n` и `disabled` — `false`. Чтобы
release-конфигурация читалась однозначно, задавайте буквальные `true` или `false`.

## Допустимые URL и paths

`BACK_INTERNAL_URL` и `NEXT_PUBLIC_BACK_URL` могут содержать path prefix:

- допустимо: `https://api.example.test/v1`;
- недопустимо: `https://api.example.test/v1/`;
- недопустимы query и fragment, например `?tenant=...` или `#section`.

Query конкретного запроса добавляет API transport.

`NEXT_PUBLIC_BFF_PATH` должен:

- начинаться с `/`;
- содержать один или несколько непустых URL-safe segments;
- не заканчиваться `/`;
- не содержать query или fragment.

Например, `/bff-api/v1` допустим. Значения `/`, `bff-api`, `/bff-api/` и
`/bff-api?mode=dev` будут отклонены. Общие правила находятся в `src/env/schemas.ts` и покрыты
unit tests.

## Переменные test runners и инфраструктуры

Эти значения не входят в application schemas:

| Переменная               | Кто читает                  | Поведение                                               |
| ------------------------ | --------------------------- | ------------------------------------------------------- |
| `FRONT_BIND_ADDRESS`     | Docker Compose gateway      | Host bind; Compose default `127.0.0.1`                  |
| `FRONT_PORT`             | Docker Compose и Playwright | Внешний порт; default `3000`                            |
| `VALKEY_MAXMEMORY`       | Docker Compose Valkey       | Лимит данных Valkey; default `128mb`                    |
| `VALKEY_MEMORY_LIMIT`    | Docker Compose runtime      | Container memory limit; default `192m`                  |
| `PLAYWRIGHT_SERVER_MODE` | Playwright                  | `development` или `standalone`; default зависит от `CI` |
| `NODE_ENV`               | Next.js и scripts           | Обычно задаётся framework, а не вручную                 |
| `NEXT_RUNTIME`           | Next.js                     | Используется для runtime branching                      |

`FRONT_PORT` и `PORT` — разные переменные. Первая задаёт адрес, к которому подключается
Playwright или gateway, вторая — порт процесса Next.js. Для E2E на нестандартном порту значения
должны совпадать.

`PLAYWRIGHT_SERVER_MODE` — настройка test runner, а не application runtime. Не добавляйте её в
production deployment.

Vitest передаёт только разрешённый список env keys: сначала значения из `process.env`, затем из
корневого `.env`. Не загружайте `.env` заново в каждом test file.

## Переменные во время сборки и запуска

| Категория                    | Нужна при build             | Нужна при runtime          | Почему                                 |
| ---------------------------- | --------------------------- | -------------------------- | -------------------------------------- |
| `NEXT_PUBLIC_*`              | Да                          | Обычно нет для готового JS | Значения встроены в client output      |
| BFF и server API URL         | Да                          | Да                         | Валидация config и server requests     |
| Server Sentry и APP metadata | Да                          | Да                         | Build plugin и instrumentation         |
| `PORT`                       | Да по текущей schema        | Да                         | Порт server process                    |
| Mock flags                   | Да по schema/default        | Когда используются         | Build и runtime могут отличаться       |
| Valkey URL и namespace       | Да, без сетевого обращения  | Да                         | Config validation и shared cache       |
| Valkey limits                | Defaults есть в app schema  | Да                         | Ограничивают TTL и размер entry        |
| Cache probe                  | Default выключен, token нет | Только изолированная test  | Не является production runtime surface |

Некоторые логически runtime variables обязательны уже во время build. Это особенно важно для
CI/Docker, где нет локального `.env`.

Production builder задаёт служебные `VALKEY_URL=redis://127.0.0.1:6379` и build-only namespace.
`next.config.ts` помечает production build, поэтому handler возвращает misses и пропускает writes,
не подключаясь к этому адресу. В runner эти значения не наследуются: настоящий URL, namespace и
limits приходят из runtime environment.

`npm run prod` читает корневой `.env`, только если файл существует. Это удобно для локальной
проверки standalone build, но `.env` не следует встраивать в release artifact.

## Как добавить переменную

1. Решите, нужна ли она браузеру. Secret всегда остаётся server-only.
2. Добавьте server value в `src/env/server.ts`. Browser value добавьте в `src/env/client.ts` с
   префиксом `NEXT_PUBLIC_`.
3. Добавьте безопасный placeholder в `.env.example`.
4. Обновите Docker и CI contract, если переменная нужна при build или runtime.
5. Добавьте key в Vitest allowlist, только если тесты импортируют её consumer.
6. Обновите таблицу на этой странице и профильный документ.

Не логируйте полный env, authorization headers, cookies, DSN auth tokens или credentials.

## Связанные документы

- [BFF proxy](bff-proxy.md)
- [Mock mode](mock-mode.md)
- [Deployment](deployment.md)
- [Тестирование](testing-guidelines.md)
