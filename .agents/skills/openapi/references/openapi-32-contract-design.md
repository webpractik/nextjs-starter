# Проектирование OpenAPI 3.2-контракта

## Когда читать

Когда подтверждённые wire-факты нужно отобразить в OpenAPI Objects, JSON Schema
2020-12, reusable components, callbacks, webhooks, streaming media или новые
operation/serialization constructs OAS 3.2.

## Входы

- Operation inventory и coverage без scope-блокеров.
- Подтверждённые request/response/security/serialization/asynchronous semantics.
- Целевая версия: `3.2.0` для нового контракта либо существующая `3.2.x` для
  минимального update.
- Соглашения проекта по naming, errors, extensions и `$ref`.

## Результат

Набор OAS 3.2 Objects с уникальными operations, точными schemas, разрешимыми
references и examples, валидными относительно своих schemas и wire formats.

## Критерий завершения

Каждый `represented` requirement имеет точный JSON Pointer; все operations,
parameters, bodies, responses, security requirements, callbacks и webhooks
выражают подтверждённое поведение. Новые возможности 3.2 не появляются без
requirement только потому, что они доступны.

## Зафиксируй профиль версии

Новый контракт начинается с:

```yaml
openapi: 3.2.0
info:
  title: Device Registry API
  version: 1.0.0
paths: {}
```

`info.version` описывает API description, а не версию OAS. Root должен содержать
как минимум одно из полей `paths`, `webhooks` или `components`; пустой `paths`
допустим, например, для webhook-only API.

Schema Objects используют JSON Schema Draft 2020-12. OAS base dialect для 3.2
по-прежнему имеет URI:

```text
https://spec.openapis.org/oas/3.1/dialect/base
```

Не заменяй `3.1` в этом нормативном URI на `3.2`. `jsonSchemaDialect` добавляй
только при подтверждённом другом dialect и поддержке toolchain.

## Document identity и `$self`

`$self` задаёт self-assigned URI документа и становится его base URI. Добавляй
его только при известном canonical URI:

```yaml
$self: https://api.example.test/descriptions/devices/openapi.yaml
```

Если target document содержит `$self`, interoperable references должны
идентифицировать его через этот URI. Перед добавлением `$self`:

- инвентаризируй все relative references и base URI assumptions;
- проверь каждый документ многофайлового описания отдельно;
- выполни lint/bundle тем toolchain, который будет читать контракт;
- не подставляй retrieval URL, repository path или предполагаемый production
  host вместо canonical document URI.

Отсутствие `$self` не является дефектом, если canonical URI не задан.

## Root, tags и servers

- `servers` задаёт только подтверждённые API URLs и variables. Server URL не
  содержит query или fragment, а каждая variable встречается в template не
  более одного раза.
- Server `name` — уникальный стабильный identifier конкретного host; не выводи
  его из случайного environment label.
- `tags` организует operations, но не заменяет access control.
- Tag `summary` — короткая display label, `description` — подробное описание.
- Tag `parent` обязан ссылаться на существующий Tag `name`; циклы запрещены.
- Tag `kind` — free-form machine-readable category. Используй registry value
  (`nav`, `badge`, `audience`) только когда его смысл нужен consumer tooling.
- `security` задаёт global requirement, operation-level `security` его
  переопределяет.
- `paths` описывает provider endpoints, `webhooks` — consumer-implemented
  receivers, `components` — только реально reusable objects.

## Operation surface

Для каждой reachable Operation Object заполни минимум:

```yaml
get:
  operationId: getDevice
  summary: Получить устройство
  responses:
    '200':
      summary: Устройство найдено
```

`operationId` непустой и уникальный во всём OpenAPI Description, включая
callbacks, webhooks, `query` и `additionalOperations`.

### QUERY

Fixed field `query` описывает HTTP method `QUERY`:

```yaml
paths:
  /devices/search:
    query:
      operationId: queryDevices
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/DeviceQuery'
      responses:
        '200':
          summary: Результаты поиска
```

Не заменяй существующий POST на QUERY по стилевому предпочтению. Method, safety,
idempotency и body semantics должны происходить из требования или действующего
protocol.

### Additional HTTP methods

`additionalOperations` содержит map других methods. Key сохраняет точную
capitalization, отправляемую на wire:

```yaml
additionalOperations:
  COPY:
    operationId: copyDevice
    responses:
      '204':
        summary: Устройство скопировано
```

Не помещай туда methods с fixed fields (`GET`, `POST`, `QUERY` и остальные).
Не используй custom method, если его semantics, intermediaries и consumer
support не подтверждены.

## Parameters и request body

- Имя `in: path` точно совпадает с `{template}` и всегда имеет
  `required: true`.
- Path Item parameters наследуются всеми operations; operation parameter с той
  же identity переопределяет его, но не удаляет.
