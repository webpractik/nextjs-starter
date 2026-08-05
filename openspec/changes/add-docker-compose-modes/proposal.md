## Why

Текущий Dockerfile не собирается воспроизводимо, а в репозитории нет Compose-контракта для
локального development и проверки production standalone-образа. Нужен единый поддерживаемый способ
явно выбрать режим Next.js и запустить приложение в двух репликах без конфликта host-портов.

## What Changes

- Добавить базовую Docker Compose-топологию и явные dev/prod overlays с документированными
  командами выбора ровно одного режима.
- Запускать две реплики активного Next.js-сервиса за единым reverse proxy/load balancer endpoint и
  проверять готовность контейнеров через существующий health endpoint.
- Исправить multi-stage Dockerfile: удалить ссылку на несуществующий workspace, передавать полный
  валидируемый build-time env-контракт, поддержать development target и сохранить минимальный
  непривилегированный production standalone runner.
- Добавить безопасный `.dockerignore`, чтобы secrets, локальные зависимости и build/test artifacts
  не попадали в Docker build context.
- Обеспечить development source reload без общей директории `.next` между репликами и production
  запуск из одного неизменяемого image.
- Документировать env, команды lifecycle/smoke-проверки и ограничения нескольких реплик:
  process-local Next.js cache и Prometheus registry не становятся общими автоматически.

## Capabilities

### New Capabilities

- `container-image-build`: Воспроизводимая и безопасная сборка development и production targets для
  npm workspace приложения на Node.js 24.
- `docker-compose-runtime`: Явный выбор dev/prod Compose-режима, две Next.js-реплики, единая точка
  входа, health checks и предсказуемое управление lifecycle.

### Modified Capabilities

Нет.

## Impact

- Изменятся `Dockerfile` и deployment/environment документация; появятся `.dockerignore`, базовый и
  mode-specific Compose-файлы, а также конфигурация reverse proxy.
- Compose lifecycle остаётся отдельным infrastructure workflow: короткие entrypoints находятся в
  корневом `Makefile`, а не в npm application lifecycle; установка зависимостей внутри образов
  выполняется исключительно через npm.
- Gateway использует закреплённый Traefik image и Docker provider; для discovery replicas ему
  предоставляется read-only mount Docker socket, который остаётся привилегированной границей
  доверия single-host topology.
- Production browser URL, backend URLs и остальные обязательные env остаются частью существующего
  build/runtime контракта; реальные secrets не коммитятся и не встраиваются в final image.
- Публичный HTTP API приложения не меняется. Новый runtime dependency ограничен контейнером
  Traefik reverse proxy/load balancer.
