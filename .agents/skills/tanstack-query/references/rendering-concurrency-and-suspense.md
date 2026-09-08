# Rendering, concurrency и Suspense

## Содержание

- Подписки при render
- `select`
- Retries
- Parallel queries
- Suspense и Error Boundaries
- Request waterfalls
- Проверочный список
- Официальные источники

## Подписки при render

TanStack Query сохраняет `data` reference насколько возможно:

- structural sharing удерживает неизменившиеся JSON-compatible subtrees;
- top-level result от `useQuery`, `useInfiniteQuery`, `useMutation` и массив от
  `useQueries` получают новую ссылку на каждом render;
- result properties query hooks (`useQuery`, `useInfiniteQuery`, Suspense
  variants и entries `useQueries`) отслеживаются через `Proxy`, и component
  подписывается на прочитанные поля;
- `useMutation` не использует tracked-properties optimization и уведомляет о
  полном результате `MutationObserver`.

Следствия:

- не используй весь hook result как referentially stable dependency;
- property destructuring query result безопасен;
- object rest destructuring query result читает оставшиеся fields и расширяет
  query subscription, но не меняет subscription semantics `useMutation`;
- `notifyOnChangeProps: "all"` отключает tracked-properties optimization для
  query;
- non-JSON data требует осознанного custom `structuralSharing`, если стабильность
  ссылок важна.

Оптимизируй только наблюдаемую render cost. Не отключай structural sharing и не
задавай ручной `notifyOnChangeProps` профилактически.

## `select`

`select` трансформирует data и сужает subscription. Он выполняется, когда:

- меняется cached data;
- меняется reference selector function.

Module-level selector или `useCallback` полезен, если recomputation заметен.
Inline selector корректен для дешёвой операции.

Не бросай fetch/validation error из `select`: можно получить
`data: undefined` при `isSuccess: true`. Error должен возникать в `queryFn`.

## Retries

| Среда | Default |
|---|---|
| Client | 3 retries |
| Server | 0 retries |

`retry` принимает `false`, число, `true` или
`(failureCount, error) => boolean`; `failureCount` начинается с `0` для первой
retry attempt. Default delay экспоненциально растёт от 1 секунды до 30 секунд.
До последней попытки error доступен как `failureReason`, затем как `error`.

Выбирай custom predicate только при известной классификации ошибок. Не назначай
одно глобальное число для permanent и transient failures без domain contract.

Встроенные retries приостанавливаются в неактивной browser tab даже при
`refetchIntervalInBackground: true`. Для непрерывного background polling
используй осознанную interval strategy с `retry: false`.

## Parallel queries

| Ситуация | Механизм |
|---|---|
| Фиксированное число независимых queries | Несколько `useQuery`/`useInfiniteQuery` рядом |
| Динамический набор | `useQueries({ queries })` |
| Независимые Suspense queries | `useSuspenseQueries` |
| Независимые server prefetches | `Promise.all` |

Несколько `useSuspenseQuery` в одном component не параллельны: первый hook
бросает Promise до вызова следующих. Используй `useSuspenseQueries` или
раздельные child components с собственными boundaries.

Для inline `select` внутри `useQueries` TypeScript может вывести `unknown`.
Аннотируй selector parameter либо используй `queryOptions`.

## Suspense и Error Boundaries

`Suspense` предоставляет отдельные APIs:

- `useSuspenseQuery`;
- `useSuspenseInfiniteQuery`;
- `useSuspenseQueries`.

Они гарантируют defined `data`, но не поддерживают conditional `enabled` и
`placeholderData`. При смене `queryKey` оберни state transition в
`startTransition`, если текущий UI должен остаться до готовности новых data.
Cancellation не работает для `useSuspenseQuery`, `useSuspenseQueries` и
`useSuspenseInfiniteQuery`; не проектируй Suspense UX вокруг manual abort.

Default `throwOnError` бросает query error, только когда cache data отсутствует.
Чтобы stale-data background error попал в Error Boundary, после завершения fetch
брось error вручную при `error && !isFetching`. Mutation отправляет error в
boundary через `throwOnError: true`.

Свяжи React Error Boundary с `QueryErrorResetBoundary` или
`useQueryErrorResetBoundary`; иначе новый render не сбросит query error state.

`useQuery().promise` + `React.use()` с `experimental_prefetchInRender` —
experimental path, не production default.

## Request waterfalls

Waterfall — request, который стартует только после завершения предыдущего.
Каждый уровень добавляет минимум один network roundtrip. Ищи цепочки в Network
timeline, включая `markup → JS → query` и `query → lazy chunk → child query`.

Применяй решения в порядке:

1. Если inputs известны заранее, hoist/parallelize query.
2. Для Suspense объединяй независимые queries через `useSuspenseQueries`.
3. Prefetch на router или user-intent уровне до mount/import consumer.
4. Если зависимость логическая, по возможности объедини API endpoint.
5. Неизбежную последовательность перенеси на server с меньшей latency.

Условный prefetch data рядом с lazy chunk сокращает waterfall, но может перенести
query code в ранний bundle. Зафиксируй этот trade-off.

## Проверочный список

- Component читает только нужные query result fields.
- `select` не является error boundary и не recompute-ится дорого без причины.
- Независимые queries действительно стартуют параллельно.
- Retry policy различает client/server и опирается на известный error contract.
- Suspense query имеет boundary и reset path.
- Suspense flow не обещает cancellation.
- Новый nested query проверен на Network waterfall.
- Experimental API помечен и обоснован.

## Официальные источники

- [Render Optimizations](https://tanstack.com/query/v5/docs/framework/react/guides/render-optimizations)
- [`useMutation` implementation at v5.101.2](https://github.com/TanStack/query/blob/610e8d1684614f63e13f5829ad4bc375782ff06d/packages/react-query/src/useMutation.ts)
- [Query Retries](https://tanstack.com/query/v5/docs/framework/react/guides/query-retries)
- [Parallel Queries](https://tanstack.com/query/v5/docs/framework/react/guides/parallel-queries)
- [Query Cancellation](https://tanstack.com/query/v5/docs/framework/react/guides/query-cancellation)
- [Suspense](https://tanstack.com/query/v5/docs/framework/react/guides/suspense)
- [Performance & Request Waterfalls](https://tanstack.com/query/v5/docs/framework/react/guides/request-waterfalls)