- Не моделируй body как query/header parameter. Используй `requestBody`.
- `requestBody.content` обязателен и должен содержать хотя бы один
  подтверждённый media type; пустая map имеет implementation-defined behavior.
- В Parameter Object используй ровно одно из `schema` или `content`.
- `style`, `explode`, `allowReserved` и Encoding Objects меняют wire
  serialization. Добавляй их только при подтверждённом byte-level формате.
- Не добавляй `required: true` из одной лишь уверенности, что поле «важное».

### Entire query string

`in: querystring` моделирует весь query string одним Parameter Object:

```yaml
parameters:
  - in: querystring
    content:
      application/x-www-form-urlencoded:
        schema:
          type: object
          properties:
            filter:
              type: string
            page:
              type: integer
```

Для effective parameters одной operation:

- допускается не более одного `in: querystring`;
- он не сосуществует ни с одним `in: query`;
- он использует non-empty `content`, а не `schema`;
- `content` содержит ровно один media type;
- `name` остаётся обязательным, хотя не влияет на serialization;
- media type и Encoding Objects должны точно описывать реальный query format.

Не используй `querystring`, чтобы обойти неизвестные имена или constraints
обычных query parameters.

### Cookie и reserved characters

OAS 3.2 поддерживает `style: cookie` для `in: cookie` и разрешает
`allowReserved` в Parameter и Header Objects. Поле действует лишь при
комбинации location/style, которая автоматически применяет percent-encoding;
Header Object и `style: cookie` percent-encoding не применяют, поэтому там это
поле эффекта не имеет. Encoding Object имеет собственный `allowReserved` для
применимых form/multipart случаев. Не переносись между RFC6570, form encoding,
headers и cookies без явного serialization evidence.

## Responses и errors

- Responses Object содержит хотя бы один response code/range/default.
- Фиксируй точный status code или документированный range; не выбирай
  «популярный» status вместо неизвестного.
- Response Object может иметь `summary`, `description`, оба поля или ни одного.
  Добавляй текст, только если он подтверждён и полезен.
- Для каждого status отдельно задавай headers, `content` и links.
- Header Object `required: true` означает обязательное присутствие response или
  multipart header; не выводи это из одного example.
- Не добавляй body к `204`, если на wire его нет.
- Error schema, error code vocabulary и correlation headers происходят из
  требований; единый `Problem` component не является автоматическим выбором.
- Один example не доказывает, что иных statuses или fields не существует.

## Sequential и streaming media

Для sequential media types `itemSchema` описывает отдельный item, а `schema` —
полное содержимое:

```yaml
content:
  application/jsonl:
    itemSchema:
      $ref: '#/components/schemas/DeviceEvent'
```

Применяй это к реально sequential formats, например `application/jsonl`,
`application/json-seq`, `text/event-stream` или `multipart/mixed`, только когда
format и item boundaries подтверждены.

`components.mediaTypes` позволяет переиспользовать Media Type Object:

```yaml
components:
  mediaTypes:
    DeviceEventStream:
      itemSchema:
        $ref: '#/components/schemas/DeviceEvent'
```

Ссылка ставится на месте Media Type Object:

```yaml
application/jsonl:
  $ref: '#/components/mediaTypes/DeviceEventStream'
```

Не путай Media Type Object с media type key и не создавай unused components.

## Multipart и nested Encoding Objects

- `encoding` адресует named properties.
- `prefixEncoding` адресует positional prefix items.
- `itemEncoding` задаёт encoding повторяющихся оставшихся items.
- `encoding` взаимоисключён с `prefixEncoding`/`itemEncoding` на одном Media
  Type Object.
- `prefixEncoding` и `itemEncoding` применимы к multipart media.
- Для `prefixEncoding`/`itemEncoding` нужен `itemSchema` либо `schema` с
  `type: array`.
- Encoding Object сам может содержать nested `encoding`, `prefixEncoding` и
  `itemEncoding`.

Согласуй Schema Object и encoding position: `prefixItems` соответствует
`prefixEncoding`, а повторяющиеся array items — `itemEncoding`. Не добавляй
пустые positional entries без подтверждённого part order.

## JSON Schema 2020-12

- nullable string: `type: [string, 'null']`, никогда `nullable: true`;
- exclusive bound: `exclusiveMinimum: 0`, не boolean modifier рядом с
  `minimum`;
- `required` находится на object schema и перечисляет property names;
- `additionalProperties`, `unevaluatedProperties` и conditionals существенно
  меняют допустимый payload — не вводи их без факта;
- `readOnly`/`writeOnly` описывают направления, но не подменяют разные request
  и response shapes;
- `default` — annotation/значение для consumer tooling, а не example и не
  обещание server-side behavior;
- `format` обычно annotation; не заявляй runtime validation только из него;
- Schema examples используют массив `examples`;
- binary/base64 описывай через media type и подтверждённые
  `contentEncoding`/`contentMediaType`.

