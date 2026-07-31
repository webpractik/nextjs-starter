# Cache Components и streaming

> Тип: объяснение + правила · Статус: включено · Источник истины: `next.config.ts`, generated cache
> tags и официальная документация Next.js

`next.config.ts` содержит `cacheComponents: true`. Это opt-in режим Next.js 16, который объединяет
Cache Components, Partial Prerendering и dynamic I/O behavior. Проект при этом сохраняет TanStack
Query provider: server caching и client server-state являются двумя доступными инструментами, а не
взаимоисключающими архитектурами.

## Выбор data layer

| Сценарий                                   | Предпочтительный старт                          |
| ------------------------------------------ | ----------------------------------------------- |
| Данные нужны только для server-rendered UI | Async Server Component                          |
| Общие данные выгодно переиспользовать      | `'use cache'` + `cacheLife`/`cacheTag`          |
| Request-specific данные                    | Dynamic Server Component внутри `<Suspense>`    |
| Client polling/realtime/частые refetch     | Generated TanStack Query hook                   |
| Сложный optimistic client workflow         | React Query mutation или Server Action по месту |
| Мутация формы с server authorization       | Server Action с повторной auth/validation       |

Не переносите data fetching на client только из-за наличия React Query. Но и не удаляйте client
cache из интерактивного workflow только потому, что Cache Components включены.

## Streaming

Async Server Components можно разделять независимыми Suspense boundaries. Route-level
`loading.tsx` даёт fallback для segment; локальный `<Suspense>` позволяет стримить блоки независимо.

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

Не делайте последовательный waterfall без причины. Независимые Promises стартуйте до первого
`await` либо разносите по соседним async components. Fallback должен сохранять приблизительный
размер итогового блока, чтобы уменьшать layout shift.

Для ошибок route rendering используйте ближайший `error.tsx`; `global-error.tsx` — последняя
граница. Компонентная Sentry `ErrorBoundary` полезна для client subtree, но не заменяет segment
error handling и не ловит произвольные ошибки event handlers.

## `'use cache'`

Директива может применяться к async function, component или всему файлу. Serializable arguments и
captured values становятся частью cache key.

```tsx
import { getPetById } from '@repo/api/codegen/clients/petsController/getPetById'
import { pets } from '@repo/api/codegen/tags'
import { cacheLife, cacheTag } from 'next/cache'

export async function loadPet(petId: string) {
    'use cache'
    cacheLife('minutes')
    cacheTag(pets.petsTag, pets.petTag({ petId }))

    return getPetById({ petId })
}
```

Правила:

- явно выбирайте cache lifetime, соответствующий допустимой stale-границе;
- оценивайте cardinality arguments: каждый набор значений создаёт отдельный ключ;
- не передавайте secrets и session tokens как ключ shared cache;
- не кешируйте personalized result в общей области только ради производительности;
- измеряйте hit rate и память, особенно при self-hosting и нескольких replicas.

