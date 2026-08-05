## ADDED Requirements

### Requirement: Воспроизводимая установка workspace dependencies

Container build MUST использовать Node.js 24, корневой `package-lock.json` и `npm ci`, копируя до
установки manifests только реально существующих npm workspaces.

#### Scenario: Чистая установка зависимостей

- **WHEN** production или development target собирается из чистого checkout
- **THEN** dependency stage успешно выполняет `npm ci` без ссылки на удалённый workspace и без
  альтернативного package manager

### Requirement: Раздельные development и production targets

Dockerfile SHALL предоставлять development target для `next dev` и production standalone target,
не включая development toolchain и исходное дерево в final production image.

#### Scenario: Запуск development target

- **WHEN** контейнер создан из development target
- **THEN** Next.js dev server слушает `0.0.0.0:3000` и может использовать смонтированные исходники

#### Scenario: Запуск production target

- **WHEN** контейнер создан из production target после успешного `next build`
- **THEN** он запускает standalone `server.js` с `NODE_ENV=production` от непривилегированного
  пользователя

### Requirement: Полный build-time env-контракт

Production build MUST получать все обязательные значения из текущих server/client env schemas,
встраивать `NEXT_PUBLIC_*` из выбранного deployment env и завершаться ошибкой при отсутствии
обязательного значения.

#### Scenario: Отсутствует обязательная переменная

- **WHEN** Compose разрешает production build без одного обязательного env-значения
- **THEN** конфигурация или build завершается с понятной ошибкой до создания runnable image

#### Scenario: Передан полный env-контракт

- **WHEN** production build получает валидный полный набор server и client values
- **THEN** `npm run build` создаёт standalone output с публичными значениями выбранной среды

### Requirement: Build secret не сохраняется в image

`SENTRY_AUTH_TOKEN` MUST передаваться production builder через BuildKit secret, быть доступным
только команде build и MUST NOT присутствовать в Docker arguments, image environment, history или
final filesystem.

#### Scenario: Проверка final image

- **WHEN** production image собран с уникальным тестовым `SENTRY_AUTH_TOKEN`
- **THEN** token отсутствует в metadata, history и filesystem final image

### Requirement: Безопасный Docker build context

Репозиторий MUST иметь `.dockerignore`, исключающий реальные env/secrets, VCS metadata, локальные
dependencies, Next.js output и test/report artifacts из build context.

#### Scenario: Сборка рядом с локальными artifacts

- **WHEN** developer запускает Docker build при наличии `.env`, `node_modules`, `.next` и test
  reports в рабочем дереве
- **THEN** эти пути не передаются builder и не могут быть скопированы в image командой `COPY . .`
