# Генерация API-клиента

> Тип: справочник · Статус: актуально · Источники истины:
> [`packages/api/openapi/`](../packages/api/openapi/),
> [`packages/api/redocly.yaml`](../packages/api/redocly.yaml),
> [`packages/api/kubb.config.ts`](../packages/api/kubb.config.ts)

## Главное

- Меняйте контракт в `packages/api/openapi/`, а не файлы в `packages/api/codegen/`.
- После изменения запускайте полный `gen`, тесты `@repo/api` и корневой `tsc`.
- Каноническая версия контракта — OpenAPI 3.2.0. Не понижайте её и не создавайте скрытую 3.1-копию.
- Импортируйте только публичные точки входа пакета; `@repo/api/codegen/*` — внутренний код.

Petstore-контракт — пример для проверки генератора, без бэкенда: Next.js не обслуживает `/pets`.

## Где лежит контракт

[`openapi.yaml`](../packages/api/openapi/openapi.yaml) подключает остальные части относительными
`$ref`.

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

`findPetsByStatus` принимает массив `status`; `offset` задаёт страницу для Infinite Query.

## Как запустить генерацию

Из корня репозитория:

```bash
npm --workspace @repo/api run lint:openapi
npm --workspace @repo/api run gen
npm --workspace @repo/api run test
npm run tsc
```

`gen` выполняет этапы по порядку:

```text
openapi/openapi.yaml и $ref-файлы
    → Redocly lint → Redocly bundle → bundled.yaml
    → Kubb 5: TypeScript, Zod, plugin-client и Faker → очищенный codegen/
    → проверка AST и project helpers: facets, Query, cache tags, mock routes
    → Oxfmt только для codegen/
    → root TypeScript check, включающий codegen/
```

Команды `bundle`, `generate:client`, `generate:helpers` и `format:generated` позволяют
диагностировать отдельные этапы. Изменения контракта проверяйте полным `gen`.

`gen:check` сохраняет имена и SHA-256 всех файлов `codegen/`, запускает полный `gen` и
сравнивает результат, включая новые, удалённые и скрытые файлы. GitLab CI выполняет эту проверку
перед `verify:fast`. После изменения контракта сначала выполните `gen` и включите output в diff.

```bash
npm --workspace @repo/api run gen:check
```

`format:generated` выполняет два прохода Oxfmt только по generated output. Постгенератор
проверяет наличие response-фабрик для всех операций с телом; при изменении ожидаемой формы
Kubb output генерация останавливается.

## Toolchain и границы совместимости

- Node.js 24, npm 11, компилятор приложения TypeScript 7.0.2;
- Kubb 5.5.6 и adapter-oas 5.5.6;
- plugin-ts 5.0.5, plugin-zod 5.4.3, plugin-client 5.5.4, plugin-faker 5.1.0;
- Zod 4.6.5, TanStack Query 5.104.1, Faker 10.6.0.

Версии плагинов Kubb выпускаются независимо. Прямого compiler workspace TypeScript 6 и Node
resolution hook больше нет; корневой TypeScript 7 проверяет конфиг и весь generated output.

Канонический контракт остаётся **OpenAPI 3.2.0**. Встроенный валидатор Kubb пока объявляет
поддержку только 2.0/3.0/3.1, поэтому `adapterOas.validate` выключен. Обязательная валидация
выполняется Redocly перед генерацией. Дополнительная проверка сравнивает версию, операции,
методы, пути, path-параметры, теги и response statuses адаптера с тем же bundle.

Это подтверждает используемый Petstore-поднабор контракта, а не произвольные возможности 3.2.
При добавлении новых конструкций OpenAPI отдельно проверяйте их AST, generated types и runtime.
Bundle не понижается и скрытая 3.1-копия не создаётся. Для bodyless responses Kubb создаёт
synthetic unknown schema; guarded post-generation заменяет её на `undefined` в types и Zod.

`plugin-client` генерирует операции поверх проектного Fetch-клиента `client.ts`. Он сохраняет
SDK options, native `Response`, настройки Next.js и runtime mock mode. Официальный Query-плагин
пока ориентирован на plugin-fetch/plugin-axios, поэтому options factories создаёт небольшой
проектный генератор из Kubb operation types. Готовые React hooks не генерируются.

Фабрики Faker адаптируются генератором для передачи `options.faker` каждому вложенному вызову.
Глобальный экземпляр не перенастраивается. Для mock request фиксируются seed и reference date.
Zod object schemas сохраняют прежнюю политику: дополнительные поля удаляются при parse.

## Какие файлы можно менять

