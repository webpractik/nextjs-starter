---
type: workflow
title: Контракт и генерация API
description: Контракт и генерация API в Next.js Starter, реальные контракты и рабочие сценарии.
tags: [nextjs, starter, workflow]
sources:
  - id: openwiki-source-5b54a58d1b51cd490b0e7162
    resource: repo://package.json
  - id: openwiki-source-6ce26fe90f055e78a63e23dd
    resource: repo://src/api/client.ts
  - id: openwiki-source-0c50ec67dbf3a98ae2f6a63d
    resource: repo://src/api/generators/post-generate.ts
  - id: openwiki-source-9a060d5ac87acfe866b60f95
    resource: repo://src/api/openapi/components/schemas/update-pet.yaml
  - id: openwiki-source-8c1c6fe3dc524dd1d72fbfb7
    resource: repo://tests/unit/src/api/schemas.test.ts
generated: { by: "codex", at: "2026-11-16T15:55:30.306Z" }
verified:
  - by: openwiki/0.7.2
    at: 2026-11-16T15:41:39.256Z
---

# Генерация API-клиента

> Тип: справочник · Статус: актуально · Источники истины:
> [`src/api/openapi/`](../../src/api/openapi/openapi.yaml),
> [`src/api/redocly.yaml`](../../src/api/redocly.yaml),
> [`src/api/kubb.config.ts`](../../src/api/kubb.config.ts)

## Главное

- Меняйте контракт в `src/api/openapi/`, а не файлы в `src/api/codegen/`.
- После изменения запускайте полный `gen`, тесты `#/api` и корневой `tsc`.
- Контракт использует OpenAPI 3.2.0. Не понижайте версию и не создавайте скрытую 3.1-копию.
- Импортируйте только публичные точки входа API. `#/api/codegen/*` содержит внутренний код.

Petstore-контракт нужен для проверки генератора и не имеет бэкенда. Next.js не обслуживает `/pets`.

## Где лежит контракт

[`openapi.yaml`](../../src/api/openapi/openapi.yaml) подключает остальные части относительными
`$ref`.

```text
src/api/openapi/
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

`findPetsByStatus` принимает массив `status`. Параметр `offset` задаёт страницу для Infinite Query.

## Как запустить генерацию

Из корня репозитория:

```bash
npm run api:lint:openapi
npm run api:gen
npm run api:test
npm run tsc
```

`api:test` запускает unit-тесты из `tests/unit/src/api/`. Тесты больше не размещаются
рядом с контрактом и транспортом в `src/api/`.

`gen` выполняет этапы по порядку:

```text
openapi/openapi.yaml и $ref-файлы
    → Redocly lint → Redocly bundle → bundled.yaml
    → Kubb 5: TypeScript, Zod, plugin-client и Faker → очищенный codegen/
    → проверка AST и project helpers: facets, Query, cache tags, mock routes
    → Oxfmt только для codegen/
    → root TypeScript check, включающий codegen/
