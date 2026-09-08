# SSR, hydration и streaming

Generated Fetch client composition и разделение server/client base URL roles
описаны в [openapi-kubb-runtime.md](openapi-kubb-runtime.md). Этот reference
владеет TanStack Query SSR cache и render semantics.

## Содержание

- `QueryClient` lifecycle
- Hydration pipeline
- Freshness и server errors
- Serialization и memory
- Server Components и ownership
- Streaming
- Проверочный список
- Официальные источники

## `QueryClient` lifecycle

На server создавай новый `QueryClient` для каждого request. Module-scoped server
client разделяет cache между users и создаёт критическую уязвимость с утечкой
data.

В browser переиспользуй стабильный client на lifecycle приложения. Для Next.js
App Router provider использует React context и поэтому находится в Client
Component с `"use client"`.

Если ниже места создания browser client нет Suspense boundary, не полагайся на
`useState(() => new QueryClient())`: React может отбросить client при initial
suspend. Используй factory: новый client на server, singleton в browser.

## Hydration pipeline

Базовый flow:

1. Создать per-request `QueryClient`.
2. Выполнить prefetch server-rendered queries.
3. Запустить независимые prefetches через `Promise.all`.
4. Передать `dehydrate(queryClient)`.
5. Обернуть consumer в `HydrationBoundary`.

```tsx
export default async function PostsPage() {
  const apiClient = createServerApiClient()
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
      },
    },
  })

  await Promise.all([
    queryClient.prefetchQuery(
      getPostsQueryOptions({}, { client: apiClient }),
    ),
    queryClient.prefetchQuery(
      getCommentsQueryOptions({}, { client: apiClient }),
    ),
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Posts />
    </HydrationBoundary>
  )
}
```

Имена factories и grouped inputs бери из generated Kubb types. Hydrated browser
consumer вызывает те же factories с stable browser Fetch client.

`60_000` — пример SSR freshness, не универсальный default. Secondary queries
можно не prefetch-ить: они стартуют на client и не входят в server-rendered
critical content.

Если SSR component использует `useSuspenseQuery`, каждая такая query обязана
быть prefetched. Иначе возможны повторный client fetch и hydration mismatch.
Для prefetched data обычный `useQuery` устойчивее к случайному удалению prefetch:
он догрузит data на client.

## Freshness и server errors

Hydrated staleness считается от server `dataUpdatedAt`; server clock должен быть
корректным. Default `staleTime: 0` запускает background refetch сразу после
hydration. Выбери положительный `staleTime`, если немедленная revalidation не
нужна; при CDN-cached markup меньшая freshness может быть осознанной.

`prefetchQuery` не бросает error, а default dehydration включает successful
queries. Это подходит для graceful client retry. Когда route обязан вернуть
critical 404/500, используй `fetchQuery`, который бросает error. Failed query
передавай в dehydration только с явным `shouldDehydrateQuery`.

## Serialization и memory

Framework serializer может не поддерживать `Error`, `Date`, `Map`, `Set`,
`BigInt`, `Infinity`, `NaN` и другие non-JSON values. Для custom SSR простой
`JSON.stringify` в `<script>` XSS-небезопасен; используй безопасный serializer.

Для non-JSON cache data согласуй:

- `dehydrate.serializeData`;
- `hydrate.deserializeData`.

Server `gcTime` default — `Infinity`, и request memory освобождается после
завершения. Если задаёшь конечный `gcTime`, управляй очисткой. Не ставь
`gcTime: 0`: data может исчезнуть до hydration; короткое значение должно быть
не меньше примерно 2 секунд либо cache очищается после отправки snapshot.

## Server Components и ownership

Считай Server Component framework loader/preload layer:

1. prefetch query;
2. dehydrate рядом с consumer;
3. Client Component читает тот же key и владеет revalidation.

Nested и множественные `HydrationBoundary` допустимы. Default — отдельный
prefetch client на Server Component. Request-scoped client через React `cache()`
может deduplicate non-`fetch` requests, но каждый `dehydrate` сериализует весь
накопленный cache.

Не отображай один query result одновременно как server-owned snapshot и
client-revalidating data. После client refetch две части UI разойдутся. Выбери
одного owner; Server Component обычно только prefetch-ит.

Не используй Next.js Server Action как `queryFn`: client reads могут
сериализоваться и конфликтовать с parallel fetch/refetch. Для reads используй
generated OpenAPI HTTP operation; Server Actions допустимы для mutations.

## Streaming

Next.js App Router stream-ит по Suspense boundaries; `loading.tsx` создаёт
boundary автоматически. Awaited prefetch suspend-ит server boundary, после чего
готовая часть stream-ится.

Начиная с v5.40.0 pending query можно включить в dehydrated state без `await`:

```tsx
shouldDehydrateQuery: (query) =>
  defaultShouldDehydrateQuery(query) || query.state.status === "pending"
```

Client `useSuspenseQuery` получает streamed Promise. Для Next.js
`shouldRedactErrors: () => false` является framework-specific настройкой,
позволяющей framework распознавать server errors; не переноси её в другие SSR
environments как default.

При persistence сохраняй только successful queries, иначе storage получит
Promise. `@tanstack/react-query-next-experimental` и
`ReactQueryStreamedHydration` — experimental path: без Suspense boundary он
ухудшает TTFB, а prefetch-less navigation может вернуть глубокие waterfalls.

## Проверочный список

- Server client создаётся per request; browser client стабилен.
- Независимые prefetches параллельны.
- `HydrationBoundary` получает snapshot тех keys, которые читает consumer.
- `staleTime` согласован с server fetch time и CDN/page cache.
- Critical server errors используют throwing path.
- Payload безопасно и симметрично сериализуется.
- RSC не дублирует client-owned revalidating output.
- Server Action не используется для client query reads.
- Pending dehydration и experimental hydration явно обоснованы.

## Официальные источники

- [Server Rendering & Hydration](https://tanstack.com/query/v5/docs/framework/react/guides/ssr)
- [Advanced Server Rendering](https://tanstack.com/query/v5/docs/framework/react/guides/advanced-ssr)
- [Suspense](https://tanstack.com/query/v5/docs/framework/react/guides/suspense)
- [Performance & Request Waterfalls](https://tanstack.com/query/v5/docs/framework/react/guides/request-waterfalls)
