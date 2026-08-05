## ADDED Requirements

### Requirement: Явный выбор Next.js режима

Compose workflow MUST предоставлять базовую topology и отдельные development и production
overlays; поддерживаемая команда запуска MUST выбирать ровно один overlay и использовать один
предсказуемый Compose project.

#### Scenario: Выбран development режим

- **WHEN** operator запускает базовый Compose-файл с development overlay
- **THEN** активный сервис использует development Docker target, source mounts и команду
  `npm run dev`

#### Scenario: Выбран production режим

- **WHEN** operator запускает базовый Compose-файл с production overlay
- **THEN** активный сервис использует standalone production target без source bind mounts

### Requirement: Две Next.js реплики за одной точкой входа

Compose topology SHALL по умолчанию запускать ровно две replicas сервиса `nextjs`; replicas MUST
публиковать только внутренний порт, а единственный host HTTP port MUST принадлежать gateway,
который распределяет запросы между обеими replicas.

#### Scenario: Успешный масштабированный запуск

- **WHEN** выбранный Compose-режим полностью запущен
- **THEN** `docker compose ps` показывает две healthy Next.js replicas и один доступный gateway на
  настроенном host-порту

#### Scenario: Запросы проходят через обе replicas

- **WHEN** client многократно обращается к единому gateway endpoint
- **THEN** gateway access log подтверждает успешные ответы от обоих upstream containers

### Requirement: Устойчивое service discovery и proxy semantics

Gateway MUST обновлять upstream адреса через Docker DNS после recreation replica, передавать
исходный host/forwarding headers, поддерживать WebSocket upgrade и не буферизовать streaming
responses.

#### Scenario: Replica пересоздана

- **WHEN** одна healthy Next.js replica удалена и Compose создаёт замену с новым IP
- **THEN** gateway обнаруживает новый адрес и продолжает успешно обслуживать запросы без ручного
  перезапуска

#### Scenario: Development HMR через gateway

- **WHEN** browser устанавливает HMR WebSocket и исходный файл изменяется
- **THEN** dev-only cookie affinity удерживает HTML, assets и upgrade connection на одной replica,
  а browser получает обновление через gateway

### Requirement: Изолированное development состояние

Обе development replicas MUST видеть изменения рабочего дерева, но MUST NOT совместно записывать в
одни и те же `/app/.next` или container `node_modules` directories. Gateway MUST использовать
cookie affinity только в development, чтобы запросы одной browser session использовали
согласованный independently compiled output; production MUST оставаться без affinity.

#### Scenario: Изменение исходного файла

- **WHEN** developer изменяет source при двух запущенных development replicas
- **THEN** обе replicas могут независимо перекомпилировать изменение без повреждения общей build
  cache директории

### Requirement: Неизменяемый production runtime

Обе production replicas MUST запускаться из одного собранного image, работать без source bind
mounts и использовать restart policy, подходящую для single-host Compose lifecycle.

#### Scenario: Проверка production containers

- **WHEN** production topology запущена
- **THEN** обе Next.js replicas имеют одинаковый image ID, запускают standalone server и не
  монтируют рабочее дерево

### Requirement: Проверяемый env и сетевой контракт

Compose MUST явно передавать обязательный env-контракт, фиксировать internal Next.js port `3000`,
отделять его от публикуемого `FRONT_PORT` и поддерживать достижимый из контейнера
`BACK_INTERNAL_URL`.

#### Scenario: Отсутствует обязательное Compose env-значение

- **WHEN** operator валидирует dev или prod topology без обязательной переменной
- **THEN** `docker compose config` завершается ошибкой и не подставляет молча пустое значение

#### Scenario: Backend работает на Docker host

- **WHEN** `BACK_INTERNAL_URL` использует документированный `host.docker.internal` адрес
- **THEN** Next.js container разрешает этот host на macOS и Linux и может обратиться к backend

### Requirement: Health-gated lifecycle

Каждая Next.js replica MUST иметь healthcheck на `/api/health`, а documented detached startup MUST
ожидать healthy topology и возвращать ошибку при истечении timeout.

#### Scenario: Обе replicas готовы

- **WHEN** production startup выполняется с `--wait`
- **THEN** команда завершается успешно только после healthy статуса обеих replicas и доступности
  gateway

#### Scenario: Replica не проходит healthcheck

- **WHEN** одна Next.js replica не может вернуть успешный `/api/health`
- **THEN** startup не сообщает topology как готовую и диагностика показывает нездоровый container

### Requirement: Ограничения process-local состояния документированы

Deployment documentation MUST явно сообщать, что Next.js cache и Prometheus registry независимы в
каждой replica, readiness не проверяет backend, а один Compose host/gateway не обеспечивает high
availability.

#### Scenario: Operator оценивает production свойства

- **WHEN** operator читает инструкцию production запуска с двумя replicas
- **THEN** он видит ограничения cache consistency, metrics aggregation, readiness и single-host
  failure domain до использования topology

### Requirement: Предсказуемое переключение и остановка

Lifecycle commands MUST использовать один Compose project, удалять orphan containers при смене
режима и предоставлять одну команду остановки всей topology без удаления исходников или env-файла.

#### Scenario: Переключение с development на production

- **WHEN** operator после development запускает production lifecycle command
- **THEN** development containers заменяются production containers и не остаются параллельными
  orphan services

#### Scenario: Остановка topology

- **WHEN** operator выполняет documented down command
- **THEN** gateway, обе Next.js replicas и project network останавливаются и удаляются, а локальные
  source и env-файл сохраняются
