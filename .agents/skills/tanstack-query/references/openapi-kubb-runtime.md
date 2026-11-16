# OpenAPI, Kubb, CSR и SSR

## Содержание

- Область
- Актуальные пакеты и совместимость
- Обязательный Kubb contract
- Числовые типы и query keys
- Классификация изменения
- Runtime-матрица
- CSR composition
- SSR composition
- Интегрированный generated-options flow
- Проверочный список
- Официальные источники

## Область

Этот contract применяется только к HTTP API, описанному OpenAPI. GraphQL,
RPC/tRPC, SDK-owned clients и non-HTTP sources находятся вне scope
`tanstack-query`; не оборачивай и не мигрируй их в Kubb.

Распределение ownership:

- `openapi` — source OpenAPI contract;
- Kubb — generated TypeScript types, Zod schemas, native Fetch client и React
  Query artifacts;
- `modular-react` — module boundaries, runtime composition и применение
  project-native generation/drift checks;
- `tanstack-query` — query keys, freshness, mutations и render semantics.

## Актуальные пакеты и совместимость

Проверь последний стабильный релиз каждого пакета отдельно: `kubb`,
`@kubb/adapter-oas`, `@kubb/plugin-ts`, `@kubb/plugin-zod`, `@kubb/plugin-fetch`,
`@kubb/plugin-react-query`, `@tanstack/react-query` и `zod`. Используй registry
metadata, например `npm view kubb@latest version engines peerDependencies --json`,
и повтори запрос для остальных пакетов. Сопоставь с manifest и lockfile проекта.

Плагины Kubb выпускаются независимо: одинаковый номер engine/plugins не является
условием совместимости. Проверь `engines`, `peerDependencies`, release notes и
требования generated runtime к React, TanStack Query и Zod. Если все `latest`
несовместимы, явно зафиксируй конфликт; не скрывай downgrade и не подменяй
стабильный релиз prerelease. После разрешённой установки сохрани resolved
versions в lockfile и проверь generation/typecheck. Эта сверка не требует
обновлять существующий проект при обычной cache policy задаче.

## Обязательный Kubb contract

Пример использует актуальные API. Здесь source contract гарантирует, что
числовые значения помещаются в безопасный диапазон JavaScript `number`:

```ts
import { defineConfig } from "kubb/config"
import { adapterOas } from "@kubb/adapter-oas"
import { pluginFetch } from "@kubb/plugin-fetch"
import { pluginReactQuery } from "@kubb/plugin-react-query"
import { pluginTs } from "@kubb/plugin-ts"
import { pluginZod } from "@kubb/plugin-zod"

export default defineConfig({
  input: "./openapi.yaml",
  output: { path: "./src/generated" },
  adapter: adapterOas({ integerType: "number" }),
  plugins: [
    pluginTs(),
    pluginZod(),
    pluginFetch({ validator: "zod" }),
    pluginReactQuery({ client: "fetch", hooks: true }),
  ],
})
```

Фактические input/output paths и дополнительные options бери из проекта. Не
копируй пример вслепую: проверь диапазон чисел и актуальные types установленных
пакетов. Axios и handwritten transport/types/schemas/hooks не заменяют выбранный
Fetch contract.

`@kubb/plugin-fetch` использует native `globalThis.fetch`. Generated files
read-only: cache policy, DTO-to-domain mapping и UI composition размещай в
handwritten feature wrappers. Оставляй option `sdk` выключенным: React Query
artifacts должны вызывать generated per-operation Fetch functions.

Generated Fetch operation принимает один объект с группами `path`, `query`,
`headers`, `body` и request config. При default `returnType: "full"` она
предоставляет полный result и `.unwrap()` для success data. Generated Query
factory сама вызывает `.unwrap()` с `throwOnError: true`; при
`returnType: "data"` generator использует прямой data-returning вызов.
Не добавляй ручное извлечение `data` или второй fetch: проверь фактический output.

Default `hooks: false` генерирует обычные query/mutation factories;
`hooks: true` добавляет hook wrappers. Infinite/Suspense factories тоже требуют
`hooks: true`. Если in-scope operation является infinite query, настрой
`pluginReactQuery.infinite` по
фактическому OpenAPI contract:

- `queryParam` — точное имя cursor/page query parameter;
- `initialPageParam` — реальное начальное значение этого parameter;
- `nextParam`/`previousParam` — фактические paths cursor fields в response.

Не придумывай cursor fields и не включай infinite generation глобально, если
только часть operations поддерживает pagination; используй project-native
`override`/scope. Для Suspense включи `suspense: {}` только для нужных operations
и проверь generated artifacts. `include`/`override` string patterns трактуются
как RegExp: для одной operation используй привязки `^...$`.

## Числовые типы и query keys

Default `adapterOas.integerType` — `"bigint"`; числовые `int64` могут стать
`bigint` в generated types. Default TanStack Query hash использует
`JSON.stringify`: сырой `bigint` в key вызывает ошибку до HTTP request.

