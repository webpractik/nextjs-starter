---
name: openapi
description: >-
  OpenAPI 3.2-контракты: использовать для создания или восстановления
  проверяемого API contract из требований, ADR, user stories, endpoint tables,
  payload-примеров либо реализации, а также для минимального обновления
  существующего OAS 3.2.x с сохранением незатронутой семантики. Включает
  Redocly layout, трассируемое покрытие требований и воспроизводимую проверку.
  Swagger 2.0, OpenAPI 3.0/3.1, downstream SDK/runtime code и простое чтение
  готовой документации находятся вне этой области.
---

# Writing OpenAPI Contracts

Создавай source-controlled OpenAPI 3.2-контракт, который выражает только
подтверждённое wire-поведение, трассируется к требованиям и воспроизводимо
проходит проверки.

## Инварианты

- Для `new` используй ровно `openapi: 3.2.0` и архитектуру Redocly Starter.
- Для `update` принимай только существующий OAS 3.2.x. Сохраняй его patch
  version, layout, стиль `$ref` и всю незатронутую семантику.
- Если source contract объявляет Swagger 2.0 или OpenAPI 3.0/3.1, объясни
  границу skill и остановись до repository writes.
- Не додумывай auth, scopes, status codes, media types, поля, requiredness,
  ошибки, pagination, idempotency, concurrency, callbacks или webhooks.
- Для `new` любой `unknown` или `conflict` в согласованной области контракта
  блокирует repository writes.
- Для `update` ambiguity gate ограничен запрошенным изменением и транзитивно
  затронутыми `$ref`. Не связанные с изменением gaps сохраняй без расширения
  scope и перечисляй в handoff.
- При блокере задай ровно один нейтральный вопрос о самом раннем неизвестном
  факте, дождись ответа, обнови рабочую coverage matrix и повтори gate. Не
  предлагай скрытый default.
- Возможности OAS 3.2, включая `$self`, `query`, `additionalOperations`,
  `querystring` и `itemSchema`, не являются boilerplate. Добавляй их только из
  подтверждённых требований.
- Постоянные артефакты — source contract, `redocly.yaml` и coverage/verification
  reports. Bundle и renderer outputs временны, если пользователь явно не
  попросил их сохранить.
- Не объявляй готовность по одному lint: нужны coverage без scope-блокеров,
  Redocly config/lint, JSON bundle, deterministic verifier и применимые
  project-native проверки.

## Какой reference читать

- [requirements-intake.md](references/requirements-intake.md) — когда входы
  разрознены, неполны или их нужно атомизировать и связать с coverage.
- [openapi-32-contract-design.md](references/openapi-32-contract-design.md) —
  когда подтверждённые факты нужно отобразить в OAS 3.2 Objects и JSON Schema
  2020-12.
- [redocly-starter.md](references/redocly-starter.md) — только для нового
  многофайлового контракта или явно согласованной перестройки layout.
- [updating-existing-contracts.md](references/updating-existing-contracts.md) —
  для минимального update и compatibility review существующего OAS 3.2.x.
- [verification-and-handoff.md](references/verification-and-handoff.md) — всегда
  перед заявлением о готовности и передачей результата.

Не загружай все references автоматически: сначала выбери режим и читай только
владельцев нужных решений.

## Приоритет источников

При несовпадении фактов применяй этот порядок:

1. Явное решение пользователя.
2. Утверждённая specification или ADR.
3. Существующий контракт.
4. Реализация, tests и examples — только как свидетельство поведения.

Нижестоящий источник не переписывает вышестоящий молча. Зафиксируй расхождение
как `conflict`; отсутствие wire-факта — как `unknown`.

## Workflow

### 1. Обнаружить контекст

Найди requirements, ADR, user stories, endpoint tables, payload examples,
реализацию, tests, существующие OAS roots, `redocly.yaml`, API aliases и
project-native contract commands. Зафиксируй пути и версии источников. Не
редактируй.

### 2. Выбрать режим

| Режим | Предусловие | Обязательство |
| --- | --- | --- |
| `new` | Поддерживаемого source contract нет | Новый OAS 3.2.0 Starter layout |
| `update` | Есть OAS 3.2.x | Минимальный diff без semantic drift |

Иная declared OAS version не превращается в `update`: остановись и сообщи, что
этот skill её не изменяет.

### 3. Определить scope и атомизировать требования

Для `new` охвати всю согласованную поверхность будущего контракта. Для
`update` охвати только запрошенное изменение, его dependencies и транзитивно
затронутые `$ref`; не проводи глобальную инвентаризацию без отдельного запроса.

Назначь стабильный ID каждому проверяемому утверждению. Во временном черновике
построй operation inventory и canonical coverage table. Отдельно разложи
request, response, security, schema, serialization и asynchronous behavior.

### 4. Применить ambiguity gate

Проверь каждую wire-ось внутри выбранного scope. Если там есть `unknown` или
`conflict`, остановись до writes и задай ровно один вопрос. Не выбирай значение
по «обычной практике». Сохраняй coverage report в repository только после
снятия scope-блокеров.

### 5. Согласовать план

До writes покажи план для `new` и любого potentially breaking change:
entrypoint/alias, operations, reusable components, файлы, compatibility risks,
coverage gaps и команды проверки. Для узкого неблокирующего `update` достаточно
назвать затрагиваемые JSON Pointers и files.

### 6. Написать source contract

В `new` создай root, отдельные Path Item files и только реально используемые
components. В `update` меняй минимальный набор узлов. Держи examples валидными
относительно schemas и одновременно обновляй coverage targets.

### 7. Проверить

Выполни project-native gates, Redocly config и lint, создай временный JSON
bundle, а для `update` сравни его с baseline. Затем запусти deterministic
verifier. Если проект имеет документированный OAS 3.2-compatible renderer,
добавь его реальный запуск как project-native gate. Каждый gate, command, exit
status и evidence запиши в verification report.

### 8. Передать результат

Используй этот порядок заголовков:

1. `Статус`
2. `Entrypoint и Redocly alias`
3. `Изменённые файлы`
4. `Operation manifest`
5. `Покрытие требований`
6. `Принятые решения и gaps`
7. `Проверки`
8. `Временные артефакты и очистка`

## Definition of done

- В coverage нет `unknown` или `conflict` внутри проверяемого scope.
- Каждый `represented` Target разрешается в final JSON bundle.
- Source root и bundle объявляют OAS 3.2.x; `new` объявляет ровно 3.2.0.
- Все reachable operations, включая `query` и `additionalOperations`, имеют
  уникальный `operationId` и хотя бы один response.
- Все root path placeholders имеют соответствующий effective
  `required: true` path parameter.
- Effective parameters не смешивают `query` с `querystring`, а `querystring`
  имеет обязательный `name` и ровно один media type в `content`.
- Redocly config/lint, JSON bundle, deterministic verifier и применимые
  project-native gates завершились успешно.
- Для `update` выполнено semantic comparison с baseline.
- Временные артефакты удалены или явно сохранены по запросу.
