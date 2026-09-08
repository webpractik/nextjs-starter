# Pagination и infinite queries

Для OpenAPI-backed HTTP API все query/infinite options и hooks в примерах
означают generated Kubb exports. Не создавай parallel handwritten query layer;
wrapper может добавлять только cache/UI policy поверх generated operation.
Фактические имена и grouped inputs бери из generated types.

## Постраничный query

Для paginated `useQuery` page/cursor входит в `queryKey`, потому что каждая
страница — отдельная cache entry. Чтобы UI не прыгал
`success → pending → success`, удерживай предыдущий результат как placeholder:

```tsx
import { keepPreviousData, useQuery } from "@tanstack/react-query"

const projectsQuery = useQuery({
  ...getProjectsQueryOptions(
    { query: { page } },
    { client: getBrowserApiClient() },
  ),
  placeholderData: keepPreviousData,
})
```

`isPlaceholderData` отличает предыдущую страницу от актуальной. Не разрешай
переход Next, пока новый response не подтвердил `hasMore`:

```tsx
const canGoNext =
  !projectsQuery.isPlaceholderData && Boolean(projectsQuery.data?.hasMore)
```

`placeholderData` не записывается в cache. Для полной известной page до mount
используй `initialData`; для route lifecycle — prefetch.

## Контракт infinite query

`useInfiniteQuery` требует:

- `initialPageParam`;
- `getNextPageParam`;
- `getPreviousPageParam` для backward navigation;
- `queryFn`, использующий `pageParam`.

Эти поля должен вернуть generated `*InfiniteQueryOptions` factory. Kubb
генерирует его только для operation с настроенным
`pluginReactQuery.infinite.queryParam`; `initialPageParam`,
`nextParam` и `previousParam` сопоставь с фактическим OpenAPI request/response
contract до generation.

Все pages одной infinite query разделяют cache entry. В `queryKey` входят
стабильные inputs всего списка — например filters, sort и scope. Переходный
cursor, полученный из `getNextPageParam` или `getPreviousPageParam`, передаётся в
`queryFn` как `pageParam` и не добавляется в key. Если начальная точка сама
определяет identity списка, включи этот стабильный input в key и используй его
как `initialPageParam`.

```tsx
const projectsQuery = useInfiniteQuery({
  ...getProjectsInfiniteQueryOptions(
    { query: { status: filters.status } },
    { client: getBrowserApiClient() },
  ),
  maxPages: 5,
})
```

Generated factory обязан подставлять `pageParam` в настроенный cursor query
parameter, передавать `AbortSignal` generated Fetch operation и возвращать
`getNextPageParam`/`getPreviousPageParam` из Kubb config. Не форкай эту логику в
component.

`data` всегда имеет согласованную форму:

```ts
type InfiniteData<TPage, TPageParam> = {
  pages: TPage[]
  pageParams: TPageParam[]
}
```

Любой `initialData`, `placeholderData`, `select` или manual `setQueryData`
сохраняет обе collections и их одинаковую длину.

## Fetch concurrency

Все pages разделяют одну cache entry. Background refresh и `fetchNextPage`
могут конфликтовать и перезаписать data. Безопасный handler по умолчанию:

```tsx
const loadNext = () => {
  if (projectsQuery.hasNextPage && !projectsQuery.isFetching) {
    projectsQuery.fetchNextPage()
  }
}
```

`fetchNextPage({ cancelRefetch: false })` не включает concurrency: повторный
вызов не запускает новую загрузку, пока текущая не завершилась. При default
`cancelRefetch: true` повторный вызов может запустить новый fetch, а результат
предыдущего вызова будет проигнорирован. Ни один вариант не заменяет guard:
автоматический load more по умолчанию защищай через `hasNextPage && !isFetching`.

Различай:

- `isFetching` — любой fetch, включая background refresh;
- `isFetchingNextPage` — load more;
- `isFetchingPreviousPage` — backward load.

## Refetch и memory

При refetch stale infinite query обновляет pages последовательно с первой,
чтобы не использовать stale cursors и не создать duplicates/skips. Долгая
session увеличивает одновременно memory footprint и число refetch requests.

Используй `maxPages`, когда list потенциально длинный. Для bidirectional list
при `maxPages` определи оба page-param functions.

При удалении item/page или reverse order:

- обновляй `pages` и `pageParams` вместе;
- не меняй исходные arrays in place;
- сохраняй page order, соответствующий cursor semantics.

## Проверочный список

- У paginated `useQuery` page/cursor и filters присутствуют в `queryKey`.
- У `useInfiniteQuery` filters находятся в key, а переходный cursor — в
  `pageParam`.
- Placeholder transition не позволяет перейти по stale `hasMore`.
- Infinite query задаёт initial и next page params.
- Infinite factory и cursor mapping сгенерированы из OpenAPI/Kubb config.
- Automatic load more защищён `!isFetching`.
- Manual cache updates сохраняют `pages`/`pageParams`.
- `maxPages` рассмотрен для длинной session и последовательного refetch.
- Background refresh визуально отличается от load more.

## Официальные источники

- [Paginated / Lagged Queries](https://tanstack.com/query/v5/docs/framework/react/guides/paginated-queries)
- [Infinite Queries](https://tanstack.com/query/v5/docs/framework/react/guides/infinite-queries)
- [`useInfiniteQuery` API](https://tanstack.com/query/v5/docs/framework/react/reference/useInfiniteQuery)
- [Placeholder Query Data](https://tanstack.com/query/v5/docs/framework/react/guides/placeholder-query-data)
