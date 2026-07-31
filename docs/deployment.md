# Deployment

> Тип: how-to + ограничения · Статус: локальный standalone flow работает; Docker/CI deploy требуют
> доработки · Источник истины: `next.config.ts`, `Dockerfile`, `.gitlab-ci.yml` и Route Handlers

Next.js настроен с `output: 'standalone'` и рассчитан на Node.js 24. Репозиторий умеет собрать
production output локально, но текущий Dockerfile и GitLab pipeline не образуют готовый end-to-end
deployment.

## Локальная production-проверка

```bash
npm ci
cp .env.example .env
npm run build
npm run prod
```

Проверьте:

```bash
curl --fail http://localhost:3000/api/health
curl --fail http://localhost:3000/api/ready
curl --fail http://localhost:3000/api/metrics
```

`npm run prod` использует `next start`. Container runtime запускает минимальный
`.next/standalone/server.js`; это разные entrypoints одного build output.

## Dockerfile

Задуманный multi-stage flow:

1. `deps` на `node:24-alpine` выполняет `npm ci` по workspace manifests.
2. `builder` копирует source, получает build args и выполняет `npm run build`.
3. `runner` копирует standalone server, static assets и `public/`, затем работает непривилегированным
   пользователем `nextjs` на порту `3000`.

### Текущие блокеры

Docker image сейчас нельзя считать воспроизводимо собираемым:

- `deps` выполняет `COPY packages/design-tokens/package.json`, но workspace удалён;
- builder передаёт только часть variables, обязательных для импортируемых env schemas;
- `NEXT_PUBLIC_BFF_PATH`, `BACK_INTERNAL_URL`, `APP_ENV`, `FRONT_HOST`, `PORT`, `CI` и server
  `SENTRY_DSN` среди прочего не объявлены как build args;
- `.dockerignore` отсутствует, поэтому локальные `.env`, build/test artifacts и другие лишние файлы
  могут попасть в build context; случайно скопированный `.env` способен скрыть проблему и раскрыть
  secrets в layers/context.

Исправление Dockerfile/.dockerignore является отдельной infrastructure задачей. Не обходите
валидацию копированием реального `.env` в image и не передавайте secrets как публичные build args.

### Build и runtime variables

Public `NEXT_PUBLIC_*` значения должны быть корректны на этапе build. Server variables нужны
builder из-за текущей config validation и повторно задаются контейнеру на runtime для
instrumentation/API calls.

После исправления Dockerfile runtime запуск должен передавать как минимум полный server schema
contract из [environment.md](environment.md). Не полагайтесь на builder `ENV`: final stage их не
наследует.

Sentry auth token нужен для source map upload во время production build и не должен оставаться в
final image. Предпочтителен BuildKit secret или CI secret mount, а не persisted `ARG`/`ENV` layer.

## GitLab CI

Текущий pipeline содержит stages:

```text
codequality → test → deploy
```

- `codequality` выполняет `npm run verify:fast`.
- `test` устанавливает Chromium prerequisites и выполняет `npm run test`, то есть оба Vitest
  projects.
- Standalone Playwright E2E не запускается.
- Next.js production build не выполняется, `.next` artifacts не создаются.
- `.gitlab/deploy.yaml` содержит только закомментированный extension point; deploy job отсутствует.

Следовательно, deploy job нельзя просто подключить к существующему artifact: он должен отдельно
построить image/bundle или получить его из нового build stage. Проверяйте также project-level и
remote GitLab includes — они не видны из репозитория и могут ожидать удалённый `build` job.

## Health, readiness и metrics

| Endpoint       | Текущее поведение                             | Чего не гарантирует                      |
| -------------- | --------------------------------------------- | ---------------------------------------- |
| `/api/health`  | Всегда JSON `{ "message": "OK" }`, status 200 | Доступность backend, Sentry или storage  |
| `/api/ready`   | Всегда JSON `{ "message": "OK" }`, status 200 | Готовность зависимостей и прогрев cache  |
| `/api/metrics` | Возвращает текущий Prometheus registry        | Authentication и network-level isolation |

Используйте health как process/liveness probe. Readiness пока семантически эквивалентна liveness;
не настраивайте на неё traffic gating с ожиданием upstream checks. Metrics endpoint нужно закрыть
на ingress/network уровне, если он не должен быть публичным.

## Reverse proxy и browser API

В production приложение отправляет `X-Accel-Buffering: no`, чтобы reverse proxy не буферизовал
streaming responses. Ingress всё равно нужно проверять отдельно: он может переопределить header,
timeouts или compression.

Browser API transport в production использует `NEXT_PUBLIC_BACK_URL` напрямую. Текущий CSP имеет
`connect-src 'self' data: wss: ws:` и не добавляет произвольный HTTPS backend/Sentry origin.
Cross-origin backend может быть заблокирован CSP даже при правильном CORS. До production launch
нужно либо использовать same-origin URL, либо отдельно согласованно расширить CSP и протестировать
CORS/cookies. Не ослабляйте CSP до `*`.

## Observability и privacy

- Server runtime регистрирует OTEL и Sentry; client Sentry запускается только в production.
- `tracesSampleRate` сейчас равен `1` на server и client.
- Client Sentry настроен с `sendDefaultPii: true`.
- Prometheus registry process-local; несколько replicas отдают разные snapshots.

Перед production проверьте стоимость sampling, data retention, consent/PII policy и фактическую
доставку Sentry через CSP. Не утверждайте, что observability готова к требованиям конкретного
проекта без этой проверки.

## Release checklist

1. Выполнить `npm ci`, полный verification и production build в чистом environment.
2. Устранить Docker blockers или определить другой поддерживаемый artifact flow.
3. Зафиксировать build-time public URLs и runtime server secrets/URLs.
4. Проверить CORS, cookie attributes и CSP для production backend/Sentry origins.
5. Проверить streaming через реальный ingress.
6. Решить semantics readiness и доступ к metrics.
7. Проверить Sentry PII/sampling и source map upload без утечки token.
8. Добавить настоящий deploy job с rollout/rollback и artifact provenance.
9. Выполнить smoke tests `/api/health`, `/api/ready`, `/api/metrics` и ключевого page/API flow.

## Связанные документы

- [Environment](environment.md)
- [BFF proxy](bff-proxy.md)
- [Cache Components при self-hosting](cache-and-streaming.md)
- [Testing guidelines](testing-guidelines.md)
