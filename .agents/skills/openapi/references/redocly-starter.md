# Redocly Starter architecture

## Когда читать

Для режима `new` или когда пользователь явно согласовал перестройку source
layout под многофайловую архитектуру Redocly Starter.

## Входы

- Согласованные API title/version, operation inventory и reusable objects.
- Project root и существующие package/tooling conventions.
- Выбранный Redocly API alias; default при отсутствии convention — `api@v1`.
- Пути постоянных coverage и verification reports.

## Результат

`openapi/openapi.yaml`, reference-only Path Item entries, отдельные Path Item и
используемые component files, root `redocly.yaml` и воспроизводимые команды
config/lint/bundle.

## Критерий завершения

Entrypoint доступен через Redocly alias, каждый обычный path ссылается на свой
файл непосредственно под `openapi/paths`, пустых component directories нет,
config/lint/bundle и deterministic checks проходят.

## Базовая структура

```text
project/
├── redocly.yaml
├── openapi/
│   ├── openapi.yaml
│   ├── paths/
│   │   ├── devices.yaml
│   │   └── devices_{deviceId}.yaml
│   └── components/
│       ├── schemas/
│       │   ├── Device.yaml
│       │   └── Problem.yaml
│       └── parameters/
│           └── DeviceId.yaml
└── docs/
    └── openapi/
        ├── coverage.md
        └── verification.md
```

Создавай только используемые component categories и files. Если components не
нужны, не создавай `openapi/components`. Не добавляй placeholder schemas,
responses, parameters или пустые directories «на будущее».

## `redocly.yaml`

Минимальный профиль для нового контракта:

```yaml
apis:
  api@v1:
    root: openapi/openapi.yaml
    output: dist/openapi.yaml

extends:
  - recommended-strict

rules:
  spec-strict-refs: error
  no-unused-components: error
```

Это намеренно более строгая адаптация Starter: она сохраняет его entrypoint и
multi-file architecture, но усиливает lint. Если project уже задаёт более
строгие rules, сохрани их. Не ослабляй ошибки ради зелёного результата.

Alias — стабильный пользовательский интерфейс команд. Если выбран не
`api@v1`, используй одно и то же имя в config, verification report и handoff.

Не добавляй custom `plugins`, preprocessors или decorators без необходимости и
явного review: Redocly загружает plugin modules как код. Перед запуском
существующего config просмотри эти sections и используй доверенный project
toolchain.

## Root entrypoint

Начни с подтверждённых root fields:

```yaml
openapi: 3.2.0
info:
  title: Device Registry API
  version: 1.0.0
paths:
  /devices:
    $ref: paths/devices.yaml
  /devices/{deviceId}:
    $ref: paths/devices_{deviceId}.yaml
```

Каждый root Path Item — reference-only entry. `get`, `post`, `parameters`,
`summary`, extensions и прочие sibling keys перенеси в соответствующий Path
Item file. Это устраняет неоднозначное merge-поведение и оставляет одного
владельца узла.

Пустой `paths: {}` допустим для webhook-only API. `webhooks` — отдельный root
map; текущий Starter показывает его inline, поэтому не принуждай webhook к
`openapi/paths`.

## Имена Path Item files

По convention Starter замени `/` на `_`, убери ведущий `/`, сохрани `{}` path
parameters:

| Path | File |
| --- | --- |
| `/devices` | `openapi/paths/devices.yaml` |
| `/devices/{deviceId}` | `openapi/paths/devices_{deviceId}.yaml` |
| `/device-groups/{groupId}/members` | `openapi/paths/device-groups_{groupId}_members.yaml` |
| `/` | `openapi/paths/root.yaml` |

Два paths не должны делить один файл. Проверь collisions после замены `/`:
если имена совпали, остановись и согласуй однозначную convention вместо
самовольного suffix.

Path Item file не повторяет path key:

```yaml
parameters:
  - $ref: ../components/parameters/DeviceId.yaml

get:
  operationId: getDevice
  responses:
    '200':
      description: Устройство найдено
      content:
        application/json:
          schema:
            $ref: ../components/schemas/Device.yaml
```

## Components

Один file содержит один reusable object без обёртки category/name:

```yaml
# openapi/components/schemas/Device.yaml
type: object
required: [id]
properties:
  id:
    type: string
    format: uuid
```

Создавай component, если он действительно переиспользуется, нужен как
стабильная именованная boundary или предотвращает semantic divergence. Маленькая
inline schema не обязана становиться component.

Relative `$ref` вычисляется от файла, где он написан:

- из `openapi/openapi.yaml`: `paths/devices.yaml`;
- из `openapi/paths/devices.yaml`: `../components/schemas/Device.yaml`;
- между schemas одной category: `./DeviceId.yaml`.

Не переписывай valid relative refs в absolute filesystem paths или remote URLs.

## Redocly CLI

Сначала найди pinned project command (`npm test`, `pnpm redocly`, локальный
binary). Не меняй package manager и не устанавливай `latest` молча. Следующие
команды показывают намерение; адаптируй launcher, но не gate semantics:

```bash
redocly check-config
redocly lint api@v1
redocly bundle api@v1 --output <temp-dir>/openapi.json
```

Для deterministic verifier нужен обычный JSON bundle. Не используй `--force`:
bundle, созданный вопреки ошибкам, не является доказательством корректности.
Не используй `--dereferenced` без причины — circular schemas могут требовать
сохранённых `$ref`.

`output: dist/openapi.yaml` остаётся удобным project default, но verification
передаёт явный временный JSON output. Не коммить `dist/openapi.yaml`, если
пользователь не попросил сохранить bundle.

Renderer не входит в универсальный Starter gate. Если проект имеет
документированный OAS 3.2-compatible renderer, запусти его project-native
command и добавь результат в verification report. Не используй
`redocly build-docs` как безусловный default: актуальная документация этой
команды отдельно ограничивает её OpenAPI 3.0/3.1.

## Starter-specific review

- Root ровно `openapi/openapi.yaml`, version ровно `3.2.0`.
- `redocly.yaml` находится в project root и alias указывает на root.
- Каждый `paths` key, начинающийся `/`, имеет единственный local file `$ref`.
- Root Path Items не содержат siblings; `x-*` Paths extensions не считаются
  paths.
- Каждый referenced file существует непосредственно под `openapi/paths`.
- Component directories непусты, components используются.
- Bundle создан из alias, а не из случайной копии entrypoint.
- В permanent diff нет временного JSON или renderer output.

## Источники архитектуры

- [Redocly OpenAPI Starter](https://github.com/Redocly/openapi-starter)
- [Starter: adding Paths](https://github.com/Redocly/openapi-starter#paths)
- [Redocly configuration](https://redocly.com/docs/cli/configuration)
- [Redocly `apis` configuration](https://redocly.com/docs/cli/configuration/reference/apis)
- [Redocly bundle](https://redocly.com/docs/cli/commands/bundle)
- [Redocly OpenAPI 3.2 support](https://redocly.com/blog/openapi-3-2)
- [Redocly build-docs support boundary](https://redocly.com/docs/cli/commands/build-docs)