Не выводи requiredness, enum, bounds, pattern, nullability или closed objects из
одного sample.

## Examples

Example Object поддерживает:

- `dataValue` — structured value, совместимое со Schema Object;
- `serializedValue` — окончательная serialized form;
- `externalValue` — URI serialized example;
- legacy `value` — embedded literal.

`dataValue` может сопровождаться `serializedValue` или `externalValue`.
`serializedValue`, `externalValue` и `value` взаимоисключаются между собой.
Для non-JSON formats предпочитай однозначные `dataValue`/`serializedValue`.

Каждый example должен:

- соответствовать schema, media type и Encoding Objects;
- содержать required fields и допустимые enum values;
- не раскрывать secrets, персональные данные и внутренние hosts;
- отличаться от schema `default` и prose illustration.

Одинаковое имя поля внутри example payload не становится OpenAPI keyword.

## Security

Security Scheme Object объявляется в `components.securitySchemes` и обычно
используется по component name:

```yaml
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
security:
  - bearerAuth: []
```

- Элементы одного Security Requirement Object действуют как AND; разные
  элементы массива — как OR.
- Operation-level `security: []` снимает global requirement.
- OAuth/OpenID scopes, URLs и API key location/name не придумываются.
- OAuth2 Device Authorization использует `flows.deviceAuthorization` с
  `deviceAuthorizationUrl`, `tokenUrl` и `scopes`.
- `oauth2MetadataUrl` применим к OAuth2 и требует подтверждённый TLS URL.
- `deprecated: true` означает, что scheme ещё описан, но consumers должны
  избегать его; не ставь флаг без lifecycle decision.
- Security Requirement key может быть URI Security Scheme Object. Component
  name имеет приоритет при collision, поэтому URI-like component names и
  неоднозначные relative URIs не рекомендуются.

## Discriminator и XML

`discriminator.propertyName` остаётся обязательным. Сама discriminating
property в payload может быть optional; тогда `defaultMapping` обязателен и
указывает fallback schema, которая действительно входит в описанный
`oneOf`/`anyOf` и валидирует payload без property либо с unmapped value.
Discriminator остаётся selection hint и не изменяет JSON Schema validation
result.

XML Object поддерживает `nodeType`:

```text
element | attribute | text | cdata | none
```

При наличии `nodeType` не используй одновременно legacy `attribute` или
`wrapped`. `xml` допустим в любом Schema Object; `namespace` задаётся
non-relative IRI. Для root element component schema сохраняй подтверждённое
component/name mapping. Для arrays, ordered elements и null semantics проверяй
точную XML serialization, а не аналогию с JSON shape.

## Callbacks и webhooks

Callback принадлежит конкретной operation и использует runtime expression для
URL из request/response context. Webhook находится в root `webhooks` и не
привязан к одной initiating operation.

Для обоих описывай обратный request с точки зрения API provider: method,
request body, security и acknowledgement responses. Не выводи callback из
одного `202`, а webhook — из общего упоминания «события».

Runtime expressions следуют формальному OAS синтаксису. Ссылаться на request
parameter можно только если он объявлен в parent operation; не подставляй
произвольные body paths, headers или query names без такого wire-факта.

## `$ref` и components

- Reference — URI относительно документа, где он написан, с учётом `$self`.
- В JSON Pointer экранируй `~` как `~0`, `/` как `~1`.
- Reuse применяй только при общей семантике.
- После move/rename проверяй inbound references bundle-командой.
- Schema `$ref` следует JSON Schema URI/base/anchor rules; OAS Reference Object,
  `operationRef`, discriminator mappings и Security Requirement URIs имеют
  разные правила.
- Не рассчитывай, что consumers одинаково поддерживают remote refs, anchors или
  URI-identified security schemes; проверяй реальным toolchain.

## Финальный object-level review

- Root и bundle сообщают OAS 3.2.x; новый root сообщает 3.2.0.
- Every path/method, parameter, status, media type и security requirement
  трассируется к requirement.
- `query` и entries `additionalOperations` входят в operation inventory.
- Operations имеют unique `operationId` и non-empty responses.
- Effective path parameters required и совпадают с templates.
- Effective `querystring` один, не смешан с `query` и использует `content`.
- Internal JSON Pointer refs разрешаются; URI/base semantics проверены Redocly.
- `itemSchema`, Media Type refs и nested encodings достижимы и проверены.
- Examples соответствуют schemas и serialization.
- Известные OAS 3.0-only Schema constructs отсутствуют.

## Источники метода

- [OpenAPI Specification 3.2.0](https://spec.openapis.org/oas/v3.2.0.html)
- [OpenAPI 3.2.0 release notes](https://github.com/OAI/OpenAPI-Specification/releases/tag/3.2.0)
- [Learn OpenAPI](https://learn.openapis.org/)
- [OpenAPI registries](https://spec.openapis.org/registry/)
