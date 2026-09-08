# Deployment

> Тип: how-to + ограничения · Статус: локальный standalone flow работает; Docker/CI deploy требуют
> доработки · Источник истины: `next.config.ts`, `Dockerfile`, `.gitlab-ci.yml` и Route Handlers

Next.js настроен с `output: 'standalone'` и рассчитан на Node.js 24.15.0+ в ветке 24.x.
Локальная production-сборка работает, но полного развёртывания через Dockerfile и GitLab CI пока нет.

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

`npm run prod` использует `next start`, контейнер — минимальный `.next/standalone/server.js`.
Это разные точки запуска одной сборки.

## Dockerfile

Сборка задумана в три этапа:

1. `deps` на `node:24-alpine` выполняет `npm ci` по манифестам workspaces.
2. `builder` копирует исходники, получает аргументы сборки и выполняет `npm run build`.
3. `runner` копирует standalone-сервер, статику и `public/`, затем работает непривилегированным
   пользователем `nextjs` на порту `3000`.

### Текущие блокеры

Docker-образ сейчас нельзя считать воспроизводимо собираемым:

- `deps` выполняет `COPY packages/design-tokens/package.json`, но workspace удалён;
- builder передаёт не все переменные, обязательные для импортируемых схем окружения;
- `NEXT_PUBLIC_BFF_PATH`, `BACK_INTERNAL_URL`, `APP_ENV`, `FRONT_HOST`, `PORT`, `CI` и server
  `SENTRY_DSN`, среди прочих, не объявлены аргументами сборки;
- без `.dockerignore` в контекст сборки могут попасть локальные `.env`, артефакты сборки и тестов,
  прочие лишние файлы; `.env` может скрыть проблему и раскрыть секреты в слоях или контексте.

Исправляйте Dockerfile/.dockerignore отдельной задачей. Не обходите проверку реальным `.env` в
образе и не передавайте секреты публичными аргументами сборки.

### Build и runtime variables

`NEXT_PUBLIC_*` должны быть корректны при сборке. Серверные переменные нужны builder для проверки
конфига, а затем контейнеру — для инструментирования и API-вызовов.

После исправления Dockerfile передавайте при запуске как минимум все серверные переменные из
[environment.md](environment.md). Финальный этап не наследует `ENV` builder.

Токен Sentry нужен для загрузки карт исходников при production-сборке, но не должен оставаться
в образе. Предпочтительны BuildKit secret или монтирование секрета CI, а не сохранение в `ARG`/`ENV`.

## GitLab CI

Текущий pipeline состоит из этапов:

```text
codequality → test → deploy
```

- `codequality` выполняет `npm run verify:fast`.
- `test` устанавливает зависимости Chromium и запускает `npm run test` — оба проекта Vitest.
- Standalone Playwright E2E не запускается.
- Production-сборка Next.js не выполняется, артефакты `.next` не создаются.
- В `.gitlab/deploy.yaml` лишь закомментированный шаблон; задачи развёртывания нет.

Задаче развёртывания нужно собрать образ/артефакт либо получить его с нового этапа сборки.
Проверьте невидимые в репозитории подключения GitLab — проектные и удалённые: они могут ожидать
удалённую задачу `build`.

## Health, readiness и metrics

| Endpoint       | Текущее поведение                             | Чего не гарантирует                      |
| -------------- | --------------------------------------------- | ---------------------------------------- |
| `/api/health`  | Всегда JSON `{ "message": "OK" }`, status 200 | Доступность backend, Sentry или storage  |
| `/api/ready`   | Всегда JSON `{ "message": "OK" }`, status 200 | Готовность зависимостей и прогрев cache  |
| `/api/metrics` | Возвращает текущий Prometheus registry        | Authentication и network-level isolation |

Используйте health для проверки жизнеспособности процесса. Readiness пока эквивалентна ей:
не управляйте трафиком в расчёте на проверку зависимостей. Непубличные метрики закройте на ingress или в сети.

## Reverse proxy и browser API

В production приложение передаёт `X-Accel-Buffering: no` для отключения буферизации потоковых ответов прокси.
Проверяйте ingress отдельно: он может переопределить заголовок, тайм-ауты и сжатие.

В production браузер обращается к `NEXT_PUBLIC_BACK_URL` напрямую. CSP
`connect-src 'self' data: wss: ws:` не разрешает произвольные HTTPS-origin бэкенда и Sentry даже
при правильном CORS. До запуска выберите same-origin URL либо согласованно расширьте CSP и
проверьте CORS/cookies. Не ослабляйте CSP до `*`.

## Observability и privacy

- Сервер регистрирует OTEL и Sentry; клиентский Sentry запускается только в production.
- `tracesSampleRate` сейчас равен `1` на сервере и клиенте.
- Клиентский Sentry использует `sendDefaultPii: true`.
- Реестр Prometheus локален для процесса: реплики отдают разные снимки.

Перед production проверьте стоимость семплирования, сроки хранения, согласия, правила обработки
персональных данных и доставку Sentry через CSP. Без проверки нельзя заявлять соответствие требованиям проекта.

## Release checklist

1. Выполнить `npm ci`, полную проверку и production-сборку в чистом окружении.
2. Устранить блокеры Docker или выбрать другой поддерживаемый способ получения артефакта.
3. Зафиксировать публичные URL при сборке, серверные секреты и URL при запуске.
4. Проверить CORS, атрибуты cookies и CSP для production-origin бэкенда и Sentry.
5. Проверить streaming через реальный ingress.
6. Определить смысл readiness и доступ к метрикам.
7. Проверить персональные данные и семплирование Sentry, загрузку карт исходников без утечки токена.
8. Добавить задачу развёртывания с откатом и отслеживанием происхождения артефакта.
9. Выполнить smoke-тесты `/api/health`, `/api/ready`, `/api/metrics` и ключевого сценария страницы/API.

## Связанные документы

- [Environment](environment.md)
- [BFF proxy](bff-proxy.md)
- [Cache Components при self-hosting](cache-and-streaming.md)
- [Testing guidelines](testing-guidelines.md)
