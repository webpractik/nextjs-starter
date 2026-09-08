# Verification и handoff

## Когда читать

После каждого логического contract change и обязательно перед словами
«готово», «валидно» или «совместимо».

## Входы

- Final source root, `redocly.yaml`, API alias и project root.
- Canonical coverage report без scope-блокеров.
- Путь постоянного verification report.
- Для `update`: pre-change JSON bundle и allowed-change pointers.
- Доступный project-pinned Redocly CLI и применимые project-native commands.

## Результат

Воспроизводимая таблица gates с командами, exit statuses и evidence; успешный
deterministic verifier; очищенные temporary outputs; handoff в фиксированном
порядке.

## Критерий завершения

Каждый обязательный gate реально выполнен, имеет exit `0`, result `passed` и
проверяемое evidence. Coverage не содержит `unknown`/`conflict` внутри
проверяемого scope; handoff не делает claims шире выполненных проверок.

## Подготовь безопасный запуск

1. Работай из project root и используй один обнаруженный API alias.
2. Используй pinned project binary/lockfile, а не молчаливую установку `latest`.
3. Просмотри `redocly.yaml`: custom plugins, preprocessors и decorators могут
   загружать или выполнять project code.
4. Создай уникальный temporary directory вне source tree.
5. Не используй `--force`; не перенаправляй failure в success через `|| true`.
6. Сохраняй stdout/stderr или короткий stable evidence locator для каждого gate.

Project-native command может объединять несколько outcomes. Проверь его
содержимое и не запускай дубликаты вслепую, но в verification report всё равно
оставь отдельную строку для каждого обязательного gate.

## Gate sequence

### 1. Repository-native checks

Запусти только применимые contract-related commands: formatting, schema tests,
contract tests, docs checks или CI script. Не запускай unrelated destructive
tasks. Запиши tool version, если output зависит от version.

### 2. Redocly config

```bash
redocly check-config
```

Failure означает invalid или unsupported config. Не переходи к claims на
основании того, что прямой lint root случайно работает.

### 3. Redocly lint

```bash
redocly lint api@v1
```

Используй согласованный alias. Ошибки и warnings, повышенные project rules до
error, должны быть устранены. Не выключай rule без отдельного решения.

### 4. JSON bundle

```bash
redocly bundle api@v1 --output <temp-dir>/openapi.json
```

Bundle должен быть создан после lint обычным JSON без `--force`. Он является
входом для deterministic verifier и semantic comparison, но не заменяет
multi-file source.

### 5. Semantic comparison

Обязательно только для `update`; для `new` строку gate не добавляй:

- сравни `before.json` и `after.json` как parsed/normalized documents;
- перечисли allowed changed pointers и необходимую reference closure;
- потребуй отсутствие unexpected changes;
- запусти project breaking-change tool, если он есть;
- не называй change compatible только по зелёному lint.

### 6. Применимый renderer

Запускай docs/render command только тогда, когда проект уже документирует его
как совместимый с OpenAPI 3.2.x. Это дополнительный project-native gate, а не
универсальное условие готовности. Зафиксируй точную команду, версию инструмента
и evidence; успех renderer не доказывает business correctness.

### 7. Deterministic verifier

Запускай dependency-free script через Node.js, передавая все paths явно:

```bash
node <skill-dir>/scripts/verify-contract.mjs \
  --mode new \
  --project-root <project-root> \
  --root openapi/openapi.yaml \
  --bundle <temp-dir>/openapi.json \
  --coverage docs/openapi/coverage.md \
  --verification docs/openapi/verification.md
```

Для существующего контракта передай `--mode update` и реальный source root;
Starter layout тогда не навязывается. Других режимов у verifier нет.

Relative paths разрешаются от `--project-root`. Absolute paths допустимы только
для явно созданных temporary artifacts.

Жёсткие input limits: source root — 2 MiB, каждый Markdown report — 4 MiB,
JSON bundle — 32 MiB, не более 256 вложенных containers и 1 000 000
object/array containers. Превышение file-size limit даёт exit `2`; превышение
структурной сложности прочитанного bundle — deterministic failure с exit `1`.

Exit contract:

| Exit | Значение |
| --- | --- |
| `0` | Все deterministic invariants прошли |
| `1` | Прочитанные inputs валидны, но есть failed checks |
| `2` | CLI usage или input read/parse failure |

`--format json` даёт machine-readable checks со стабильными IDs:
`inputs.*`, `oas.*`, `refs.internal`, `operations.*`, `paths.parameters`,
`parameters.querystring`, `layout.new`, `deliverables.*`, `coverage.*`.

Verifier проверяет:

- согласованную версию OAS 3.2.x и точное `openapi: 3.2.0` в `new`;
- отсутствие охраняемых OAS 3.0-only constructs;
- root-based positional JSON Pointer references;
- fixed operations, `query`, `additionalOperations`, responses и path
  parameters;
- обязательный `name`, единственный media type в `content`, отсутствие
  `schema`, а также inheritance/conflict rules для `querystring`;