`cacheLife` применяется только внутри cache scope. Точные built-in profiles и значения могут
меняться между версиями Next.js; не копируйте числовые предположения из старых гайдов — сверяйте
[актуальную API reference](https://nextjs.org/docs/app/api-reference/functions/cacheLife).

## Runtime APIs и `'use cache: private'`

Обычный `'use cache'` не может напрямую читать `cookies()`, `headers()` или `searchParams`. Читайте
их снаружи и передавайте только минимальное безопасное значение аргументом либо оставляйте
компонент dynamic.

`'use cache: private'` — экспериментальная возможность. В актуальном Next.js результат не
хранится в server cache: scope выполняется при каждом server render, а результат кешируется только
в памяти browser и не переживает reload. Она разрешает request APIs, но недоступна в Route
Handlers. Это не «приватный server cache на пользователя» и не production default.

Перед применением обязательно сверяйтесь с
[официальным описанием](https://nextjs.org/docs/app/api-reference/directives/use-cache-private) и
проверяйте конкретную версию Next.js.

## Cache tags

Локальный Kubb plugin генерирует namespace по OpenAPI tag. Текущий контракт создаёт:

```ts
import { pets } from '@repo/api/codegen/tags'

pets.petsTag // 'pets'
pets.petTag({ petId: 'pet_123' }) // 'pets:petId:pet_123'
```

Используйте эти helpers и на read-, и на write-стороне. Строковые литералы легко расходятся после
изменения contract parameters.

### `updateTag` и `revalidateTag`

| API                              | Где разрешён                    | Семантика                                  |
| -------------------------------- | ------------------------------- | ------------------------------------------ |
| `updateTag(tag)`                 | Только Server Action            | Немедленное expire для read-your-writes    |
| `revalidateTag(tag, 'max')`      | Server Function и Route Handler | Stale-while-revalidate при следующем visit |
| `revalidateTag(tag)` без profile | Не использовать                 | Deprecated blocking behavior               |

Generated functions `pets.revalidatePet()` и `pets.revalidatePets()` внутри вызывают `updateTag`.
Несмотря на имя `revalidate*`, они допустимы только из Server Action.

```ts
'use server'

import { updatePet } from '@repo/api/codegen/clients/petsController/updatePet'
import { pets } from '@repo/api/codegen/tags'

export async function markPetSold(petId: string) {
    // Повторно проверьте authentication, authorization и входные данные здесь.
    await updatePet({ petId, data: { status: 'sold' } })
    await pets.revalidatePet({ petId })
    await pets.revalidatePets()
}
```

Для webhook/Route Handler используйте `revalidateTag(pets.petsTag, 'max')` напрямую: generated
wrapper на `updateTag` в этом контексте вызовет runtime error.

Server Actions доступны по network request и должны рассматриваться как публичные mutation
endpoints: проверяйте auth и permissions внутри каждой action, даже если UI скрывает кнопку.

## React Query остаётся поддержанным

Root layout подключает `QueryProvider` и `ReactQueryStreamedHydration`. Generated hooks подходят
для client-only данных, polling, realtime-driven refetch и сложных optimistic workflows.

```tsx
'use client'

import { useGetPetById } from '@repo/api/codegen/hooks/petsController/useGetPetById'

export function PetStatus({ petId }: { petId: string }) {
    const query = useGetPetById({ petId })
    return <span>{query.data?.status}</span>
}
```

Для данных, уже полностью отрендеренных Server Component и не требующих client refetch, не
создавайте второй источник истины в Query cache без необходимости.

## Self-hosting и несколько replicas

Обычный runtime cache по умолчанию находится в памяти процесса. В standalone/Docker deployment
каждая replica имеет собственный cache; рестарты очищают его. Проект не настраивает общий
`cacheHandlers` backend. Не обещайте cross-replica consistency без отдельного shared cache design.

## Чеклист

1. Определите, нужен ли data результат на client после hydration.
2. Для dynamic блока добавьте осмысленный Suspense/loading fallback.
3. Для `'use cache'` задайте lifetime и проверьте cardinality/чувствительность ключа.
4. Используйте generated tags на обеих сторонах.
5. `updateTag` вызывайте только из Server Action; для Route Handler используйте
   `revalidateTag(tag, 'max')`.
6. Проверяйте auth/authorization/validation внутри каждой Server Action.
7. Тестируйте production build: cache и streaming behavior в dev отличаются.
8. Для нескольких replicas отдельно решите вопрос shared cache и invalidation.

## Официальные источники

- [Cache Components](https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents)
- [`use cache`](https://nextjs.org/docs/app/api-reference/directives/use-cache)
- [`use cache: private`](https://nextjs.org/docs/app/api-reference/directives/use-cache-private)
- [`cacheLife`](https://nextjs.org/docs/app/api-reference/functions/cacheLife)
- [`updateTag`](https://nextjs.org/docs/app/api-reference/functions/updateTag)
- [`revalidateTag`](https://nextjs.org/docs/app/api-reference/functions/revalidateTag)
- [Mutating data and Server Actions](https://nextjs.org/docs/app/getting-started/mutating-data)
