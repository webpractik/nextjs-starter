---
type: operations
title: Логи, метрики и трассировка
description: Регистрация OTEL и Sentry, application logs Adze, Prometheus endpoints и ограничения диагностики.
tags: [nextjs, observability, operations]
verified:
  - by: openwiki/0.7.2
    at: 2026-11-16T14:24:53.735Z
sources:
  - id: openwiki-source-cb8dbb28d49f672186ae4f68
    resource: repo://app/api/health/route.ts
  - id: openwiki-source-ead9e412d0eb2a577922aaa2
    resource: repo://app/api/metrics/route.ts
  - id: openwiki-source-17981c3cc1a8c3d86d7437a8
    resource: repo://app/api/ready/route.ts
  - id: openwiki-source-72e0e60a94ee9fdc1aea5900
    resource: repo://instrumentation-client.ts
  - id: openwiki-source-91f15b5ba54df65745493f6a
    resource: repo://instrumentation.ts
  - id: openwiki-source-85596c961631fbbbc4dfa00d
    resource: repo://src/observability/metrics.ts
  - id: openwiki-source-250fd06397c0ea1a9c834d26
    resource: repo://src/proxy/request-logging.ts
generated: { by: "codex", at: "2026-11-16T14:24:53.735Z" }
---

# Логи, метрики и трассировка

## Точки регистрации

`instrumentation.ts` регистрирует OpenTelemetry через `registerOTel`, используя `APP_NAME` как имя сервиса. В Node runtime он инициализирует серверный Sentry с `SENTRY_DSN`, окружением `<APP_ENV>-server` и `tracesSampleRate: 1`. `onRequestError` передаёт ошибки Next.js в Sentry.

`instrumentation-client.ts` запускает клиентский Sentry только в production. `onRouterTransitionStart` отслеживает переходы маршрутизатора. Клиент использует `NEXT_PUBLIC_SENTRY_DSN` и окружение `<NEXT_PUBLIC_APP_ENV>-client`.

Версии OpenTelemetry должны удовлетворять peerDependencies `@vercel/otel`. При обновлении 16 ноября 2026 выбран `sdk-logs` 0.223.2, поскольку `@vercel/otel` 2.3.0 требует ветку ниже 0.300.0 и не поддерживает 3.x. Явно установлены необходимые peers; `legacy-peer-deps` сам по себе совместимость не проверяет. Выполняйте `npm ls --depth=1` после обновления.

## Application logs

Импортируйте существующий logger из `#/observability/logger`. Он использует Adze, namespace из `APP_NAME`, timestamp, pretty format и уровень info. Не добавляйте второй logging abstraction и не логируйте credentials, cookies или полный env.

`src/proxy/request-logging.ts` пишет method, pathname и duration. Таймер начинается и заканчивается внутри middleware: это не время обработки всего HTTP-запроса и не показатель backend latency. Proxy matcher исключает API endpoints и служебные ресурсы Next.js.

## Метрики и здоровье

`src/observability/metrics.ts` создаёт общий Prometheus Registry и регистрирует стандартные process metrics с префиксом `APP_NAME`. `/api/metrics` отдаёт `register.metrics()` с `register.contentType`.

Registry живёт в памяти процесса. Каждая реплика имеет собственные значения. В route handler нет authentication; ограничение доступа к метрикам относится к окружению развёртывания.

`/api/health` и `/api/ready` всегда возвращают `{ "message": "OK" }` со статусом 200. Они не проверяют backend, хранилище, Sentry или прогрев кеша. Проверка readiness пока подтверждает только доступность обработчика.

## Данные и ограничения

Клиентский Sentry явно включает сбор cookies, HTTP headers/bodies, query parameters, user information и нескольких видов контекста через `dataCollection`. Это существующие настройки проекта, а не гарантия приемлемости для конкретного продукта. До production согласуйте перечень собираемых данных и семплирование.

Сервер и клиент используют полное trace sampling. Настройки replay sampling не подключают replay integration: интеграции replay сейчас закомментированы. Доставку telemetry могут ограничивать CSP и сеть; локальный build не доказывает поступление событий в Sentry.

## Проверки и развитие

E2E `src/tests/e2e/example.spec.ts` проверяют ответы health/readiness и Content-Type metrics. Эти тесты не проверяют внешний collector или Sentry. При добавлении readiness-проверок зависимостей определите timeout и поведение деградации, затем покройте соответствующие состояния отдельным тестом.

- [Окружение](environment.md) определяет публичные и серверные переменные.
- [Развёртывание](deployment.md) описывает Sentry build secret и ограничения CSP.
- [BFF и proxy](../architecture/bff-proxy.md) объясняет путь запроса.
- [Тестирование](../testing/testing.md) содержит команды проверок.
