# API Codegen: OpenAPI + Redocly + Kubb

## Обзор

Пакет `packages/api` содержит пайплайн для генерации типизированного API-клиента из OpenAPI-спецификации:

1. **OpenAPI** — описание API в формате YAML (OpenAPI 3.0)
2. **Redocly** — линтинг и сборка спеки в единый файл
3. **Kubb** — генерация TypeScript-типов, fetch-клиентов, Zod-валидаторов и React Query хуков

## Структура пакета

Раскладка `openapi/` следует подходу [Redocly openapi-starter](https://github.com/Redocly/openapi-starter/tree/main/openapi): монолитная спека дробится на дерево `$ref`-ссылок, где `openapi.yaml` — это «точка входа», а реальное содержимое лежит в `paths/`, `components/` и `code_samples/`.

```
packages/api/
├── openapi/                       # Исходники спецификации (Redocly-style)
│   ├── openapi.yaml               # Точка входа: info, servers, security, tags, paths-ссылки
│   ├── paths/                     # Эндпоинты API (по одному файлу на путь или операцию)
│   │   ├── README.md              # Договорённости по разбиению путей
│   │   └── pets_{petId}.yaml      # Пример: путь `/pets/{petId}` целиком
│   ├── components/                # Переиспользуемые объекты (по типу OpenAPI)
│   │   ├── schemas/               #   Schema Object         → Pet.yaml, Order.yaml
│   │   ├── parameters/            #   Parameter Object      → PetId.yaml
│   │   ├── responses/             #   Response Object       → NotFound.yaml
│   │   ├── requestBodies/         #   Request Body Object
│   │   ├── headers/               #   Header Object
│   │   ├── examples/              #   Example Object
│   │   ├── links/                 #   Link Object
│   │   ├── callbacks/             #   Callback Object
│   │   └── securitySchemes/       #   Security Scheme Object
│   └── code_samples/              # x-codeSamples для Redocly API Reference
│       └── <lang>/<operationId>   #   например, curl/getPetById
├── redocly.yaml                   # Конфиг линтинга и бандлинга
├── kubb.config.ts                 # Конфиг кодогенерации
├── fetch.client.ts                # Кастомный fetch-клиент (используется сгенерированным кодом)
├── bundled.yaml                   # Собранная спека (генерируется Redocly)
└── codegen/                       # Сгенерированный код (генерируется Kubb)
    ├── models/                    # TypeScript интерфейсы и типы
    ├── zod/                       # Zod-схемы валидации
    ├── hooks/                     # React Query хуки (useQuery, useMutation, useSuspenseQuery)
    ├── mocks/                     # Faker-фабрики (createPet, createGetPetById200, ...)
    │   ├── create<Schema>.ts      #   фабрики верхнеуровневых схем (createPet, createOrder)
    │   └── {tag}Service/          #   фабрики операций тега (createGetPetById, ...)
    ├── tags/                      # React Query cache tags (custom plugin)
    └── {tag}/                     # Fetch-клиенты, сгруппированные по тегам
```

> Подпапки `components/` создаются по мере необходимости — Redocly не требует, чтобы все девять существовали сразу. Пустые директории не коммитятся; добавляйте только те типы компонентов, которые реально используются.

## Команды

```bash
# Из корня проекта
cd packages/api

# Полная генерация (бандлинг + кодогенерация)
bun run generate

# Только бандлинг спеки
bun run bundle

# Линтинг спеки
bun run lint:openapi
```

## Пайплайн генерации

```
openapi.yaml + openapi/{paths,components}
        │
        ▼
  Redocly bundle    →  bundled.yaml
        │
        ▼
  Kubb generate     →  codegen/
        │
        ├── models/     TypeScript типы (interface, asConst enums)
        ├── zod/        Zod-схемы (с coercion, mini-формат)
        ├── hooks/      React Query хуки
        └── {tag}/      Fetch-клиенты по тегам
```

## Работа со спецификацией

### Организация файлов (Redocly conventions)

**Точка входа `openapi/openapi.yaml`** содержит только верхнеуровневые секции и `$ref`-ссылки:

- `info` — версия, лицензия, верхнеуровневое `description` (Markdown). Длинные описания лучше выносить в отдельные `.md` и [встраивать через embedded markdown](https://redocly.com/docs/api-reference-docs/embedded-markdown/).
- `servers` — список окружений с URL-адресами.
- `security` + ссылка на `components/securitySchemes/*`.
- `tags` — каждый с `description`, тег задаёт раздел в Redocly API Reference и группировку в сгенерированном Kubb-коде.
- `paths` — словарь, где значения — это `$ref` на файлы из `paths/`.

**Папка `paths/`** допускает три устоявшихся стиля разбиения, выбирается один и дальше используется единообразно:

| Стиль                              | Пример                            | Когда удобно                                                                        |
| ---------------------------------- | --------------------------------- | ----------------------------------------------------------------------------------- |
| Файл на путь, разделитель `_`      | `paths/users_{username}.yaml`     | Хочется видеть «количество эндпоинтов» одним списком; рекомендуется Redocly         |
| Файл на операцию на верхнем уровне | `paths/users_{username}-get.yaml` | Все операции в одном плоском списке                                                 |
| Подпапки, зеркалящие URL           | `paths/users/{username}/get.yaml` | Структура файлов = структура URL, но глубокие `../../../../components/...` в `$ref` |

Параметры путей всегда заворачиваются в `{}` (`{petId}`, `{username}`), даже в имени файла — это сохраняет совпадение с URL и помогает грепу.

**Папка `components/`** — по одному файлу на компонент, имя файла = имя компонента (`Pet.yaml`, `NotFound.yaml`). Подпапки соответствуют типам OpenAPI 3.x (см. дерево выше). Это даёт два преимущества:

1. Redocly bundle автоматически разрешит `$ref: ../../components/schemas/Pet.yaml` в `#/components/schemas/Pet`.
2. Kubb получит уже именованные схемы, и сгенерированные TS-типы/Zod-схемы будут называться `Pet`, а не `Schema123`.

**Папка `code_samples/`** содержит примеры запросов, которые Redocly подцепляет в API Reference через `x-codeSamples`. Структура: `code_samples/<lang>/<operationId>/<file>`, например `code_samples/curl/getPetById/request.sh`.

### Добавление нового эндпоинта

1. **Схемы.** Если ответ/запрос — новая сущность, создайте `openapi/components/schemas/<Name>.yaml`. Переиспользуемые параметры — в `components/parameters/`, типовые ошибки — в `components/responses/`.
2. **Путь.** Создайте файл в `openapi/paths/` по выбранной конвенции. В нём опишите HTTP-операции, ссылаясь на компоненты через `$ref: ../components/schemas/<Name>.yaml`.
3. **Зарегистрируйте путь** в `openapi/openapi.yaml` под ключом `paths:`:
    ```yaml
    paths:
        /pets/{petId}:
            $ref: ./paths/pets_{petId}.yaml
    ```
4. **Метаданные операции** (Redocly выдаст ошибку при отсутствии обязательных):
    - `operationId` — **обязателен**, используется Kubb как имя функции/хука (`useGetPetByIdQuery`).
    - `summary` — **обязателен**.
    - `description` — рекомендуется.
    - `tags` — **критично**: задаёт папку в `codegen/{tag}/` и имя файла React Query хука.
5. **(Опционально)** Положите примеры запроса в `openapi/code_samples/<lang>/<operationId>/` и сошлитесь через `x-codeSamples` в операции.
6. Запустите `bun run generate` — Redocly соберёт `bundled.yaml`, Kubb перегенерирует `codegen/`.

### Правила Redocly

Конфиг `redocly.yaml` расширяет `recommended` и включает:

| Правило                 | Уровень | Описание                     |
| ----------------------- | ------- | ---------------------------- |
| `no-unused-components`  | warn    | Неиспользуемые компоненты    |
| `operation-operationId` | error   | Обязательный operationId     |
| `operation-summary`     | error   | Обязательный summary         |
| `operation-description` | warn    | Рекомендуемый description    |
| `tag-description`       | warn    | Рекомендуемое описание тегов |

## Конфигурация Kubb

### Плагины и что они генерируют

| Плагин             | Выход      | Описание                                                                    |
| ------------------ | ---------- | --------------------------------------------------------------------------- |
| `pluginOas`        | `swagger/` | Валидация и парсинг спеки                                                   |
| `pluginTs`         | `models/`  | TypeScript интерфейсы, `asConst` enums, `date` для дат                      |
| `pluginClient`     | `{tag}/`   | Fetch-клиенты с Zod-парсингом ответов                                       |
| `pluginZod`        | `zod/`     | Zod-схемы с coercion и inferred-типами                                      |
| `pluginReactQuery` | `hooks/`   | `useQuery` (GET), `useMutation` (POST/PUT/DELETE/PATCH), `useSuspenseQuery` |
| `pluginFaker`      | `mocks/`   | Faker-фабрики для схем и операций (`createPet`, `createGetPetById200`)      |
| `pluginCacheTags`  | `tags/`    | Кастомный плагин — cache tags для React Query                               |

### Ключевые настройки

- **Группировка по тегам** — весь сгенерированный код разделяется по OpenAPI-тегам
- **Fetch-клиент** — используется кастомный `fetch.client.ts` (не axios)
- **Zod mini** — компактный формат схем (`z.string()` вместо `z.object({...}).strict()`)
- **Coercion** — автоматическое приведение типов в Zod-схемах
- **Params** — `paramsType: 'object'`, параметры передаются объектом

## Моки и `pluginFaker`

`@kubb/plugin-faker` генерирует TypeScript-фабрики на базе [`@faker-js/faker`](https://fakerjs.dev/), которые возвращают валидные по типам объекты для каждой схемы и каждого ответа операции. Это полностью локальные функции — они не делают сетевых запросов и используются как фикстуры в тестах и Storybook.

### Что генерируется

Структура `codegen/mocks/` повторяет группировку остального кода — корневые фабрики схем лежат рядом, а операции разнесены по тегам с суффиксом `Service` (см. `name: ({ group }) => '${group}Service'` в `kubb.config.ts`):

```
codegen/mocks/
├── createPet.ts                 # фабрика верхнеуровневой схемы Pet
├── createCategory.ts
├── createOrder.ts
├── index.ts                     # barrel (named exports)
└── petService/
    ├── createGetPetById.ts      # одна функция на каждый компонент операции
    ├── createAddPet.ts
    └── index.ts
```

Внутри файла операции генерируются отдельные фабрики на каждый ответ, path/query params и общий `*QueryResponse`:

```typescript
// codegen/mocks/petService/createGetPetById.ts
export function createGetPetByIdPathParams(
    data?: Partial<GetPetByIdPathParams>,
): GetPetByIdPathParams
export function createGetPetById200(data?: Partial<GetPetById200>): GetPetById200
export function createGetPetById404(): undefined
export function createGetPetByIdQueryResponse(
    data?: Partial<GetPetByIdQueryResponse>,
): GetPetByIdQueryResponse
```

Каждая фабрика принимает `Partial<T>` для override отдельных полей — это позволяет в тестах подменять только то, что важно сцене:

```typescript
import { createPet } from '@repo/api/codegen/mocks/createPet'

const sold = createPet({ status: 'sold', name: 'Rex' })
```

### Конфигурация плагина

Из `packages/api/kubb.config.ts`:

```typescript
pluginFaker({
    output: { path: './mocks', barrelType: 'named' },
    group: { type: 'tag', name: ({ group }) => `${group}Service` },
    dateType: 'date',
    unknownType: 'unknown',
    seed: [100],
})
```

| Опция               | Значение          | Эффект                                                                                         |
| ------------------- | ----------------- | ---------------------------------------------------------------------------------------------- |
| `output.barrelType` | `'named'`         | В `index.ts` именованные re-export'ы — не ломают tree-shaking                                  |
| `group.type`        | `'tag'`           | Операции раскладываются по тегам, как и остальной код                                          |
| `group.name`        | `${group}Service` | Подпапка получает суффикс `Service` (`petService`, `userService`) — изолирует от папок клиента |
| `dateType`          | `'date'`          | `format: date / date-time` → `faker.date.*()` вместо строки                                    |
| `seed`              | `[100]`           | **Детерминированный вывод**: каждая фабрика делает `faker.seed([100])` перед генерацией        |

> ⚠️ **Про `seed: [100]`.** Глобальный seed зафиксирован, поэтому два вызова `createPet()` подряд вернут **одинаковые** объекты. Это удобно для snapshot-тестов, но опасно, если нужны разные данные в одном тесте — используйте overrides (`createPet({ id: 1 })`, `createPet({ id: 2 })`) или сбрасывайте seed вручную через `faker.seed()` перед каждым вызовом.

### Где использовать

| Сценарий                             | Как                                                                                                 |
| ------------------------------------ | --------------------------------------------------------------------------------------------------- |
| **Unit-тесты** (Vitest browser mode) | Импортировать фабрику и подставлять в моки React Query / возвращаемое значение mock-функции клиента |
| **Storybook**                        | Возвращать `createPet()` из loader или `parameters.mockData`                                        |

Пример с Vitest + React Query:

```typescript
import { createGetPetById200 } from '@repo/api/codegen/mocks/petService/createGetPetById'
import { vi } from 'vitest'
import * as petClient from '@repo/api/codegen/pet/getPetById'

vi.spyOn(petClient, 'getPetById').mockResolvedValue({
    data: createGetPetById200({ status: 'available' }),
    // ...
})
```

### Регенерация и git

- Папка `codegen/mocks/` — артефакт, **никогда не редактируется руками**, всегда перегенерируется через `bun run generate`.
- В `.eslintrc` `codegen/` уже игнорируется, так что fake-импорты `@faker-js/faker` не вызывают лишних ругательств.
- `@faker-js/faker` должен быть установлен как обычная зависимость `packages/api`, а не devDependency — сгенерированные фабрики импортируют его напрямую.

## Fetch-клиент

Кастомный `fetch.client.ts` — обёртка над `globalThis.fetch`, которую используют все сгенерированные клиенты.

Выбор baseURL описан в [docs/bff-proxy.md](./bff-proxy.md).

## Использование сгенерированного кода

```typescript
// TypeScript типы
import type { Pet } from '@repo/api/codegen/models/pet'

// Zod-схемы
import { petSchema } from '@repo/api/codegen/zod/pet'

// Fetch-клиент
import { getPetById } from '@repo/api/codegen/pet/getPetById'

// React Query хуки
import { useGetPetByIdQuery } from '@repo/api/codegen/hooks/pet/useGetPetByIdQuery'

// Faker-фабрики (тесты, Storybook, MSW)
import { createPet } from '@repo/api/codegen/mocks/createPet'
import { createGetPetById200 } from '@repo/api/codegen/mocks/petService/createGetPetById'
```

## Важно

- Папка `codegen/` — сгенерированный код, не редактируйте вручную
- После изменения спеки всегда запускайте `bun run generate`
- `bundled.yaml` — артефакт сборки, коммитится в репозиторий для удобства ревью
- Линтинг ESLint игнорирует `packages/api/codegen` и `packages/api/bundled.yaml`