| Путь                               | Коммитить | Менять вручную | Назначение                         |
| ---------------------------------- | --------- | -------------- | ---------------------------------- |
| `openapi/`                         | Да        | Да             | Источник истины                    |
| `redocly.yaml`                     | Да        | Да             | Валидация и bundle                 |
| `kubb.config.ts`, `generators/`    | Да        | Да             | Generation и post-generation       |
| Public facets и `client-config.ts` | Да        | Да             | Стабильный API и runtime transport |
| `bundled.yaml`                     | Нет       | Нет            | Временный bundle Redocly           |
| `codegen/`                         | Да        | Нет            | Generated implementation           |

Kubb использует `output.clean: true`: следующий `gen` удалит ручные и устаревшие файлы из
`codegen/`. Меняйте источник, конфиг или постгенератор и повторяйте генерацию.

## Что появляется в `codegen/`

| Путь                           | Содержимое                                                       |
| ------------------------------ | ---------------------------------------------------------------- |
| `types/`                       | OpenAPI types и `as const` enum objects                          |
| `clients/`                     | SDK с `path`/`query`/`body` options поверх проектного транспорта |
| `schemas/`, `schema-facade.ts` | Zod 4 schemas и публичные `z...` aliases                         |
| `query.ts`                     | Query/mutation/infinite options и tagged keys                    |
| `faker/`, `mocks.ts`           | Faker factories и публичные request/response aliases             |
| `cache-tags/`                  | Server-only cache tag namespaces                                 |
| `mock-client-routes.ts`        | Method/path/status → Faker factory                               |

Числовые алиасы вроде `Pet2`, порядок файлов и пути плагинов не входят в контракт приложения.

## Public facets

```ts
import type { Pet } from '@repo/api'

import { getPetById, PetStatus } from '@repo/api'
import { pets } from '@repo/api/cache-tags' // только server
import { client, createClient } from '@repo/api/client'
import { fakePet } from '@repo/api/mocks'
import { getPetByIdOptions } from '@repo/api/query'
import { zPet } from '@repo/api/schemas'
```

Доступны ровно шесть точек входа: `@repo/api`, `/client`, `/query`, `/schemas`, `/mocks` и
`/cache-tags`. `exports` направляет их на сгенерированные точки входа и рукописные runtime-адаптеры.
Внутренности `codegen/` и числовые алиасы зависят от версии генератора: не импортируйте их.

## SDK options и result model

Параметры пути передаются в `path`, строки запроса — в `query`, тело JSON — в `body`:

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

При ошибке HTTP SDK по умолчанию возвращает `{ data: undefined, error, response }`.
Для исключений включите `throwOnError`:

```ts
const { data, response } = await getPetById({
    path: { petId: 'pet_123' },
    throwOnError: true,
})
```

Успешный JSON-ответ проверяется сгенерированной схемой Zod; невалидный возвращает `ZodError` в `error` по умолчанию и бросает его при `throwOnError: true`.
`DELETE` с описанным статусом `204` возвращает `data: undefined` и исходный `Response`.
Нативные опции Fetch/Next.js передаются вместе с опциями SDK:

```ts
await getPetById({
    cache: 'force-cache',
    next: { revalidate: 60, tags: ['pets', 'pets:petId:pet_123'] },
    path: { petId: 'pet_123' },
})
```

## TanStack Query composition

Генератор создаёт фабрики опций, а не готовые хуки `use...`:

```tsx
'use client'

import { createPetMutation, getPetByIdOptions } from '@repo/api/query'
import { useMutation, useQuery } from '@tanstack/react-query'

const pet = useQuery(getPetByIdOptions({ path: { petId } }))
const create = useMutation(createPetMutation())

create.mutate({ body: { name: 'Pixel' } })
```

Ключи запросов и мутаций включают теги OpenAPI. Для пагинации по смещению дополняйте сгенерированные
опции Infinite Query правилами экрана:

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

Числовой `pageParam` заменяет только `query.offset`, сохраняя фильтры, лимит, заголовки, путь и
остальные опции. В компоненте явно импортируйте `useInfiniteQuery` и фабрику.

## Как добавить или изменить операцию

1. Добавьте схемы, параметры и ответы в `openapi/components/`.
2. Опишите путь в `openapi/paths/` и подключите его в `openapi.yaml`.
3. Укажите уникальный `operationId`, обязательный `summary`, корректные теги и ответы.
4. Запустите `lint:openapi` и полный `gen`.
5. Проверьте diff сгенерированного кода и экспортов пакета: имена, обязательность, статусы, ключи
   запросов, моки и теги кеша.
6. Запустите тесты `@repo/api` и корневой `tsc`.
7. Повторите `gen` и убедитесь, что второй запуск ничего не меняет.

Не копируйте сгенерированные Zod-схемы в `src/schemas`. Для тестов и Storybook берите фабрики
из `@repo/api/mocks`, если нужная уже есть.

## Связанные документы

- [Как API-запрос доходит до backend](bff-proxy.md)
- [Как работает режим моков](mock-mode.md)
- [Кеширование и сгенерированные теги](cache-and-streaming.md)
- [Как тестировать проект](testing-guidelines.md)
