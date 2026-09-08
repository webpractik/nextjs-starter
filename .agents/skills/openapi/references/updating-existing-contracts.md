# Обновление существующего контракта

## Когда читать

Для изменения существующего OAS 3.2.x, compatibility review или восстановления
частично повреждённого source contract.

## Входы

- Существующий source root, все referenced files и `redocly.yaml`.
- Согласованные requirements/coverage для изменения.
- API alias, project-native gates и clean baseline JSON bundle.

## Результат

Минимальный source diff, before/after semantic evidence и обновлённые coverage
и verification reports.

## Критерий завершения

Требуемое поведение изменено, незатронутые normalized nodes эквивалентны
baseline, compatibility risks согласованы, все gates проходят и layout не
перестроен без явного решения.

## Сначала зафиксируй baseline

До редактирования:

1. Найди maintained source root, version, API alias и generated-file markers.
2. Проверь worktree и отдели пользовательские изменения от своей области.
3. Выполни существующие config/lint/bundle commands без изменения config.
4. Создай временный JSON bundle `before.json` без `--force`.
5. Запиши его command, exit status и digest/path в рабочие evidence.
6. Отметь JSON Pointers, которые требования разрешают менять.

Если baseline уже не проходит, не «починяй всё рядом». Зафиксируй pre-existing
failure и выясни, входит ли его исправление в scope. Без clean/understood
baseline нельзя доказать сохранение незатронутой семантики.

## Выбери минимальную поверхность

Построй change set от represented targets:

- operations и Path Items, которые меняются напрямую;
- referenced parameters/requestBodies/responses/schemas;
- components, чья семантика действительно общая для других consumers;
- root security/servers/tags только при прямом cross-cutting requirement;
- coverage rows и verification evidence.

Перед изменением shared component найди все inbound `$ref`. Если новое
ограничение нужно одной operation, локальный component или inline override
часто безопаснее глобального изменения.

Сохраняй:

- существующую версию `3.2.x`;
- file layout, API alias, ref style и naming conventions;
- operation IDs и component names, если rename не является требованием;
- formatting/order настолько, насколько это уменьшает review noise;
- неизвестные vendor extensions, если нет доказательства, что их надо удалить.

Не запускай split/join/formatter по всему контракту ради локального update.

## Compatibility review

Считай potentially breaking любое изменение наблюдаемого contract surface.

| Изменение | Типичный риск |
| --- | --- |
| Удалить/переименовать path, method или `operationId` | Clients и generated SDK ломаются |
| Удалить status/media type/response field | Consumer больше не может обработать ответ |
| Добавить required request parameter/property | Старые requests становятся invalid |
| Сделать optional response field required | Server implementations могут не соответствовать |
| Сузить type, enum, pattern, range или nullability | Ранее валидные значения отвергаются |
| Расширить response enum/union | Exhaustive consumers могут сломаться |
| Усилить security или scopes | Ранее разрешённые вызовы запрещаются |
| Изменить serialization/style/encoding | Меняются фактические bytes/URL |
| Смешать `query` и `querystring` либо изменить whole-query media type | Меняется parsing URL |
| Изменить `itemSchema` или item boundaries stream | Consumers иначе читают поток |
| Изменить `$self` | Меняется base URI и resolution references |
| Изменить pagination/idempotency/concurrency | Меняется protocol behavior |
| Удалить callback/webhook event или acknowledgement | Async consumer ломается |

Добавление optional request field или нового operation обычно additive, но всё
равно проверь naming collisions, security defaults, generated clients и
`additionalProperties` constraints. «Additive» не означает автоматически safe.

Для potentially breaking change до writes сформулируй:

- что именно наблюдает consumer до и после;
- какие requirements требуют изменения;
- кого затрагивает shared component;
- consumer transition/deprecation path;
- rollback boundary;
- явное решение пользователя.

## Внесение update

Работай от листьев к root:

1. Добавь или скорректируй schemas/parameters/responses.
2. Измени операции и их references.
3. Меняй root только при необходимости.
4. Обнови examples вместе со schemas.
5. Обнови coverage targets/reasons в том же change set.
6. Bundle после каждого логического шага, если ref graph сложный.

Не используй реализацию как повод расширить contract за пределы согласованного
scope. Обнаруженное undocumented behavior фиксируй как отдельный gap.

## Semantic comparison

После изменения создай `after.json` тем же tool/version/config и command, что и
baseline. Сравнивай parsed JSON, а не YAML text.

Раздели nodes на:

- `allowed-changed` — exact targets и необходимая reference closure;
- `expected-generated` — безопасное reorder/renaming, доказанное bundler output;
- `unchanged` — всё остальное;
- `unexpected` — любое отличие вне первых двух групп.

Для `unchanged` требуй deep semantic equality после удаления только заведомо
нестабильных generator metadata. Не удаляй descriptions, examples, extensions
или ordering-sensitive arrays из сравнения ради удобства.

Пример evidence manifest:

```text
Allowed changes:
- #/paths/~1devices~1{deviceId}/patch/requestBody
- #/components/schemas/DevicePatch

Unchanged comparison:
- 146 normalized nodes equal
- 0 unexpected nodes
```

Если project имеет semantic diff/breaking-change tool, запусти его в дополнение
к pointer comparison и запиши tool version. Ни один автоматический diff не
доказывает consumer safety сам по себе.

## Recovery повреждённого контракта

Если source не bundle/lint:

1. Сохрани точные baseline errors.
2. Восстанови parsing и refs минимальными edits.
3. Создай первый clean bundle.
4. Только затем применяй функциональные requirements.

Не редактируй broken generated bundle вместо source и не перезаписывай
multi-file source результатом bundle без согласованной смены workflow.

## Сквозной пример узкого update

Запрос: добавить подтверждённый response header `X-Request-Id` только в
`GET /orders` status `200`. В существующем `GET /legacy` не описана security,
но её аудит не входит в задачу.

Решение:

1. Scope включает operation response и только необходимую `$ref` closure.
2. Gap `GET /legacy` не блокирует update, не исправляется по догадке и попадает
   в handoff как out-of-scope existing gap.
3. Coverage содержит строку:

   | Requirement | Source | Target | Status | Reason |
   | --- | --- | --- | --- | --- |
   | REQ-ORDER-HEADER | `change.md#request-id` | `#/paths/~1orders/get/responses/200/headers/X-Request-Id` | represented | — |

4. Allowed-change manifest содержит этот Target и реально затронутый reusable
   component, если header вынесен в него.
5. Verification требует Redocly config/lint, JSON bundle, semantic comparison,
   deterministic verifier и применимые project-native gates. Любое отличие вне
   allowed-change manifest остаётся blocker.

## Update review checklist

- Diff ограничен разрешёнными files/nodes.
- Shared components проверены по всем inbound references.
- Compatibility risks перечислены и согласованы.
- `before.json` и `after.json` созданы одинаковым toolchain.
- Unaffected nodes равны; unexpected diff отсутствует.
- Coverage отражает только фактически представленные изменения.
- Temporary baselines удалены после фиксации evidence, если их не просили
  сохранить.

## Источники метода

- [Learn OpenAPI: Using References](https://learn.openapis.org/referencing/)
- [OpenAPI Specification 3.2.0](https://spec.openapis.org/oas/v3.2.0.html)
