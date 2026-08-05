# Кеширование и streaming

> Тип: руководство · Статус: актуально · Источники истины:
> [`next.config.ts`](../next.config.ts),
> [`src/cache/valkey/handler.ts`](../src/cache/valkey/handler.ts) и
> [`@repo/api/cache-tags`](../packages/api/cache-tags.ts)

Эта страница помогает выбрать способ загрузки данных, настроить streaming и правильно обновлять
кеш после мутаций.

В проекте включён `cacheComponents: true`. В Next.js 16 этот флаг объединяет Cache Components,
Partial Prerendering и dynamic I/O. Данные без явного кеширования загружаются во время запроса, а
`'use cache'` позволяет кешировать выбранные функции и компоненты.

В runtime обычный `'use cache'` подключён через `cacheHandlers.default` к Valkey, поэтому
реплики с одинаковыми `VALKEY_URL` и `VALKEY_CACHE_NAMESPACE` видят общие записи и маркеры
тегов. Во время production build handler не читает и не записывает Valkey.

TanStack Query тоже остаётся частью проекта. Серверный кеш и клиентский кеш решают разные задачи и
могут использоваться вместе.

## Что выбрать

| Задача                                     | С чего начать                                     |
| ------------------------------------------ | ------------------------------------------------- |
| Данные нужны только для серверного HTML    | Async Server Component                            |
| Результат можно безопасно переиспользовать | `'use cache'` + `cacheLife` + `cacheTag`          |
| Данные зависят от запроса                  | Dynamic Server Component внутри `<Suspense>`      |
| Нужны polling, realtime или частый refetch | TanStack Query factory из `@repo/api/query`       |
| Нужен сложный optimistic workflow          | React Query mutation или подходящая Server Action |
| Форма меняет данные с проверкой прав       | Server Action с повторной auth и validation       |

Не переносите загрузку данных в браузер только потому, что в проекте есть React Query. И наоборот:
не удаляйте клиентский кеш из интерактивного сценария только из-за включённых Cache Components.

## Как работает streaming

Async Server Components можно разделять независимыми `Suspense`-границами:

- `loading.tsx` показывает fallback для всего route segment;
- локальный `<Suspense>` позволяет отправлять отдельный блок сразу после его готовности.

```tsx
import { Suspense } from 'react'

export default function PetPage() {
    return (
        <Suspense fallback={<PetSkeleton />}>
            <PetDetails />
        </Suspense>
    )
}
```

Независимые запросы запускайте до первого `await` или разносите по соседним async-компонентам.
Так страница не превращается в последовательный waterfall. Размер fallback должен быть близок к
размеру готового блока, чтобы уменьшить layout shift.

Ошибки рендеринга обрабатывает ближайший `error.tsx`; `global-error.tsx` остаётся последней
границей. Клиентский Sentry `ErrorBoundary` полезен для отдельного subtree, но не заменяет
segment-level error handling и не перехватывает произвольные ошибки event handlers.

## Как добавить `'use cache'`

Директиву можно поставить в async-функции, компоненте или в начале файла. Аргументы и захваченные
serializable-значения входят в cache key.

```tsx
import { getPetById } from '@repo/api'
import { pets } from '@repo/api/cache-tags'
import { cacheLife, cacheTag } from 'next/cache'

export async function loadPet(petId: string) {
    'use cache'
    cacheLife('minutes')
    cacheTag(pets.petsTag, pets.petTag({ petId }))

    const { data } = await getPetById({ path: { petId }, throwOnError: true })
    return data
}
```

Перед добавлением кеша проверьте:

1. Как долго результат может оставаться устаревшим? Укажите подходящий `cacheLife`.
2. Сколько разных наборов аргументов возможно? Каждый набор создаёт отдельный ключ.
3. Нет ли в ключе secret, session token или другого чувствительного значения?
4. Не станет ли персональный результат общим для разных пользователей?
5. Как изменятся hit rate и расход памяти, особенно при self-hosting?

