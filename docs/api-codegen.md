# API codegen: OpenAPI, Redocly и Kubb

> Тип: how-to + справочник · Статус: актуально · Источник истины:
> `packages/api/openapi/`, `redocly.yaml` и `kubb.config.ts`

Пакет `@repo/api` содержит примерный Petstore-контракт и воспроизводимый pipeline генерации. Это
контракт-заглушка для проверки tooling, а не реализация backend: маршруты `/pets` не обслуживаются
Next.js приложением сами по себе.

## Контракт

Каноническая точка входа — `packages/api/openapi/openapi.yaml` с `openapi: 3.2.0`. Остальные части
подключаются относительными `$ref`:

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

Пример описывает пять операций:

| Метод    | Путь            | `operationId`      | Успешный ответ |
| -------- | --------------- | ------------------ | -------------- |
| `GET`    | `/pets`         | `findPetsByStatus` | `200 PetPage`  |
| `POST`   | `/pets`         | `createPet`        | `201 Pet`      |
| `GET`    | `/pets/{petId}` | `getPetById`       | `200 Pet`      |
| `PATCH`  | `/pets/{petId}` | `updatePet`        | `200 Pet`      |
| `DELETE` | `/pets/{petId}` | `deletePet`        | `204`          |

`findPetsByStatus` использует массив `status` и offset-пагинацию через `offset`/`limit`. Именно
`offset` настроен в Kubb как page parameter для generated Infinite Query hooks.

## Pipeline и команды

```text
openapi/openapi.yaml + $ref-файлы
    → Redocly lint
    → Redocly bundle
    → bundled.yaml
    → Kubb
    → codegen/
```

Команды запускаются из корня репозитория:

```bash
npm --workspace @repo/api run lint:openapi
npm --workspace @repo/api run bundle
npm --workspace @repo/api run gen
npm --workspace @repo/api run test
```

`gen` сам выполняет bundle, очищает `codegen/`, генерирует файлы и форматирует их Oxfmt. Отдельный
post-generation hook делает второй проход Oxfmt для текущего edge case generated Zod-схемы с
`uniqueItems`.

## Политика артефактов

| Путь              | Коммитится | Редактируется вручную | Назначение                   |
| ----------------- | ---------- | --------------------- | ---------------------------- |
| `openapi/`        | Да         | Да                    | Единственный источник истины |
| `bundled.yaml`    | Нет        | Нет                   | Промежуточный Redocly bundle |
| `codegen/`        | Да         | Нет                   | Публичный generated API      |
| `fetch.client.ts` | Да         | Да                    | Общий transport adapter      |
| `kubb-plugin-*`   | Да         | Да                    | Локальные Kubb plugins       |

`packages/api/.gitignore` намеренно игнорирует `bundled.yaml`. Kubb использует `output.clean:
true`, поэтому любой ручной файл внутри `codegen/` будет удалён следующей генерацией.

## Что генерирует Kubb

| Выход                           | Содержание                                             |
| ------------------------------- | ------------------------------------------------------ |
| `codegen/models/`               | TypeScript types и `as const` enum-like объекты        |
| `codegen/clients/`              | Fetch-функции, сгруппированные по OpenAPI tag          |
| `codegen/hooks/`                | React Query query, suspense, infinite и mutation hooks |
| `codegen/zod/`                  | Zod Mini schemas для моделей и операций                |
| `codegen/mocks/`                | Детерминированные Faker factories                      |
| `codegen/mock-client-routes.ts` | Таблица method/path → generated response factory       |
| `codegen/tags/`                 | Cache tag helpers локального `pluginCacheTags`         |
| `codegen/swagger/`              | Нормализованные JSON schema fragments                  |

Фактическое имя group-директории задаёт Kubb. Для текущего tag `pets` клиенты и hooks находятся в
`petsController/`, Faker operations — в `petsService/`, а cache tags — в `tags/pets.ts`. Не
угадывайте import path по старым примерам: проверьте generated barrel или дерево после `gen`.

## Transport и generated client — разные уровни

`packages/api/fetch.client.ts` реализует низкоуровневый `Client` и возвращает:

```ts
interface ResponseConfig<TData> {
    data: TData
    status: number
    statusText: string
    headers: Headers
}
```

Kubb настроен с `dataReturnType: 'data'`. Поэтому generated-функция получает
`ResponseConfig<TData>`, валидирует `res.data` generated Zod-схемой и наружу возвращает уже
`TData`. React Query hooks опираются именно на этот второй контракт. Менять один уровень без
синхронного изменения Kubb config и тестов нельзя.

Примеры актуальных imports:

```ts
import type { Pet } from '@repo/api/codegen/models/Pet'

import { getPetById } from '@repo/api/codegen/clients/petsController/getPetById'
import { useGetPetById } from '@repo/api/codegen/hooks/petsController/useGetPetById'
import { createPet } from '@repo/api/codegen/mocks/createPet'
import { pets } from '@repo/api/codegen/tags'
import { petSchema } from '@repo/api/codegen/zod/petSchema'
```

React Query hooks являются Client Component API. Models, clients и Zod schemas остаются
universal, пока вызывающая сторона не добавляет server-only context.

## OpenAPI 3.2: граница поддержки

[OpenAPI 3.2.0](https://spec.openapis.org/oas/v3.2.0.html) — каноническая версия контракта.
[Redocly заявляет поддержку 3.2](https://redocly.com/blog/openapi-3-2), и текущий lint/bundle
проходит. Kubb 4.39.2 при генерации пишет `OpenAPI 3.2 is currently unsupported`, хотя создаёт
корректный для этого контракта output.

Поэтому действует политика совместимого эксперимента:

- использовать в контракте подмножество Schema Object, совместимое с 3.1;
- не переписывать версию и не создавать скрытую 3.1-копию;
- после каждого изменения обязательно запускать `lint:openapi`, `gen`, API tests и `tsc`;
- считать новые 3.2-only возможности неподдержанными Kubb, пока отдельный probe не докажет
  обратное;
- при падении Kubb остановиться и согласовать решение, а не понижать версию автоматически.

## Добавление операции

1. Добавьте или переиспользуйте schemas, parameters и responses в `openapi/components/`.
2. Опишите path item в `openapi/paths/` и зарегистрируйте его в `openapi/openapi.yaml`.
3. Задайте уникальный `operationId`, обязательный `summary`, содержательный `description` и tag.
4. Опишите успешные и ожидаемые ошибочные ответы, request body и примеры.
5. Запустите lint и полную генерацию.
6. Проверьте generated diff: имена, optionality, status codes, query serialization, mocks и cache
   tags.
7. Запустите `npm --workspace @repo/api run test` и `npm run tsc`.

Не копируйте generated Zod schemas в `src/schemas` и не создавайте параллельные ручные fixtures,
если generated Faker factory уже покрывает сценарий.

## Связанные документы

- [BFF proxy и выбор base URL](bff-proxy.md)
- [Runtime mock mode](mock-mode.md)
- [Cache Components и generated tags](cache-and-streaming.md)
- [Testing guidelines](testing-guidelines.md)
