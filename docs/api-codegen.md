# Генерация API-клиента

> Тип: справочник · Статус: актуально · Источники истины:
> [`packages/api/openapi/`](../packages/api/openapi/),
> [`packages/api/redocly.yaml`](../packages/api/redocly.yaml),
> [`packages/api/openapi-ts.config.ts`](../packages/api/openapi-ts.config.ts)

**Когда читать:** чтобы изменить OpenAPI-операцию, перегенерировать API, выбрать public import или
разобраться с SDK result, TanStack Query options, mocks и cache tags.

## Главное

- Меняйте контракт в `packages/api/openapi/`, а не файлы в `packages/api/codegen/`.
- После изменения запускайте полный `gen`, tests `@repo/api` и root `tsc`.
- Каноническая версия контракта — OpenAPI 3.2.0. Не понижайте её и не создавайте скрытую 3.1-копию.
- В приложении импортируйте только public facets пакета; `@repo/api/codegen/*` — internal.

Petstore-контракт проверяет генератор. Это пример, а не backend: Next.js не обслуживает `/pets`.

## Где лежит контракт

Точка входа — [`openapi.yaml`](../packages/api/openapi/openapi.yaml). Остальные части подключаются
относительными `$ref`.

```text
packages/api/openapi/
├── openapi.yaml
├── paths/
│   ├── pets.yaml
│   └── pets-by-id.yaml
└── components/
    ├── parameters/
    ├── responses/
    └── schemas/
```

Пример содержит пять операций:

| Метод    | Путь            | `operationId`      | Успешный ответ |
| -------- | --------------- | ------------------ | -------------- |
| `GET`    | `/pets`         | `findPetsByStatus` | `200 PetPage`  |
| `POST`   | `/pets`         | `createPet`        | `201 Pet`      |
| `GET`    | `/pets/{petId}` | `getPetById`       | `200 Pet`      |
| `PATCH`  | `/pets/{petId}` | `updatePet`        | `200 Pet`      |
| `DELETE` | `/pets/{petId}` | `deletePet`        | `204`          |

`findPetsByStatus` принимает массив `status`; `offset` служит page parameter для Infinite Query.

## Как запустить генерацию

Из корня репозитория:

```bash
npm --workspace @repo/api run lint:openapi
npm --workspace @repo/api run gen
npm --workspace @repo/api run test
npm run tsc
```

`gen` выполняет одну последовательность:

```text
openapi/openapi.yaml и $ref-файлы
    → Redocly bundle → bundled.yaml
    → Hey API → очищенный codegen/
    → post-generation cache tags, mock routes и guarded client normalization
    → Oxfmt только для codegen/
    → root TypeScript check, включающий codegen/
```

Отдельные команды `bundle`, `generate:client`, `generate:helpers` и `format:generated` нужны для
диагностики конкретного этапа. Обычное изменение контракта должно проходить через полный `gen`.

`format:generated` делает два прохода Oxfmt только по `codegen/`: для текущей формы nested client
types первый проход оставляет три стабильных rewrite для второго. Удаляйте второй проход, когда
`oxfmt --check codegen` проходит сразу после одного форматирования на зафиксированной версии Oxfmt.

Post-generator читает тот же Redocly bundle и извлекает операции, tags, paths, параметры и
успешные ответы независимо от внутреннего API Hey API. Он проверяет наличие нужной Faker factory
для каждого mock route с body. Для `204` factory не нужна: generated route возвращает нативный
`Response` без body.

Текущий parser сам не отклоняет операцию без tags или responses и может создать fallback route без
body со статусом `200`. Обязательность этих полей контролируйте OpenAPI lint и review; не считайте
успешный post-generator отдельным доказательством полноты контракта.

## Зафиксированный toolchain и TypeScript генератора

- runtime проекта: Node.js 24;
- application compiler: `typescript@7.0.2`;
- generator: `@hey-api/openapi-ts@0.99.0`;
- локальный compiler workspace `@repo/api`: `typescript@6.0.3`.

Версия Hey API 0.99.0 падает при загрузке с TypeScript 7.0.2 до генерации. Поэтому
`openapi-ts.config.ts` при прямом запуске регистрирует Node module-resolution hook, который только
в codegen process направляет импорт `typescript` на локальную версию 6.0.3. При обычном импорте
файл остаётся config без side effects. Root `tsc`, Next.js и tests продолжают использовать
TypeScript 7; root `tsconfig.json` включает generated output.

