---
type: operations
title: Логи, метрики и трассировка
description: Регистрация OTEL и Sentry, application logs Adze, Prometheus endpoints и ограничения диагностики.
tags: [nextjs, observability, operations]
sources:
  - id: openwiki-source-3d70a94c30a531d0bd4a6c82
    resource: repo://app/(public)/(home)/error.tsx
  - id: openwiki-source-cb8dbb28d49f672186ae4f68
    resource: repo://app/api/health/route.ts
  - id: openwiki-source-ead9e412d0eb2a577922aaa2
    resource: repo://app/api/metrics/route.ts
  - id: openwiki-source-17981c3cc1a8c3d86d7437a8
    resource: repo://app/api/ready/route.ts
  - id: openwiki-source-15e36d68be7c3f03c6717ec2
    resource: repo://app/global-error.tsx
  - id: openwiki-source-90acc2f3726ecf636a258b75
    resource: repo://headers.ts
  - id: openwiki-source-72e0e60a94ee9fdc1aea5900
    resource: repo://instrumentation-client.ts
  - id: openwiki-source-91f15b5ba54df65745493f6a
    resource: repo://instrumentation.ts
  - id: openwiki-source-85596c961631fbbbc4dfa00d
    resource: repo://src/observability/metrics.ts
  - id: openwiki-source-250fd06397c0ea1a9c834d26
    resource: repo://src/proxy/request-logging.ts
generated: { by: "codex", at: "2026-11-16T15:55:30.306Z" }
verified:
  - by: openwiki/0.7.2
    at: 2026-11-16T15:01:48.263Z
---

# Логи, метрики и трассировка

## Точки регистрации

`instrumentation.ts` регистрирует OpenTelemetry через `registerOTel` с именем сервиса из `APP_NAME`. В Node runtime он инициализирует серверный Sentry с `SENTRY_DSN`, окружением `<APP_ENV>-server` и `tracesSampleRate: 1`. `onRequestError` передаёт ошибки Next.js в Sentry.

`instrumentation-client.ts` запускает клиентский Sentry только в production. `onRouterTransitionStart` отслеживает переходы маршрутизатора. Клиент использует `NEXT_PUBLIC_SENTRY_DSN` и окружение `<NEXT_PUBLIC_APP_ENV>-client`.

Версии OpenTelemetry должны соответствовать peerDependencies `@vercel/otel`. При обновлении 16 ноября 2026 выбран `sdk-logs` 0.223.2, поскольку `@vercel/otel` 2.3.0 требует ветку ниже 0.300.0 и не поддерживает 3.x. Необходимые peer-зависимости установлены явно. `legacy-peer-deps` сам по себе совместимость не проверяет. Выполняйте `npm ls --depth=1` после обновления.

## Application logs

Импортируйте logger из `#/observability/logger`. Он использует Adze, пространство имён из `APP_NAME`, метку времени, формат pretty и уровень info. Не добавляйте второй механизм логирования. Не записывайте в логи учётные данные, cookies или всё окружение.

`src/proxy/request-logging.ts` пишет method, pathname и duration. Таймер начинается и заканчивается внутри middleware. Он не измеряет обработку всего HTTP-запроса или задержку backend. Proxy matcher исключает API endpoints и служебные ресурсы Next.js.

## Метрики и здоровье

`src/observability/metrics.ts` создаёт общий Prometheus Registry и регистрирует стандартные метрики процесса с префиксом `APP_NAME`. `/api/metrics` отдаёт `register.metrics()` с `register.contentType`.

Registry хранится в памяти процесса. У каждой реплики свои значения. В route handler нет аутентификации. Ограничивайте доступ к метрикам на уровне окружения развёртывания.

`/api/health` и `/api/ready` всегда возвращают `{ "message": "OK" }` со статусом 200. Они не проверяют backend, хранилище, Sentry или прогрев кеша. Проверка readiness пока подтверждает только доступность обработчика.

## Данные и ограничения

Клиентский Sentry включает сбор cookies, HTTP-заголовков и тел сообщений, параметров query, пользовательских данных и нескольких видов контекста через `dataCollection`. Эти настройки проекта требуют согласования для конкретного продукта. До production согласуйте перечень собираемых данных и семплирование.

Сервер и клиент собирают все трассировки. Настройки replay sampling не подключают интеграции replay. Эти интеграции сейчас закомментированы. Доставку телеметрии могут ограничивать CSP и сеть. Локальная сборка не подтверждает поступление событий в Sentry.

