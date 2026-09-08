# Переменные окружения

> Тип: справочник · Статус: актуально · Источник истины: `src/env/server.ts`, `src/env/client.ts`,
> `next.config.ts` и `.env.example`

Переменные проверяются через `@t3-oss/env-nextjs` и Zod. `next.config.ts` импортирует обе схемы:
без обязательной переменной `dev` или `build` может остановиться до компиляции.

## Локальный старт

```bash
cp .env.example .env
npm run dev
```

`.env` игнорируется Git: не коммитьте его. `.env.example` содержит локальные заглушки; замените
URL и учётные данные для реального окружения.

## Server variables

| Переменная          | Contract                        | Основной потребитель                                 | Безопасный пример                  |
| ------------------- | ------------------------------- | ---------------------------------------------------- | ---------------------------------- |
| `APP_NAME`          | Обязательная строка             | OTEL service, logger, metrics, Sentry project        | `nextjs_starter`                   |
| `APP_ENV`           | `LOCAL\|WORK\|RC\|PROD`         | Server Sentry environment                            | `LOCAL`                            |
| `BACK_INTERNAL_URL` | Обязательный URL                | Server API transport и development rewrite           | `http://localhost:8080`            |
| `CI`                | Строка `true\|false` → boolean  | Test/runner behavior                                 | `false`                            |
| `FRONT_HOST`        | Обязательная строка             | Сейчас только schema/deployment compatibility        | `front`                            |
| `PORT`              | Строка → number                 | Next.js process/container port contract              | `3000`                             |
| `HTTP_AUTH_LOGIN`   | Необязательная строка           | Зарезервировано; runtime consumer сейчас отсутствует | `demo`                             |
| `HTTP_AUTH_PASS`    | Необязательная строка           | Зарезервировано; runtime consumer сейчас отсутствует | `demo`                             |
| `MOCK_MODE`         | String boolean, default `false` | Server и fallback browser mock mode                  | `false`                            |
| `SENTRY_DSN`        | Обязательный URL                | Server Sentry initialization                         | `https://public@example.invalid/1` |
| `SENTRY_AUTH_TOKEN` | Обязательная строка             | Source map upload при production build               | `replace-me`                       |
| `SENTRY_ORG`        | Обязательная строка             | Sentry build plugin                                  | `example`                          |
| `SENTRY_URL`        | Обязательный URL                | Self-hosted/hosted Sentry endpoint                   | `https://sentry.example.invalid`   |

`FRONT_HOST` и `HTTP_AUTH_*` нужны для совместимости развёртывания, но пока не используются
приложением и не означают включённую HTTP-аутентификацию.

Серверная схема сейчас требует все четыре значения Sentry даже при условном подключении;
пустая строка станет `undefined` и не пройдёт проверку.

## Browser-visible variables

| Переменная               | Contract                        | Потребитель                              | Безопасный пример                  |
| ------------------------ | ------------------------------- | ---------------------------------------- | ---------------------------------- |
| `NEXT_PUBLIC_APP_ENV`    | `LOCAL\|WORK\|RC\|PROD`         | Client Sentry environment                | `LOCAL`                            |
| `NEXT_PUBLIC_FRONT_URL`  | Обязательный URL                | Sitemap и development allowed origin     | `http://localhost:3000`            |
| `NEXT_PUBLIC_BFF_PATH`   | Обязательная строка             | Browser dev API base и Next.js rewrite   | `/bff-api`                         |
| `NEXT_PUBLIC_BACK_URL`   | Обязательный URL                | Browser production API base              | `http://localhost:8080`            |
| `NEXT_PUBLIC_MOCK_MODE`  | String boolean, default `false` | Browser mock mode                        | `false`                            |
| `NEXT_PUBLIC_SENTRY_DSN` | Обязательный URL                | Client Sentry и build-time Sentry switch | `https://public@example.invalid/1` |

`NEXT_PUBLIC_` доступны браузеру и не должны содержать секреты. Обычно они встраиваются при
`next build`: окружение готового образа не гарантирует изменения клиентского поведения.

Если `NEXT_PUBLIC_MOCK_MODE` не задан, используется `MOCK_MODE`. Лучше задавать оба флага явно,
чтобы упростить проверку развёртывания.

## Test-only и framework variables

| Переменная     | Schema | Поведение                                                   |
| -------------- | ------ | ----------------------------------------------------------- |
| `FRONT_PORT`   | Нет    | Playwright base URL/web server port, default `3000`         |
| `NODE_ENV`     | Next   | Управляется scripts/framework; вручную обычно не задаётся   |
| `NEXT_RUNTIME` | Next   | Используется для runtime branching; не является user config |

`FRONT_PORT` настраивает Playwright, `PORT` — сервер Next.js. Меняя любой для E2E, сверьте адрес
клиента с адресом слушающего сервера.

Vitest передаёт только разрешённые переменные: сначала из `process.env`, затем из корневого `.env`.
Не перечитывайте `.env` в каждом тестовом файле.

## Build-time и runtime

| Категория                  | Нужна при build              | Нужна при runtime                | Комментарий                         |
| -------------------------- | ---------------------------- | -------------------------------- | ----------------------------------- |
| `NEXT_PUBLIC_*`            | Да                           | Обычно нет для уже собранного JS | Встроены в client output            |
| BFF/server API URL         | Да                           | Да                               | Config validation + server requests |
| Server Sentry/APP metadata | Да                           | Да                               | Build plugin + instrumentation      |
| `PORT`                     | Да по текущей schema         | Да                               | Next process слушает runtime port   |
| Mock flags                 | Да по текущей schema/default | По необходимости                 | Build и runtime могут различаться   |

Текущая схема требует многие переменные среды выполнения уже при сборке, включая чистый
CI/Docker без `.env`.

## Добавление переменной

1. Проверьте, нужно ли значение браузеру. Секреты всегда остаются на сервере.
2. Добавьте серверное значение в `src/env/server.ts`, браузерное — в `src/env/client.ts` с
   `NEXT_PUBLIC_`.
3. Добавьте безопасную заглушку в `.env.example`.
4. Обновите настройки развёртывания Docker/CI, если им нужно значение.
5. Разрешите ключ в Vitest, только если тесты импортируют его потребителя.
6. Обновите эту таблицу и профильный документ.

Не логируйте всё окружение, заголовки авторизации, cookies, токены DSN и учётные данные.

## Связанные документы

- [BFF proxy](bff-proxy.md)
- [Mock mode](mock-mode.md)
- [Deployment](deployment.md)
- [Testing guidelines](testing-guidelines.md)
