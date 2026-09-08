# Requirements intake и coverage

## Когда читать

Перед созданием или изменением контракта, если входы состоят из требований,
ADR, user stories, таблиц endpoint, примеров payload, кода или нескольких
несогласованных документов.

## Входы

- Все предоставленные требования и спецификации с версиями или датами.
- Существующий контракт, реализация, tests и примеры, если они есть.
- Границы API, целевая аудитория и явно принятые пользователем решения.
- Путь для постоянного coverage report.

## Результат

Operation inventory, набор атомарных требований со стабильными ID, canonical
coverage table и список wire-блокеров, отсортированный по порядку разрешения.

## Критерий завершения

Каждое утверждение внутри выбранного scope классифицировано; каждый wire-факт
либо имеет однозначное представление и target, либо отмечен обоснованным status.
Для `new` scope охватывает всю согласованную поверхность будущего контракта.
Для `update` scope ограничен запросом, его dependencies и транзитивно
затронутыми `$ref`.

## Инвентаризация входов

Для каждого источника запиши:

| Поле | Что фиксировать |
| --- | --- |
| Locator | Путь, URL, issue/ADR ID или symbol |
| Revision | Commit, версия, дата или `unversioned` |
| Scope | Какие операции или cross-cutting правила он описывает |
| Evidence | Точная секция, строка, test name или example name |
| State | `approved`, `draft`, `observed` или `unknown` |

Не превращай отсутствие значения в отрицание. Например, если таблица endpoint
не содержит security column, это не доказывает публичный доступ.

## Атомизация требований

Одно требование должно выражать один проверяемый факт. Разделяй составные фразы:

```text
Неправильно:
REQ-12: создать устройство и вернуть его либо ошибку.

Правильно:
REQ-12a: POST /devices принимает CreateDevice.
REQ-12b: успешный ответ POST /devices имеет подтверждённый status code.
REQ-12c: успешный ответ содержит Device.
REQ-12d: документированные ошибки имеют отдельные status/schema пары.
```

Используй стабильные IDs из исходной системы. Если их нет, введи локальные
`REQ-001`, `REQ-002`, не перенумеровывая уже опубликованные строки.

## Wire-чеклист

Для каждой операции проверь отдельно:

- path, fixed/custom HTTP method, назначение и уникальный `operationId`;
- path/query/header/cookie parameters, requiredness, schema и serialization;
- entire `querystring`, если protocol использует единый query payload;
- request body requiredness, media types, schema и encoding;
- каждый response status, headers, media types и schema;
- error codes и единый либо различный error shape;
- security scheme, alternatives, OAuth/OpenID scopes и operation override;
- поля: type, nullability, required, constraints, format, enum и access mode;
- pagination, filtering, sorting, idempotency и concurrency semantics;
- callbacks, webhooks, runtime URL/event trigger и acknowledgement;
- sequential/streaming item boundaries и `itemSchema`;
- examples, deprecation и сведения, остающиеся только документацией.

Cross-cutting утверждение раскрой на затронутые операции или укажи один общий
target, если оно действительно представлено на root/component level.

## Operation inventory

До проектирования schemas составь карту поверхности:

| Operation | Source | Request | Success | Errors | Security | Async |
| --- | --- | --- | --- | --- | --- | --- |
| `POST /devices` | `REQ-12` | `CreateDevice` | status неизвестен | `Problem` | scope неизвестен | none stated |

Ячейки «неизвестен» должны получить собственные requirement IDs и coverage
rows. Не заполняй их типичным значением.

## Canonical coverage table

Используй ровно эти headers и одну строку на атомарное требование:

| Requirement | Source | Target | Status | Reason |
| --- | --- | --- | --- | --- |
| REQ-012a | `spec.md#device-create` | `#/paths/~1devices/post` | represented | — |
| REQ-012b | `spec.md#device-create` | — | unknown | Success status не указан |

Допустимые statuses:

- `represented` — формальная OAS-семантика существует; `Target` обязателен.
- `documented-only` — факт сохранён в prose, но не является формальным
  ограничением; `Reason` обязателен.
- `not-representable` — OAS 3.2 не выражает факт без искажения; `Reason`
  обязателен.
- `conflict` — источники задают несовместимые wire-значения; `Reason` называет
  обе стороны.
- `unknown` — данных недостаточно; `Reason` точно называет недостающее решение.

`Requirement` и `Source` всегда непусты. Не используй `covered`, `partial`,
`todo` или свободные синонимы. У нескольких требований может быть один target,
но requirement ID не дублируется.

## Ambiguity gate

Wire-блокерами являются как минимум неизвестные или конфликтующие auth/scopes,
status codes, media types, поля, requiredness, error shape, pagination,
idempotency, concurrency, callback и webhook semantics.

Применяй gate только к выбранному scope. Не требуй закрыть неоднозначности вне
scope запрошенного изменения: сохрани соответствующие существующие узлы без
изменений и перечисли обнаруженные gaps в handoff. Если такой gap транзитивно
затрагивается изменением, он входит в scope и снова становится blocker.

При блокере:

1. Не меняй файлы контракта внутри заблокированного change set.
2. Выбери самый ранний факт, от которого зависит больше всего downstream design.
3. Дай короткий контекст источников.
4. Задай ровно один нейтральный вопрос без рекомендации и default.
5. После ответа обнови рабочие coverage rows вне repository и повтори gate.

Не сохраняй coverage report в repository, пока внутри выбранного scope остаётся
хотя бы один wire-блокер.

Пример корректной остановки:

```text
В ADR указан синхронный результат, а endpoint table — постановка в очередь.
Какой успешный status должен иметь POST /devices: 201 или 202?
```

Не объединяй с вопросом о response body, security или error status.

## Проверка полноты

- Все statements внутри выбранного scope имеют requirement ID или явную запись
  об исключении.
- У каждой planned operation есть request, success, errors и security decision.
- Examples помечены как evidence, а не автоматически как нормативная schema.
- `unknown`/`conflict` не спрятаны в prose и не заменены placeholder-значениями.
- Coverage сохранён рядом с contract documentation и будет обновляться в том же
  change set.

## Источники метода

- [Context7: Learn OpenAPI](https://context7.com/websites/learn_openapis)
- [Learn OpenAPI: Best Practices](https://learn.openapis.org/best-practices.html)
- [Learn OpenAPI: Parameters and Payload](https://learn.openapis.org/specification/parameters.html)
