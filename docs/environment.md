# Переменные окружения

> Тип: справочник · Статус: актуально · Источник истины: `src/env/server.ts`, `src/env/client.ts`,
> `next.config.ts` и `.env.example`

Приложение валидирует environment через `@t3-oss/env-nextjs` и Zod. `next.config.ts` импортирует
обе схемы, поэтому отсутствующая обязательная переменная может остановить `dev` или `build` ещё до
компиляции.

## Локальный старт

```bash
cp .env.example .env
npm run dev
```

`.env` игнорируется Git и не должен коммититься. Значения `.env.example` безопасны только как
локальные placeholders; замените URLs и credentials для реального окружения.

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

`FRONT_HOST` и `HTTP_AUTH_*` сохраняются ради deployment contract, но application code сейчас их
не использует. Не считайте наличие переменных доказательством включённой HTTP auth.

Хотя Sentry подключается условно, server schema сейчас требует все четыре server Sentry values.
Пустая строка преобразуется в `undefined` и не пройдёт обязательную schema.

## Browser-visible variables

| Переменная               | Contract                        | Потребитель                              | Безопасный пример                  |
| ------------------------ | ------------------------------- | ---------------------------------------- | ---------------------------------- |
| `NEXT_PUBLIC_APP_ENV`    | `LOCAL\|WORK\|RC\|PROD`         | Client Sentry environment                | `LOCAL`                            |
| `NEXT_PUBLIC_FRONT_URL`  | Обязательный URL                | Sitemap и development allowed origin     | `http://localhost:3000`            |
| `NEXT_PUBLIC_BFF_PATH`   | Обязательная строка             | Browser dev API base и Next.js rewrite   | `/bff-api`                         |
| `NEXT_PUBLIC_BACK_URL`   | Обязательный URL                | Browser production API base              | `http://localhost:8080`            |
| `NEXT_PUBLIC_MOCK_MODE`  | String boolean, default `false` | Browser mock mode                        | `false`                            |
| `NEXT_PUBLIC_SENTRY_DSN` | Обязательный URL                | Client Sentry и build-time Sentry switch | `https://public@example.invalid/1` |

Всё с префиксом `NEXT_PUBLIC_` доступно browser bundle и не может содержать secrets. Эти значения
обычно встраиваются во время `next build`; изменение только runtime environment готового image не
гарантирует изменения client behavior.

`NEXT_PUBLIC_MOCK_MODE` получает fallback из `MOCK_MODE`, если собственное значение не задано.
Для явного и проверяемого deployment лучше задавать оба флага отдельно.

## Test-only и framework variables

| Переменная     | Schema | Поведение                                                   |
| -------------- | ------ | ----------------------------------------------------------- |
| `FRONT_PORT`   | Нет    | Playwright base URL/web server port, default `3000`         |
| `NODE_ENV`     | Next   | Управляется scripts/framework; вручную обычно не задаётся   |
| `NEXT_RUNTIME` | Next   | Используется для runtime branching; не является user config |

`FRONT_PORT` не равен `PORT`: первый настраивает Playwright client, второй — Next.js server. Если
меняете один при E2E, обеспечьте совпадение фактически слушающего адреса.

Vitest config передаёт только allowlist env keys: сначала уже заданные `process.env`, затем значения
из корневого `.env`. Test setup не должен самостоятельно перечитывать `.env` в каждом файле.

## Build-time и runtime

| Категория                  | Нужна при build              | Нужна при runtime                | Комментарий                         |
| -------------------------- | ---------------------------- | -------------------------------- | ----------------------------------- |
| `NEXT_PUBLIC_*`            | Да                           | Обычно нет для уже собранного JS | Встроены в client output            |
| BFF/server API URL         | Да                           | Да                               | Config validation + server requests |
| Server Sentry/APP metadata | Да                           | Да                               | Build plugin + instrumentation      |
| `PORT`                     | Да по текущей schema         | Да                               | Next process слушает runtime port   |
| Mock flags                 | Да по текущей schema/default | По необходимости                 | Build и runtime могут различаться   |

Текущая schema делает многие логически runtime variables обязательными уже при build. Это важно
для чистых CI/Docker builds, где локального `.env` нет.

## Добавление переменной

1. Определите, действительно ли значение нужно browser. Secrets всегда остаются server-only.
2. Добавьте server value в `src/env/server.ts`; browser value — в `src/env/client.ts` с
   `NEXT_PUBLIC_`.
3. Добавьте безопасный placeholder в `.env.example`.
4. Обновите Docker/CI deployment contract, если значение нужно там.
5. Добавьте ключ в Vitest allowlist только если tests импортируют consumer.
6. Обновите эту таблицу и профильный документ.

Не логируйте полный env, authorization headers, cookies, DSN auth tokens или credentials.

## Связанные документы

- [BFF proxy](bff-proxy.md)
- [Mock mode](mock-mode.md)
- [Deployment](deployment.md)
- [Testing guidelines](testing-guidelines.md)