- Выбирай `integerType: "number"` только при доказанном безопасном диапазоне.
- Для больших ID сохраняй точность: строка, если это wire type, либо `bigint`
  с явной runtime сериализацией. Не меняй правильную OpenAPI schema ради клиента.
- Настрой generated key так, чтобы он нормализовал такие inputs в однозначную
  JSON-совместимую форму, например decimal string; проверь отсутствие collisions
  между типами.
  Сериализация response для hydration сама по себе не исправляет key hashing.

Default generated key включает path/query/body, но не transport config и headers.
Если данные зависят от tenant, locale или user scope, докажи их присутствие в
identity; секреты и токены в key не помещай.

Для inputs, доступных генератору, меняй `pluginReactQuery.queryKey`/`mutationKey`
и regenerate. Callback строит исходный код key: literal строки передавай через
`JSON.stringify`, выражения — только с bindings из generated signature.
Сохраняй все inputs: ключ только из `operationId` объединит разные запросы.

Если scope существует только в runtime и недоступен generated key helper,
разрешена одна handwritten key/options composition поверх generated key и
`queryFn`. Все consumers, prefetch, hydration и cache/mutation callbacks должны
использовать её; не переопределяй key отдельно в каждом component. Это исключение
для identity, а не разрешение дублировать generated operation или transport.

Проверь хеширование и разделение keys для разных ID/filters/scopes, а также
совпадение server/browser keys для одного запроса.

## Классификация изменения

| Scope | Действие |
|---|---|
| Freshness, `select`, invalidation или UI state с прежней generated identity | Использовать существующие artifacts; OpenAPI и generated output не менять |
| Generated key или options требуют изменения | Исправить Kubb config, regenerate, typecheck и проверить повторную generation; корректный OpenAPI не менять |
| Runtime scope недоступен generated key helper | Использовать единую key/options composition из раздела выше; source и generated files не менять |
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

Query-options factory принимает grouped operation inputs и request config с
generated client. Если operation не имеет inputs, factory принимает только
config: не добавляй пустой первый аргумент. Фактические имена и сигнатуру всегда
бери из generated types:

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
сохраняет generated fetch/error path; изменение identity подчиняется разделу
«Числовые типы и query keys». У generated hook request config находится в
`options.client`, а TanStack `QueryClient` — в `options.query.client`
(для mutation — `options.mutation.client`); это разные clients.

Для SSR используй тот же factory и server client:

```tsx
const queryClient = new QueryClient()
const apiClient = createServerApiClient()

await queryClient.query(
  getPetByIdQueryOptions({ path: { petId } }, { client: apiClient }),
)
```

Hydrated browser consumer вызывает тот же generated factory с browser client.
Так query identity остаётся общей, а transport configuration — runtime-specific.
Для сохранения freshness передавай общие handwritten options обоим consumers,
как в [SSR reference](ssr-hydration-and-streaming.md#hydration-pipeline).
`query()` бросает error; подавлять его разрешено только для необязательного
prefetch с явной стратегией client retry.

## Проверочный список

- Source OpenAPI contract является единственным input generation.
- Последние стабильные engine/plugins/runtime проверены отдельно и совместимы.
- Fetch validation использует совместимые generated Zod schemas.
- Числовое представление сохраняет точность; generated keys JSON-сериализуемы.
- Fetch plugin не генерирует class-based SDK.
- Cache/UI-only change с прежней generated identity не меняет source/generated files.
- Изменение generated keys/options проходит config → generation → typecheck →
  повторную generation без diff; wire contract сохраняется, если он корректен.
- Infinite/Suspense artifacts включены только для поддерживающих их operations.
- CSR создаёт только stable browser client.
- SSR создаёт server client и `QueryClient` на request.
- Server-only env/module недостижим из client graph.
- Hydrated server/browser flows используют одну итоговую query-key identity.
- Generated files не изменены вручную и не продублированы handwritten code.

## Официальные источники

- [Актуальная документация Kubb](https://kubb.dev/)
- [OpenAPI adapter options](https://kubb.dev/adapters/adapter-oas/reference/options)
- [`@kubb/plugin-fetch`](https://kubb.dev/plugins/plugin-fetch)
- [Fetch base URL](https://kubb.dev/plugins/plugin-fetch/guide/base-url)
- [`@kubb/plugin-react-query`](https://kubb.dev/plugins/plugin-react-query)
- [React Query plugin options](https://kubb.dev/plugins/plugin-react-query/reference/options)
- [React Query calls](https://kubb.dev/plugins/plugin-react-query/guide/calling-operations)
- [Custom query keys](https://kubb.dev/plugins/plugin-react-query/recipes/custom-query-keys)
- [`@kubb/plugin-zod`](https://kubb.dev/plugins/plugin-zod)
