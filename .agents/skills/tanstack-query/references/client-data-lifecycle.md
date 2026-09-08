# Жизненный цикл client data

## Содержание

- Настройка и `QueryClient`
- Cache identity и reusable options
- Контракт `queryFn` и cancellation
- `initialData` и `placeholderData`
- Mutations, invalidation и optimistic updates
- Composition с generated artifacts
- Проверочный список
- Официальные источники

## Приоритет Kubb для OpenAPI HTTP API

Этот reference описывает только cache/mutation semantics для OpenAPI-backed HTTP
operations. Types, Zod schemas, native Fetch functions, query/mutation options и
`use*` hooks получай из Kubb pipeline. Не создавай локальные DTO types,
`readJson`/`fetchJson`, handwritten `queryFn`/`mutationFn` или hooks,
дублирующие generated operation.

## Настройка и `QueryClient`

Сначала используй существующий `QueryClientProvider`. В implementation/refactor
client-only приложения:

1. если package отсутствует, установи `@tanstack/react-query@5` текущим package
   manager;
2. если provider отсутствует, создай один стабильный `QueryClient` на lifecycle
   приложения;
3. если provider отсутствует, оберни существующий root в `QueryClientProvider`
   без перестройки component tree.

В code review отсутствие package/provider — finding или gap. Не устанавливай
dependency и не меняй root без прямого запроса пользователя.

Module-scoped client допустим для чистого CSR. Как только появляется SSR, выбери
SSR/hydration ветку напрямую из routing table в `SKILL.md`.

Не устанавливай Devtools или ESLint plugin без scope пользователя.

## Cache identity и reusable options

`queryKey`:

- является массивом верхнего уровня;
- JSON-сериализуем;
- уникален для конкретных data;
- содержит каждый внешний стабильный input, от которого зависит cached data;
- сохраняет стабильный порядок array items.

У `useInfiniteQuery` переходный `pageParam` — не внешний input key: библиотека
передаёт его в `queryFn` для pages одной cache entry. Стабильные filters, sort и
scope по-прежнему входят в key; подробности — в pagination reference.

Object property order хэшируется детерминированно, array order — нет.

Используй `queryOptions` для co-location `queryKey` и `queryFn`, когда один query
нужен в нескольких consumers, prefetch, `setQueryData` или invalidation.
Используй `infiniteQueryOptions` для соответствующей infinite query. Не создавай
factory для одноразового локального query без reuse.

## Контракт `queryFn` и cancellation

`queryFn` возвращает Promise, который:

- успешно завершается с data, отличной от `undefined` (`null` допустим как
  «нет данных»);
- либо завершается rejection или бросает error, попадающий в Query state.

Native `fetch` не бросает на non-2xx, поэтому generated Kubb Fetch client обязан
владеть status handling, cancellation и Zod validation. Для HTTP API не
исправляй это handwritten wrapper вокруг generated function. Ошибки
fetch/validation возникают в generated query path, а не в `select`.

Обычная query получает `AbortSignal` из `QueryFunctionContext`. Generated Kubb
query-options path обязан передавать его generated Fetch operation; проверь
фактический generated output и не добавляй второй transport wrapper. Когда
signal consumed, cancellation отменяет request и возвращает query к предыдущему
state.

Для явной отмены используй самый узкий key:

```ts
await queryClient.cancelQueries({
  queryKey: getTodoByIdQueryKey({ path: { id } }),
  exact: true,
})
```

Suspense query variants не поддерживают cancellation. Не обещай abort semantics
для `useSuspenseQuery`, `useSuspenseQueries` или `useSuspenseInfiniteQuery`.

## `initialData` и `placeholderData`

| Свойство | `initialData` | `placeholderData` |
|---|---|---|
| Сохраняется в cache | Да | Нет |
| Data | Полные, настоящие, cache-worthy | Preview, partial/fake или предыдущий результат |
| Начальное состояние | Data без initial pending | Success-like state во время background fetch |
| Freshness | `staleTime` + `initialDataUpdatedAt` | Не задаёт cache freshness |
| Специальный флаг | Нет | `isPlaceholderData` |

Если data взята из другой cache entry, передай её timestamp:

```tsx
const detailSeedOptions = {
  initialData: () => queryClient.getQueryData(todoListKey)?.find(match),
  initialDataUpdatedAt: () =>
    queryClient.getQueryState(todoListKey)?.dataUpdatedAt,
}
```

Верни `undefined`, если seed слишком старый и нужен обычный hard-loading fetch.
Для pre-render lifecycle предпочитай prefetch APIs, а не маскируй их
`initialData`.

## Mutations и invalidation

После успешной mutation синхронизируй только затронутые key families:

- `{ queryKey: ["todos"] }` — prefix match;
- `{ queryKey: ["todos"], exact: true }` — только exact key;
- `predicate(query)` — точный domain filter, когда key prefix недостаточен.