`cacheLife` работает только внутри cache scope. Встроенные профили и их значения могут меняться
между версиями Next.js, поэтому сверяйтесь с
[актуальным справочником](https://nextjs.org/docs/app/api-reference/functions/cacheLife).

## Данные текущего запроса и `'use cache: private'`

Обычный `'use cache'` не может напрямую читать `cookies()`, `headers()` или `searchParams`.
Предпочтительный вариант — прочитать их снаружи и передать в кешируемую функцию только минимальное
безопасное значение. Если это не подходит, оставьте компонент dynamic.

`'use cache: private'` — экспериментальная возможность, не рекомендуемая для production:

- разрешает `cookies()`, `headers()` и `searchParams` внутри cache scope;
- выполняет функцию при каждом server render;
- не сохраняет результат в server cache;
- хранит результат только в памяти браузера и теряет его после reload;
- недоступна в Route Handlers;
- не использует настраиваемые cache handlers.

Это не персональный server cache на пользователя. Перед применением проверьте поведение в
[документации вашей версии Next.js](https://nextjs.org/docs/app/api-reference/directives/use-cache-private).

## Какой handler используется

| Scope или конфигурация | Текущий контракт                                                    |
| ---------------------- | ------------------------------------------------------------------- |
| `'use cache'`          | `cacheHandlers.default`: общий Valkey handler                       |
| `'use cache: remote'`  | `cacheHandlers.remote` не задан: остаётся in-memory handler Next.js |
| `'use cache: private'` | Не использует custom handlers и не хранит server entry              |
| `'use cache: <name>'`  | Именованные handlers не настроены                                   |
| `cacheHandler`         | Singular-контракт для ISR и Route Handler responses; не задан       |

Наличие Valkey для `default` не делает `'use cache: remote'`, named scopes или общий
server cache автоматически распределёнными.

## Теги кеша

Post-generator создаёт cache tags из OpenAPI tags:

```ts
import { pets } from '@repo/api/cache-tags'

pets.petsTag // 'pets'
pets.petTag({ petId: 'pet_123' }) // 'pets:petId:pet_123'
```

Используйте generated helpers и при чтении, и при записи. Не дублируйте tags строками: после
изменения параметров контракта такие строки легко расходятся.

### Как обновить кеш

| API                              | Где использовать                  | Что происходит                                          |
| -------------------------------- | --------------------------------- | ------------------------------------------------------- |
| `updateTag(tag)`                 | Только Server Action              | Кеш истекает сразу; следующий запрос ждёт свежие данные |
| `revalidateTag(tag, 'max')`      | Server Function или Route Handler | Следующий визит получает stale-while-revalidate         |
| `revalidateTag(tag)` без profile | Не использовать                   | Устаревшее blocking-поведение                           |

Generated functions `pets.revalidatePet()` и `pets.revalidatePets()` вызывают `updateTag`.
Несмотря на имя, они работают только внутри Server Action.

```ts
'use server'

import { updatePet } from '@repo/api'
import { pets } from '@repo/api/cache-tags'

export async function markPetSold(petId: string) {
    // Повторно проверьте authentication, authorization и входные данные.
    await updatePet({
        body: { status: 'sold' },
        path: { petId },
        throwOnError: true,
    })
    await pets.revalidatePet({ petId })
    await pets.revalidatePets()
}
```

В webhook или Route Handler вызывайте `revalidateTag(pets.petsTag, 'max')` напрямую. Generated
wrapper на `updateTag` в этом контексте завершится runtime-ошибкой.

Server Actions доступны по сетевому запросу. Проверяйте auth, permissions и входные данные внутри
каждой action, даже если кнопка скрыта в интерфейсе.

## Когда оставить React Query

Root layout подключает `QueryProvider` и `ReactQueryStreamedHydration`. Hey API генерирует Query
factories, которые подходят для client-only данных, polling и optimistic workflows.

```tsx
'use client'

import { getPetByIdOptions } from '@repo/api/query'
import { useQuery } from '@tanstack/react-query'

export function PetStatus({ petId }: { petId: string }) {
    const query = useQuery(getPetByIdOptions({ path: { petId } }))
    return <span>{query.data?.status}</span>
}
```

Если Server Component уже полностью отрисовал данные и браузеру не нужен refetch, не создавайте
для них второй источник истины в Query cache.

## Ограничения shared cache

- Весь binary envelope записи — body и metadata — ограничен
  `VALKEY_CACHE_MAX_ENTRY_BYTES` (default 1 MiB). Большая запись не кешируется.
- Физический TTL entry key ограничен `VALKEY_CACHE_MAX_TTL_SECONDS` (default 24 часа).
  Metadata `expire` не меняется, поэтому меньший cap может дать ранний miss, но не
  продлевает логический lifetime.
- Записи и tag markers хранятся отдельными hashed keys. При invalidation handler атомарно
  обновляет markers, а на чтении проверяет явные и soft tags. Он не перебирает и не
  удаляет сами entries.
- Ошибка чтения даёт cache miss, а ошибка записи оставляет результат незакешированным.
  Ошибка tag invalidation пробрасывается вызывающему коду.
- Ожидание pending `set` для того же ключа работает только внутри одного процесса. В
  handler нет distributed lock, поэтому одновременные misses на разных репликах могут вызвать
  повторное вычисление.

Compose запускает Valkey без RDB, AOF и persistent volume: рестарт даёт полностью
холодный кеш, а eviction удаляет отдельные entries или markers. Операционные детали и границы
проверки описаны в
[документе о self-hosting](self-hosting.md).

## Чеклист перед merge

1. Выбран правильный слой: Server Component, Cache Component или React Query.
2. Для dynamic-блока есть понятный `Suspense`-fallback.
3. Для `'use cache'` заданы lifetime и безопасный cache key.
4. Для чтения и invalidation используются generated tags.
5. `updateTag` вызывается только из Server Action.
6. В каждой Server Action повторно проверяются auth, permissions и входные данные.
7. Поведение проверено на production build: в development кеш и streaming могут отличаться.
8. Выбранный scope действительно подключён к нужному shared или per-process handler.

## Официальные источники

- [Cache Components](https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents)
- [`use cache`](https://nextjs.org/docs/app/api-reference/directives/use-cache)
- [`use cache: private`](https://nextjs.org/docs/app/api-reference/directives/use-cache-private)
- [`use cache: remote`](https://nextjs.org/docs/app/api-reference/directives/use-cache-remote)
- [`cacheLife`](https://nextjs.org/docs/app/api-reference/functions/cacheLife)
- [`cacheHandler`](https://nextjs.org/docs/app/api-reference/config/next-config-js/incrementalCacheHandlerPath)
- [`cacheHandlers`](https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheHandlers)
- [`updateTag`](https://nextjs.org/docs/app/api-reference/functions/updateTag)
- [`revalidateTag`](https://nextjs.org/docs/app/api-reference/functions/revalidateTag)
- [Мутации и Server Actions](https://nextjs.org/docs/app/getting-started/mutating-data)
