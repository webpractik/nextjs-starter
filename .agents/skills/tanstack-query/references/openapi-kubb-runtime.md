# OpenAPI, Kubb, CSR и SSR

## Область

Этот contract применяется только к HTTP API, описанному OpenAPI. GraphQL,
RPC/tRPC, SDK-owned clients и non-HTTP sources находятся вне scope
`tanstack-query`; не оборачивай и не мигрируй их в Kubb.

Распределение ownership:

- `openapi` — source OpenAPI contract;
- Kubb — generated TypeScript types, Zod schemas, native Fetch client и React
  Query artifacts;
- `modular-react` — module boundaries и runtime composition;
- `tanstack-query` — query keys, freshness, mutations и render semantics;
- `review-project-quality` — generation reproducibility и drift gates.

## Обязательный Kubb v5 contract

В `kubb.config.ts` одновременно используй совместимую Kubb 5 version set:

```ts
import { defineConfig } from "kubb/config"
import { pluginFetch } from "@kubb/plugin-fetch"
import { pluginReactQuery } from "@kubb/plugin-react-query"
import { pluginTs } from "@kubb/plugin-ts"
import { pluginZod } from "@kubb/plugin-zod"

export default defineConfig({
  input: "./openapi.yaml",
  output: { path: "./src/generated" },
  plugins: [
    pluginTs(),
    pluginZod(),
    pluginFetch({ validator: "zod" }),
    pluginReactQuery({ client: "fetch", hooks: true }),
  ],
})
```

Фактические input/output paths и дополнительные options бери из проекта. Не
копируй пример вслепую. Generated runtime использует `zod@4` и
`@tanstack/react-query@5`. Kubb 4 `plugin-client`, Axios и handwritten
transport/types/schemas/hooks не заменяют этот contract.

`@kubb/plugin-fetch` использует native `globalThis.fetch`. Generated files
read-only: cache policy, DTO-to-domain mapping и UI composition размещай в
handwritten feature wrappers. Оставляй option `sdk` выключенным: React Query
artifacts должны вызывать generated per-operation Fetch functions.

`hooks: true` генерирует hook wrappers поверх options factories. Если in-scope
operation является infinite query, настрой `pluginReactQuery.infinite` по
фактическому OpenAPI contract:

- `queryParam` — точное имя cursor/page query parameter;
- `initialPageParam` — реальное начальное значение этого parameter;
- `nextParam`/`previousParam` — фактические paths cursor fields в response.

Не придумывай cursor fields и не включай infinite generation глобально, если
только часть operations поддерживает pagination; используй project-native
`override`/scope. Для Suspense проверь, что текущая Kubb v5 version действительно
сгенерировала suspense options/hook, и включи соответствующую plugin option,
только если artifact отсутствует.

## Классификация изменения

| Scope | Действие |
|---|---|
| Только query key, freshness, `select`, invalidation или UI state | Использовать существующие generated artifacts; OpenAPI и generated output не менять |
| Новая HTTP operation или wire change | Сначала обновить source OpenAPI contract, затем выполнить Kubb generation |
| Handwritten OpenAPI-backed operation входит в implementation/refactor | Мигрировать только эту operation в Kubb, без unrelated rewrite |
| Generated behavior расходится с source contract | Исправить source/config и regenerate; generated file вручную не редактировать |
| GraphQL, RPC/tRPC, SDK или non-HTTP source | Остановить применение этого skill и передать out-of-scope handoff |

## Runtime-матрица

| Runtime | Generated Fetch client | Base URL roles |
|---|---|---|
| Чистый CSR | Один stable browser client | Только client |
| SSR без hydrated browser consumer | Новый server client на request | Только server |
| SSR + hydration/client revalidation | Новый server client на request и один stable browser client | Раздельные server и client |

Не требуй server variable/module в чистом CSR. Для SSR с browser consumer server
и client compositions используют одну generated operation и одинаковую
query-key identity.

Base URL настраивай через generated `createClient({ baseURL })`, не изменяя
generated code. Сначала найди project-native declarations и framework exposure
rules. Не придумывай имена и не делай fallback между server/client roles. Пустое
runtime value должно fail-fast сообщать только роль `server base URL` либо
`client base URL`, без имени или значения variable.

## CSR composition

Browser composition находится в browser-reachable handwritten module и создаёт
client лениво один раз:

```ts
import { createClient } from "<generated-client-module>"

let browserApiClient: ReturnType<typeof createClient> | undefined

export function getBrowserApiClient() {
  browserApiClient ??= createClient({
    baseURL: readClientBaseURL(),
  })

  return browserApiClient
}
```

`readClientBaseURL` обозначает project-native public client env adapter. Подставь
фактический import, не копируй helper как новую параллельную env abstraction.

Не создавай generated client внутри component render. Не требуй server
composition, если приложение и in-scope flow являются чистым CSR.

## SSR composition

Server-only module создаёт isolated client на request:

```ts
import { createClient } from "<generated-client-module>"

export function createServerApiClient() {
  return createClient({
    baseURL: readServerBaseURL(),
  })
}
```

Не используй module-scoped generated `client.setConfig` на server: concurrent
requests не должны разделять mutable configuration. Server env adapter и
импортирующий его module недостижимы из client graph.

Browser side hydrated flow по-прежнему использует stable client из CSR
composition. Если server и client endpoints нельзя подтвердить как семантически
эквивалентные без чтения runtime values, не выполняй hydration этой query до
явного решения.

## Интегрированный generated-options flow

Kubb v5 query-options factory принимает operation inputs и request config с
generated client. Фактические имена и сигнатуру всегда бери из generated types:

```tsx
const apiClient = getBrowserApiClient()
const generated = getPetByIdQueryOptions(
  { path: { petId } },
  { client: apiClient },
)

const petQuery = useQuery({
  ...generated,
  staleTime: 30_000,
})
```

`30_000` — пример подтверждённой cache policy, не default. Handwritten wrapper
добавляет только cache/UI semantics; generated `queryKey`, `queryFn`, error type
и client path не форкаются.

Для SSR используй тот же factory и server client:

```tsx
const queryClient = new QueryClient()
const apiClient = createServerApiClient()

await queryClient.prefetchQuery(
  getPetByIdQueryOptions({ path: { petId } }, { client: apiClient }),
)
```

Hydrated browser consumer вызывает тот же generated factory с browser client.
Так query identity остаётся общей, а transport configuration — runtime-specific.

## Проверочный список

- Source OpenAPI contract является единственным input generation.
- Kubb engine/plugins принадлежат одной совместимой v5 version set.
- Fetch validation использует generated Zod v4 schemas.
- Fetch plugin не генерирует class-based SDK.
- Cache-only change не меняет source contract или generated files.
- Infinite/Suspense artifacts включены только для поддерживающих их operations.
- CSR создаёт только stable browser client.
- SSR создаёт server client и `QueryClient` на request.
- Server-only env/module недостижим из client graph.
- Hydrated server/browser flows используют один generated query key.
- Generated files не изменены вручную и не продублированы handwritten code.

## Официальные источники

- [Kubb v5 migration](https://kubb.dev/docs/5.x/migration)
- [`@kubb/plugin-fetch`](https://kubb.dev/plugins/plugin-fetch)
- [Fetch base URL](https://kubb.dev/plugins/plugin-fetch/guide/base-url)
- [`@kubb/plugin-react-query`](https://kubb.dev/plugins/plugin-react-query)
- [React Query plugin options](https://kubb.dev/plugins/plugin-react-query/reference/options)
- [`@kubb/plugin-zod`](https://kubb.dev/plugins/plugin-zod)