## Проверки и развитие

E2E `src/tests/e2e/example.spec.ts` проверяют ответы health и readiness, а также Content-Type metrics. Эти тесты не проверяют внешний сборщик или Sentry. При добавлении проверок зависимостей в readiness задайте тайм-аут и поведение при отказе. Покройте соответствующие состояния отдельным тестом.

- [Окружение](environment.md) определяет публичные и серверные переменные.
- [Развёртывание](deployment.md) описывает Sentry build secret и ограничения CSP.
- [BFF и proxy](../architecture/bff-proxy.md) объясняет путь запроса.
- [Тестирование](../testing/testing.md) содержит команды проверок.

## Диагностика доставки события в Sentry

1. Используйте отдельное тестовое окружение и синтетическую ошибку без пользовательских данных.
   Для браузера нужна production-сборка. В development клиентский Sentry не инициализируется.
2. Проверьте, что используется ожидаемое окружение `<APP_ENV>-server` либо
   `<NEXT_PUBLIC_APP_ENV>-client`. Публичный DSN фиксируется при сборке. Не печатайте DSN и env
   целиком в логах. Сверяйте конфигурацию в защищённых настройках окружения.
3. Для клиентской ошибки проверьте сетевой запрос к Sentry и сообщения браузера о CSP.
   `headers.ts` сейчас разрешает в connect-src только self, data и WebSocket-схемы.
   Внешний HTTPS endpoint может блокироваться до отправки. Согласуйте точный origin,
   CORS и egress. Не расширяйте политику до `*`.
4. Для серверной ошибки проверьте доступность Sentry из Node-процесса или контейнера. Браузерная CSP
   к серверному исходящему запросу не применяется. Проверьте DSN, DNS, TLS и сетевые ограничения.
5. Найдите синтетическую ошибку в нужном проекте и окружении Sentry. Только наличие события
   подтверждает доставку. Отдельно проверьте читаемость stack trace и загрузку source maps.
6. Если ошибка есть в логах, но отсутствует в Sentry, проверьте место перехвата. Ошибка в обработчике события
   не попадает автоматически в React ErrorBoundary. Ошибки локальных операций обрабатывайте
   явно. Route error и global error уже вызывают captureException.

Не используйте реальные заголовки, cookies и тела запросов как тестовые данные. Учитывайте
текущую настройку dataCollection при подготовке проверки.

## Проверка метрик и добавление своей метрики

Для запущенного процесса выполните команду с фактическим адресом:

```bash
curl --fail --show-error --include http://localhost:3000/api/metrics
```

Проверьте Content-Type и строки стандартных метрик с префиксом APP_NAME.
Затем проверьте успешный scrape именно в Prometheus. Ответ endpoint не подтверждает,
что внешний сборщик настроен. Отдельного Prometheus scrape config в приложении нет.

Создавайте Counter или Histogram через установленный `prom-client`. Регистрируйте метрику
в экспортированном `register` из `#/observability/metrics`. Не создавайте новый Registry
и не используйте default global registry. Объявляйте метрику на уровне серверного модуля,
чтобы не создавать её при каждом запросе. При HMR проверяйте существующую регистрацию
через getSingleMetric, чтобы избежать ошибки повторного имени.

Для счётчика используйте стабильное имя. Длительность в Histogram измеряйте в секундах
и задавайте согласованные buckets. Ограничивайте labels небольшим известным набором, например
результатом операции. Не добавляйте user ID, полный URL, petId или текст ошибки.
Проверьте endpoint до и после операции и убедитесь, что нужное значение изменилось. После
перезапуска значения обнуляются. Разные реплики отдают независимые снимки.

## Как отличать работающий процесс от работающей интеграции

| Наблюдение | Что проверять дальше |
| --- | --- |
| Health и ready отвечают 200, но данные не загружаются | API base URL, mock-флаги, CORS/CSP, cookies и ответ backend |
| Proxy duration мала, но экран медленный | Отдельно измерить загрузку API и рендер. Эта duration не охватывает их |
| Metrics endpoint работает, график пуст | Prometheus target, сеть, период scrape и конкретную реплику |
| Событие Sentry доставлено, stack trace нечитаем | Source map upload, настройки build plugin и соответствие артефакта |

Проверки интеграций выполняйте в окружении развёртывания по
[deployment checklist](deployment.md). Стандартный E2E smoke проверяет HTTP endpoints,
но не доказывает доставку Sentry, OTEL или Prometheus scrape.