- `$ref` через `itemSchema` и `components.mediaTypes`;
- Starter layout в `new`;
- обязательные verification gates и canonical reports;
- существование каждого `represented` coverage target в final JSON bundle.

Он не доказывает:

- business correctness;
- breaking-change safety;
- сохранение update semantics;
- URI anchors, `$dynamicRef` и Schema resources с собственным `$id`/base URI;
- соответствие реализации фактическому traffic.

Эти claims требуют coverage, Redocly, before/after comparison и project tools.

## Canonical verification report

Используй ровно одну Markdown table с headers:

| Gate | Command | Exit status | Result | Evidence |
| --- | --- | --- | --- | --- |
| Redocly config | `redocly check-config` | 0 | passed | `artifacts/check-config.txt` |
| Redocly lint | `redocly lint api@v1` | 0 | passed | 0 errors |
| JSON bundle | `redocly bundle api@v1 --output …/openapi.json` | 0 | passed | temporary bundle parsed |
| Semantic comparison | `<project-semantic-comparison>` | 0 | passed | 0 unexpected nodes |

Для `new` удали строку `Semantic comparison`; для `update` она обязательна.
Применимые repository-native проверки, включая подтверждённый
OpenAPI-3.2-compatible renderer, добавляй отдельными уникальными строками, не
переименовывая канонические gates.

Правила:

- `Gate`, `Command`, `Result`, `Evidence` непусты; `Gate` уникален.
- Обязательные gates идут в показанном относительном порядке.
- `Exit status` — неотрицательное integer и для готовности ровно `0`.
- `Result` для готовности ровно `passed`; `failed`/`skipped` не маскируются.
- Shell pipeline внутри cell экранирует `|` как `\|`.
- Evidence называет сохранённый log, command summary, digest или конкретный
  comparison result; слово `done` недостаточно.
- Не записывай предполагаемый exit до выполнения команды.

### Самопроверка verification row

Строка самого verifier не входит в набор, который он может потребовать на первом
запуске, иначе проверка была бы циклической:

1. Заполни report реальными результатами предыдущих gates.
2. Запусти verifier без его собственной строки.
3. Только после фактического exit `0` добавь строку verifier.
4. Запусти verifier ещё раз; второй exit `0` подтверждает финальную таблицу.
5. Если второй запуск не прошёл, исправь report или contract и повтори.

Пример финальной строки:

```markdown
| Deterministic verifier | `node …/verify-contract.mjs …` | 0 | passed | 18/18 checks passed |
```

## Coverage readiness

Перед финалом проверь canonical table:

- `represented` имеет один internal JSON Pointer Target;
- Target разрешается в final JSON bundle;
- `documented-only` и `not-representable` имеют точный Reason;
- `unknown` и `conflict` отсутствуют внутри проверяемого scope;
- requirement IDs уникальны.

`documented-only` и `not-representable` не являются автоматическим failure, если
они согласованы и объяснены. Они обязательно попадают в handoff gaps.

## Очистка временных артефактов

После фиксации evidence удали только созданный этим workflow temporary
directory. Не удаляй чужие files и не используй широкие glob patterns.

По умолчанию сохраняются:

- multi-file source contract;
- `redocly.yaml`;
- coverage report;
- verification report.

JSON/YAML bundle, renderer outputs, before/after snapshots и command logs
сохраняй только по явному запросу или project policy.

## Handoff format

Используй эти заголовки именно в таком порядке.

### Статус

`Готов`, `Частично готов` или `Заблокирован` плюс одна точная причина. `Готов`
допустим только при всех обязательных exit `0` и отсутствии scope-блокеров.

### Entrypoint и Redocly alias

Укажи source root, OAS version, alias и workflow (`new` или `update`).

### Изменённые файлы

Перечисли permanent files и роль каждого. Не смешивай их с temporary outputs.

### Operation manifest

Для каждой operation: method/path или webhook/callback locator, `operationId`,
request media, success statuses, error statuses и security.

### Покрытие требований

Дай counts по statuses, путь к report и список non-represented requirement IDs.

### Принятые решения и gaps

Перечисли только явно принятые решения, `documented-only`,
`not-representable`, compatibility risks, out-of-scope existing gaps и
остающиеся blockers.

### Проверки

Сводка каждого gate: command, exit, result, evidence. Не пиши «все тесты
прошли», если выполнялась только часть.

### Временные артефакты и очистка

Перечисли сохранённые bundle/renderer outputs/snapshots/logs либо `Нет`;
отдельно отметь, какие temporary outputs удалены.

## Источники метода

- [Redocly lint and bundle](https://redocly.com/docs/cli/guides/lint-and-bundle)
- [Redocly CLI commands](https://redocly.com/docs/cli/commands)
- [Redocly bundle](https://redocly.com/docs/cli/commands/bundle)
- [OpenAPI Specification 3.2.0](https://spec.openapis.org/oas/v3.2.0.html)