Обычно invalidation переопределяет `staleTime`: matches становятся stale, а
активные queries background-refetch-ятся. Inactive matches не обязаны fetch-иться
немедленно. Исключение — `staleTime: "static"`: manual invalidation не запускает
refetch. Если ручная revalidation нужна, используй другую freshness policy,
например `Infinity`; если mutation вернула canonical data, обнови cache через
`setQueryData`.

`await queryClient.invalidateQueries(...)` нужен, когда mutation `isPending`
должен включать последующий refresh. Независимые invalidations запускай через
`Promise.all`. Не ожидай их автоматически, если product flow считает write
завершённым до refresh.

## Optimistic updates

Выбери минимальную стратегию:

- если optimistic result виден в одном месте, отобрази mutation `variables`
  рядом с query data без cache mutation;
- если результат нужен нескольким consumers, обновляй cache через `onMutate`.

Cache-level optimistic flow обязан:

1. отменить конфликтующий refetch;
2. сохранить snapshot затронутых entries;
3. иммутабельно применить optimistic data;
4. вернуть snapshot из `onMutate`;
5. восстановить snapshot в `onError`;
6. подтвердить server truth узкой invalidation в `onSettled`.

Имена hook/options ниже обозначают generated Kubb exports; фактическую сигнатуру
бери из generated types:

```tsx
const updateTodo = useUpdateTodo({
  mutation: {
    onMutate: async (variables, context) => {
      const key = getTodoByIdQueryKey({
        path: { id: variables.path.id },
      })

      await context.client.cancelQueries({ queryKey: key, exact: true })
      const previous = context.client.getQueryData(key)

      context.client.setQueryData(key, (current) =>
        current ? { ...current, ...variables.body } : current,
      )

      return { key, previous }
    },
    onError: (_error, _variables, result, context) => {
      if (result) context.client.setQueryData(result.key, result.previous)
    },
    onSettled: (_data, _error, _variables, result, context) =>
      result
        ? context.client.invalidateQueries({
            queryKey: result.key,
            exact: true,
          })
        : undefined,
  },
})
```

Для concurrent optimistic mutations используй generated `mutationKey`,
`useMutationState` и `submittedAt`, не один глобальный temporary item.

## Composition с generated artifacts

Для OpenAPI HTTP operation импортируй generated TypeScript types, Zod schemas,
native Fetch functions, query/mutation options и hooks через feature public API
module. Handwritten wrapper может добавлять подтверждённые `staleTime`, `select`,
pending UI, optimistic callbacks и narrow invalidation, но не заменяет
generated `queryFn`, `mutationFn`, `queryKey` или transport. Известный mutation
response обновляй через generated type и самый узкий generated key family.

## Проверочный список

- HTTP transport, types, schemas, options и hooks происходят из одного Kubb run;
  handwritten duplicates отсутствуют.
- Все внешние стабильные inputs, меняющие cached data, присутствуют в key;
  переходный infinite `pageParam` остаётся вне key.
- Reusable key и function не расходятся между consumer/prefetch/invalidation.
- Generated Fetch path превращает non-2xx/invalid Zod data в query error;
  success не возвращает `undefined`.
- Обычная query передаёт `AbortSignal`; Suspense path не обещает cancellation.
- Seed выбран как cache data, placeholder или prefetch осознанно.
- Invalidation достаточно широкая для impact, но не шире.
- Для `staleTime: "static"` выбран явный cache-update path без ожидания refetch.
- Ожидание invalidation соответствует UX semantics `isPending`.
- Optimistic cache update имеет cancel, snapshot и rollback.

## Официальные источники

- [Installation](https://tanstack.com/query/v5/docs/framework/react/installation)
- [Quick Start](https://tanstack.com/query/v5/docs/framework/react/quick-start)
- [Query Keys](https://tanstack.com/query/v5/docs/framework/react/guides/query-keys)
- [Query Options](https://tanstack.com/query/v5/docs/framework/react/guides/query-options)
- [Query Functions](https://tanstack.com/query/v5/docs/framework/react/guides/query-functions)
- [Query Cancellation](https://tanstack.com/query/v5/docs/framework/react/guides/query-cancellation)
- [Initial Query Data](https://tanstack.com/query/v5/docs/framework/react/guides/initial-query-data)
- [Placeholder Query Data](https://tanstack.com/query/v5/docs/framework/react/guides/placeholder-query-data)
- [Invalidations from Mutations](https://tanstack.com/query/v5/docs/framework/react/guides/invalidations-from-mutations)
- [Query Invalidation](https://tanstack.com/query/v5/docs/framework/react/guides/query-invalidation)
- [Optimistic Updates](https://tanstack.com/query/v5/docs/framework/react/guides/optimistic-updates)
- [Important Defaults](https://tanstack.com/query/v5/docs/framework/react/guides/important-defaults)