```

Команды `api:bundle`, `api:generate:client` и `api:generate:helpers` позволяют
диагностировать отдельные этапы. Изменения контракта проверяйте полным `npm run api:gen`.

`gen:check` сохраняет имена и SHA-256 всех файлов `codegen/`, запускает полный `gen` и
сравнивает результат, включая новые, удалённые и скрытые файлы. Выполняйте проверку локально
перед `verify:fast`. Конфигурации CI удалены. После изменения контракта сначала выполните
`gen` и включите сгенерированные файлы в diff.

```bash
npm run api:gen:check
```

`npm run api:gen` запускает Oxfmt дважды и только для сгенерированных файлов. Постгенератор
проверяет наличие фабрик ответов для всех операций с телом. Если структура результата Kubb
не соответствует ожидаемой, генерация останавливается.

## Toolchain и границы совместимости

- Node.js 26.13.1+, npm 11, компилятор приложения TypeScript 7.0.2;
- Kubb 5.20.2 и adapter-oas 5.20.2;
- plugin-ts 5.5.4, plugin-zod 5.9.4, plugin-client 6.0.4, plugin-faker 5.4.5;
- Zod 4.6.7, TanStack Query 5.107.1, Faker 10.6.0.

Версии плагинов Kubb выпускаются независимо. Отдельного compiler workspace с TypeScript 6
и Node resolution hook больше нет. Корневой TypeScript 7 проверяет конфиг и весь сгенерированный код.

Контракт использует OpenAPI 3.2.0. Встроенный валидатор Kubb пока объявляет поддержку
только 2.0, 3.0 и 3.1, поэтому `adapterOas.validate` выключен. Redocly выполняет обязательную
валидацию перед генерацией. Дополнительная проверка сравнивает данные адаптера с тем же bundle.
Она проверяет версию, операции, методы, пути, параметры пути, теги и статусы ответов.

Проверка подтверждает только тот набор возможностей контракта, который использует Petstore.
Она не подтверждает произвольные возможности OpenAPI 3.2. При добавлении новых конструкций OpenAPI отдельно проверяйте их AST, сгенерированные типы
и поведение при выполнении. Версия bundle не понижается, скрытой 3.1-копии нет. Для ответов
без тела Kubb создаёт synthetic unknown schema. Постгенератор с проверками заменяет её
на `undefined` в типах и Zod.

`plugin-client` генерирует операции поверх проектного Fetch-клиента `client.ts`. Клиент сохраняет
опции SDK, нативный `Response`, настройки Next.js и runtime mock mode. Официальный Query-плагин
пока ориентирован на plugin-fetch и plugin-axios. Поэтому проектный генератор создаёт фабрики
опций из типов операций Kubb. Готовые React hooks не генерируются.

Генератор адаптирует фабрики Faker, чтобы они передавали `options.faker` каждому вложенному вызову.
Глобальный экземпляр не перенастраивается. Для mock request фиксируются seed и reference date.
Объектные схемы Zod по-прежнему удаляют дополнительные поля при parse.

После обновления генератора Zod-схема `UpdatePet` проверяет существующее в контракте
`minProperties: 1`. При валидации через публичную схему пустой объект `{}` отклоняется.
Прежняя версия плагина пропускала это ограничение. Сам OpenAPI-контракт не менялся.
Не используйте пустой patch в формах и фикстурах, которые проверяются этой схемой.

## Какие файлы можно менять

| Путь                               | Коммитить | Менять вручную | Назначение                         |
| ---------------------------------- | --------- | -------------- | ---------------------------------- |
| `openapi/`                         | Да        | Да             | Источник истины                    |
| `redocly.yaml`                     | Да        | Да             | Валидация и bundle                 |
| `kubb.config.ts`, `generators/`    | Да        | Да             | Генерация и обработка результата       |
| Public facets и `client-config.ts` | Да        | Да             | Стабильный API и транспорт |
| `bundled.yaml`                     | Нет       | Нет            | Временный bundle Redocly           |
| `codegen/`                         | Да        | Нет            | Сгенерированная реализация           |

Kubb использует `output.clean: true`. Следующий `gen` удалит ручные и устаревшие файлы из
`codegen/`. Меняйте источник, конфиг или постгенератор и повторяйте генерацию.

## Что появляется в `codegen/`

| Путь                           | Содержимое                                                       |
| ------------------------------ | ---------------------------------------------------------------- |
| `types/`                       | Типы OpenAPI и объекты enum с `as const`                          |
| `clients/`                     | SDK с опциями `path`/`query`/`body` поверх проектного транспорта |
| `schemas/`, `schema-facade.ts` | Схемы Zod 4 и публичные алиасы `z...`                         |
| `query.ts`                     | Опции Query, mutation и infinite, ключи с тегами                    |
| `faker/`, `mocks.ts`           | Фабрики Faker и публичные алиасы запросов и ответов             |
| `cache-tags/`                  | Серверные пространства имён тегов кеша                                 |
| `mock-client-routes.ts`        | Соответствие метода, пути и статуса фабрике Faker                               |

Числовые алиасы вроде `Pet2`, порядок файлов и пути плагинов не входят в контракт приложения.

## Public facets

```ts
import type { Pet } from '#/api'

import { getPetById, PetStatus } from '#/api'
import { pets } from '#/api/cache-tags' // только server
import { client, createClient } from '#/api/client'
import { fakePet } from '#/api/mocks'
import { getPetByIdOptions } from '#/api/query'
import { zPet } from '#/api/schemas'
```

Доступны ровно шесть точек входа: `#/api`, `/client`, `/query`, `/schemas`, `/mocks` и
`/cache-tags`. Файлы `src/api/index.ts`, `query.ts`, `schemas.ts` и `cache-tags.ts`
реэкспортируют сгенерированный API. `client.ts` и `mocks.ts` задают runtime API. Отдельного
npm-манифеста с `exports` больше нет. Пути разрешает корневой алиас `#/*`.
Внутренние файлы `codegen/` и числовые алиасы зависят от версии генератора. Не импортируйте их.

## SDK options и result model

Передавайте параметры пути в `path`, параметры строки запроса в `query`, тело JSON в `body`:

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

SDK проверяет успешный JSON-ответ сгенерированной схемой Zod. Если ответ невалиден, SDK
по умолчанию возвращает `ZodError` в `error`, а при `throwOnError: true` бросает исключение.
`DELETE` с описанным статусом `204` возвращает `data: undefined` и исходный `Response`.
Передавайте нативные опции Fetch и Next.js вместе с опциями SDK:

```ts
await getPetById({
    cache: 'force-cache',
    next: { revalidate: 60, tags: ['pets', 'pets:petId:pet_123'] },
    path: { petId: 'pet_123' },
})
```

## TanStack Query composition

Генератор создаёт фабрики опций. Готовые хуки `use...` не генерируются:

```tsx
'use client'

import { useMutation, useQuery } from '@tanstack/react-query'

import { createPetMutation, getPetByIdOptions } from '#/api/query'

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
5. Проверьте diff сгенерированного кода и публичных экспортов API: имена, обязательность, статусы, ключи
   запросов, моки и теги кеша.
6. Запустите тесты `#/api` и корневой `tsc`.
7. Повторите `gen` и убедитесь, что второй запуск ничего не меняет.

Не копируйте сгенерированные Zod-схемы в `src/schemas`. Для тестов и Storybook берите фабрики
из `#/api/mocks`, если нужная уже есть.

## Связанные документы

- [Как API-запрос доходит до backend](../architecture/bff-proxy.md)
- [Как работает режим моков](mock-mode.md)
- [Кеширование и сгенерированные теги](../architecture/cache-and-streaming.md)
- [Как тестировать проект](../testing/testing.md)

Для интеграции сгенерированных опций с Cache Components, гидратацией и Partial Prefetching
используйте [руководство по кешированию](../architecture/cache-and-streaming.md).
Пример формы с публичным SDK находится в [руководстве форм](../ui/forms.md).
