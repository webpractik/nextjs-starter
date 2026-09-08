# Генерация API-клиента

> Тип: справочник · Статус: актуально · Источники истины:
> [`packages/api/openapi/`](../packages/api/openapi/),
> [`packages/api/redocly.yaml`](../packages/api/redocly.yaml),
> [`packages/api/openapi-ts.config.ts`](../packages/api/openapi-ts.config.ts)

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
    → Redocly bundle → bundled.yaml
    → Hey API → очищенный codegen/
    → post-generation cache tags, mock routes и guarded client normalization
    → Oxfmt только для codegen/
    → root TypeScript check, включающий codegen/
```

Команды `bundle`, `generate:client`, `generate:helpers` и `format:generated` позволяют
диагностировать отдельные этапы. Изменения контракта проверяйте полным `gen`.

`format:generated` дважды запускает Oxfmt только для `codegen/`: текущие вложенные типы клиента
требуют ещё трёх правок после первого прохода. Удаляйте второй проход, когда
`oxfmt --check codegen` проходит после одного на закреплённой версии Oxfmt.

Постгенератор читает операции, теги, пути, параметры и успешные ответы из того же Redocly bundle,
независимо от внутреннего API Hey API. Для маршрутов моков с телом он проверяет наличие фабрики
Faker; `204` возвращает нативный `Response` без тела и фабрики.

Без тегов или ответов текущий парсер может создать запасной маршрут без тела со статусом `200`.
Полноту контракта проверяйте через OpenAPI lint и ревью, а не успех постгенерации.

## Зафиксированный toolchain и TypeScript генератора

- среда выполнения: Node.js 24;
- компилятор приложения: `typescript@7.0.2`;
- генератор: `@hey-api/openapi-ts@0.99.0`;
- локальный компилятор workspace `@repo/api`: `typescript@6.0.3`.

Hey API 0.99.0 падает при загрузке с TypeScript 7.0.2, до генерации. При прямом запуске
`openapi-ts.config.ts` регистрирует хук разрешения модулей Node: только в процессе генерации импорт
`typescript` направляется на локальную 6.0.3. Обычный импорт конфига не имеет побочных эффектов.
Корневой `tsc`, Next.js и тесты используют TypeScript 7; `tsconfig.json` включает сгенерированный код.

`@hey-api/json-schema-ref-parser@1.4.4` фиксирует `js-yaml@4.2.0`, уязвимый к
[CVE-2026-59869](https://github.com/advisories/GHSA-52cp-r559-cp3m). Корневой `overrides` заменяет его
на `4.3.1`, которая также исправляет квадратичную обработку `!!omap`
([GHSA-5p4m-2wfm-xmqj](https://github.com/advisories/GHSA-5p4m-2wfm-xmqj)). Проверяйте установленную
версию через `npm ls js-yaml` и полный `npm audit`. Удаляйте переопределение, когда Hey API перестанет
требовать уязвимую точную версию и аудит останется чистым без него.

Точная версия Hey API дублируется в корневых `devDependencies`: npm 11.16.0 теряет транзитивное
переопределение через ссылку workspace
([npm/cli#9659](https://github.com/npm/cli/issues/9659)). Прямая зависимость применяет его к общему
экземпляру генератора. Удаляйте дубликат после проверки исправленного npm:
чистой установки, `npm ls js-yaml`, полного `npm audit` и `gen`.

Удаляйте локальную 6.0.3 и хук, только когда новая точная версия Hey API:

1. запускается напрямую с TypeScript 7 проекта;
2. принимает текущий Redocly bundle OpenAPI 3.2;
3. проходит полный `gen`, тесты совместимости генератора и корневой `tsc`;
4. даёт чистый diff после второго последовательного `gen`.

Нормализация после генерации сохраняет `data: undefined` для ошибки без исключения и успешного
`204`. При изменении ожидаемой структуры ветвей клиента `gen` остановится, защищая публичное поведение.
После обновления изучите diff: удалите ненужный обходной механизм либо обновите его и регрессионные тесты.

## Какие файлы можно менять

| Путь                                   | Коммитить | Менять вручную | Назначение                         |
| -------------------------------------- | --------- | -------------- | ---------------------------------- |
| `openapi/`                             | Да        | Да             | Источник истины                    |
| `redocly.yaml`, `openapi-ts.config.ts` | Да        | Да             | Конфигурация pipeline              |
| `openapi-ts.config.ts`, `generators/`  | Да        | Да             | Generation и post-generation       |
| Public facets и `client-config.ts`     | Да        | Да             | Стабильный API и runtime transport |
| `bundled.yaml`                         | Нет       | Нет            | Временный bundle Redocly           |
| `codegen/`                             | Да        | Нет            | Generated implementation           |

Hey API использует `output.clean: true`: следующий `gen` удалит ручные и устаревшие файлы из
`codegen/`. Меняйте источник, конфиг или постгенератор и повторяйте генерацию.

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

Числовые алиасы вроде `Pet2`, порядок файлов и пути плагинов не входят в контракт приложения.

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

Доступны ровно шесть точек входа: `@repo/api`, `/client`, `/query`, `/schemas`, `/mocks` и
`/cache-tags`. `exports` направляет их на сгенерированные точки входа и два рукописных адаптера.
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

Успешный JSON-ответ проверяется сгенерированной схемой Zod; невалидный отклоняется с `ZodError`.
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