`@hey-api/json-schema-ref-parser@1.4.4` фиксирует `js-yaml@4.2.0`, уязвимый к
[CVE-2026-59869](https://github.com/advisories/GHSA-52cp-r559-cp3m). Root `overrides` заменяет его
на первую исправленную версию ветки 4.x — `4.3.0`; unit test проверяет фактически разрешённую из
parser package версию. Удаляйте override после того, как Hey API перестанет требовать уязвимый
exact pin и полный `npm audit` останется чистым без него.

Удаляйте локальную версию 6.0.3 и hook только после того, как новая exact-версия Hey API:

1. запускается напрямую с project TypeScript 7;
2. принимает текущий Redocly bundle OpenAPI 3.2;
3. проходит полный `gen`, generator parity tests и root `tsc`;
4. даёт чистый diff после второго последовательного `gen`.

Guarded post-generation normalization сохраняет `data: undefined` в non-throwing error result и
для успешного `204`. Если upstream client изменит ожидаемую форму ветвей, `gen` остановится вместо
молчаливого изменения публичной семантики; после upgrade нужно изучить diff и удалить ставший
ненужным workaround либо обновить его вместе с regression tests.

## Какие файлы можно менять

| Путь                                   | Коммитить | Менять вручную | Назначение                         |
| -------------------------------------- | --------- | -------------- | ---------------------------------- |
| `openapi/`                             | Да        | Да             | Источник истины                    |
| `redocly.yaml`, `openapi-ts.config.ts` | Да        | Да             | Конфигурация pipeline              |
| `openapi-ts.config.ts`, `generators/`  | Да        | Да             | Generation и post-generation       |
| Public facets и `client-config.ts`     | Да        | Да             | Стабильный API и runtime transport |
| `bundled.yaml`                         | Нет       | Нет            | Временный bundle Redocly           |
| `codegen/`                             | Да        | Нет            | Generated implementation           |

Hey API запускается с `output.clean: true`: следующий `gen` удаляет ручные и устаревшие файлы из
`codegen/`. Меняйте источник, config или post-generator, затем регенерируйте output.

## Что появляется в `codegen/`

| Путь                           | Содержимое                                    |
| ------------------------------ | --------------------------------------------- |
| `types.gen.ts`                 | OpenAPI types и `as const` enum objects       |
| `sdk.gen.ts`                   | Flat SDK с `path`/`query`/`body` options      |
| `client/`, `client.gen.ts`     | Next.js Fetch client и настроенный instance   |
| `zod.gen.ts`                   | Zod 4 request/response schemas                |
| `@tanstack/react-query.gen.ts` | Query/mutation/infinite options и tagged keys |
| `@faker-js/faker.gen.ts`       | Typed Faker factories                         |
| `cache-tags/`                  | Server-only cache tag namespaces              |
| `mock-client-routes.ts`        | Method/path/status → Faker factory            |

Внутренние numeric aliases вроде `Pet2`, порядок файлов и scoped plugin paths не являются
application contract.

## Public facets

```ts
import type { Pet } from '@repo/api'

import { getPetById, PetStatus } from '@repo/api'
import { client, createClient } from '@repo/api/client'
import { pets } from '@repo/api/cache-tags' // только server
import { fakePet } from '@repo/api/mocks'
import { getPetByIdOptions } from '@repo/api/query'
import { zPet } from '@repo/api/schemas'
```

Доступны ровно шесть facets: `@repo/api`, `/client`, `/query`, `/schemas`, `/mocks` и
`/cache-tags`. Package `exports` направляет их на соответствующие generated entrypoints и два
ручных adapter-файла. Не добавляйте deep import в `codegen/` и не используйте numeric aliases:
они остаются деталями конкретной версии генератора.

## SDK options и result model

Path-параметры передаются в `path`, query-параметры — в `query`, JSON body — в `body`:

```ts
const result = await getPetById({
    path: { petId: 'pet_123' },
})

if (result.error !== undefined) {
    // result.data === undefined; result.error типизирован по documented responses.
    return
}

result.data.name
result.response
```

По умолчанию HTTP error не бросается: SDK возвращает `{ data: undefined, error, response }`.
Если workflow использует exceptions, включите `throwOnError`:

```ts
const { data, response } = await getPetById({
    path: { petId: 'pet_123' },
    throwOnError: true,
})
```

Успешный JSON response проходит generated Zod validation. Невалидный payload отклоняется с
`ZodError`. `DELETE` с documented status `204` возвращает `data: undefined` и исходный `Response`.
Нативные Fetch/Next.js options передаются вместе с SDK options:

```ts
await getPetById({
    cache: 'force-cache',
    next: { revalidate: 60, tags: ['pets', 'pets:petId:pet_123'] },
    path: { petId: 'pet_123' },
})
```

## TanStack Query composition

Generator создаёт options factories, а не готовые `use...` hooks:

```tsx
'use client'

import { createPetMutation, getPetByIdOptions } from '@repo/api/query'
import { useMutation, useQuery } from '@tanstack/react-query'

const pet = useQuery(getPetByIdOptions({ path: { petId } }))
const create = useMutation(createPetMutation())

create.mutate({ body: { name: 'Pixel' } })
```

Query и mutation keys включают OpenAPI tags. Для offset pagination компонуйте generated infinite
options с policy конкретного экрана:

```tsx
const pets = useInfiniteQuery({
    ...findPetsByStatusInfiniteOptions({
        query: { limit: 20, status: ['available'] },
    }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
        const nextOffset = lastPage.offset + lastPage.limit
        return nextOffset < lastPage.total ? nextOffset : undefined
    },
})
```

Numeric `pageParam` заменяет только `query.offset`; filters, limit, headers, path и остальные
options сохраняются. Импортируйте `useInfiniteQuery` и factory явно в реальном компоненте.

## Как добавить или изменить операцию

1. Добавьте schemas, parameters и responses в `openapi/components/`.
2. Опишите path item в `openapi/paths/` и подключите его в `openapi.yaml`.
3. Укажите уникальный `operationId`, обязательный `summary`, корректные tags и responses.
4. Запустите `lint:openapi` и полный `gen`.
5. Проверьте generated и package exports diff: names, optionality, statuses, query keys, mocks и
   cache tags.
6. Запустите tests `@repo/api` и root `tsc`.
7. Повторите `gen` и убедитесь, что второй запуск ничего не меняет.

Не копируйте generated Zod schemas в `src/schemas`. Для tests и Storybook используйте factories
из `@repo/api/mocks`, если нужная уже существует.

## Связанные документы

- [Как API-запрос доходит до backend](bff-proxy.md)
- [Как работает режим моков](mock-mode.md)
- [Кеширование и generated tags](cache-and-streaming.md)
- [Как тестировать проект](testing-guidelines.md)
