---
name: tanstack-query
description: >-
  Использовать при настройке, реализации, рефакторинге, диагностике или code
  review CSR/SSR server-state запросов в существующем React-приложении с
  TanStack Query v5 к HTTP API, описанному OpenAPI и обслуживаемому Kubb v5, —
  включая stale data, duplicate requests, query keys, mutations, optimistic
  updates, cancellation, invalidation, pagination, infinite lists, Suspense,
  hydration, retries, render performance и waterfalls. Не использовать для
  GraphQL, RPC/tRPC, SDK-клиентов, non-HTTP data sources, backend-only fetching,
  других query libraries, React local state, migration с TanStack Query v4 или
  Vue/Svelte/Solid adapters.
---

# Использование TanStack Query

Проектируй data fetching как согласованный cache contract. `queryKey` определяет
cache identity; отдельно зафиксируй freshness policy наблюдателей, consumers,
mutation impact и server/client ownership. Сначала установи этот contract, затем
выбирай API.

## Границы

- Целевая интеграция — существующее React-приложение с TanStack Query v5 и
  OpenAPI-backed HTTP API, для которого transport, types, Zod schemas и React
  Query artifacts генерирует Kubb v5.
- Поддерживай оба runtime: чистый CSR с browser requests и SSR с
  request-scoped server requests; при hydration/client revalidation добавляй
  последующие browser requests.
- GraphQL, RPC/tRPC, SDK-owned clients и non-HTTP sources находятся вне scope.
  Не мигрируй их в OpenAPI/Kubb в рамках этого skill.
- В implementation/refactor режиме, если пакет отсутствует, добавь
  `@tanstack/react-query@5` текущим package manager и сохрани conventions
  проекта. В code review зафиксируй отсутствие пакета как finding или gap, но
  ничего не устанавливай.
- Если checkout или in-scope diff относится к другому major, остановись и
  запроси отдельную migration-задачу. Не смешивай v4/v5 APIs.
- Не создавай новый React-проект через scaffolding и не заменяй router, state
  architecture или package manager. Handwritten OpenAPI-backed operation
  мигрируй в обязательный Kubb layer только когда эта operation входит в
  implementation/refactor scope.
- Cache/UI-only изменение поверх уже generated operation не изменяет source
  OpenAPI contract и generated files.
- В implementation/refactor режиме вноси минимальный scoped diff. В diagnosis и
  code review оставайся read-only, пока пользователь явно не попросит fix.
- Не вводи глобальные `staleTime`, retry или invalidation defaults без
  подтверждённой продуктовой семантики.

## OpenAPI, Kubb и runtime

Всегда читай
[openapi-kubb-runtime.md](references/openapi-kubb-runtime.md). Он владеет
обязательным Kubb v5 contract, cache-only/API-change decision и раздельной
композицией CSR/SSR clients.

`openapi` владеет source contract,
`modular-react` — generated/runtime boundaries, а
`review-project-quality` — generation и drift gates. Читай их актуальные
`SKILL.md`, только когда соответствующая часть входит в scope; не запускай
полный transaction workflow `review-project-quality` для обычной cache policy
правки.

## Рабочий процесс

### 1. Исследовать проект

Определи:

- React/framework и версии `react`/`@tanstack/react-query`;
- package manager и integration point для provider;
- OpenAPI entrypoint, `kubb.config.*`, локальную generate-команду, версии Kubb
  plugins и generated output;
- runtime mode: CSR, SSR или оба;
- для CSR — browser client composition и ownership client base URL role;
- для SSR — request-scoped server composition и ownership server base URL role;
  browser composition и client role нужны только при hydrated browser consumer;
- router, SSR/RSC и Suspense boundaries;
- существующие API functions, query keys/options и mutation conventions;
- formatter, lint, typecheck, build и доступный browser workflow.

Заверши шаг, когда известны runtime environment, reusable conventions,
integration point и команды проверки.

### 2. Классифицировать data flow

Отметь применимые ветки:

- query/mutation/cache lifecycle, cancellation или optimistic update;
- pagination или infinite query;
- retries, parallelism, Suspense или request waterfall;
- чистый CSR либо SSR, hydration, RSC или streaming.

Заверши шаг, когда каждому in-scope риску назначен reference-владелец.

### 3. Определить cache contract

До изменений зафиксируй:

- `queryKey` и внешние стабильные inputs, меняющие cached data; для infinite
  query отдельно зафиксируй `pageParam` flow;
- generated `queryFn`, error type, `AbortSignal` и retry semantics;
- freshness (`staleTime`, server timestamp) и источник seed data;
- mutation impact и стратегию: narrow invalidation, direct cache update либо
  optimistic update с rollback;
- владельца revalidation: client query либо server-owned output;
- видимые pending, background fetching, placeholder и error states.

Заверши шаг, когда fetch, cache, mutation и render paths используют одну
identity, а неизвестная продуктовая семантика обозначена как gap.

### 4. Загрузить references

Всегда читай [client-data-lifecycle.md](references/client-data-lifecycle.md) и
[openapi-kubb-runtime.md](references/openapi-kubb-runtime.md). Затем загрузи
только references, назначенные in-scope рискам на шаге 2:

| Сигнал задачи | Дополнительный reference |
|---|---|
| Re-renders, `select`, retries, parallel requests, Suspense, Error Boundary, waterfall | [rendering-concurrency-and-suspense.md](references/rendering-concurrency-and-suspense.md) |
| Page/cursor navigation, `keepPreviousData`, load more, infinite scroll | [pagination-and-infinite-queries.md](references/pagination-and-infinite-queries.md) |
| SSR/SSG, hydration, loader, Next.js App Router, RSC, streaming | [ssr-hydration-and-streaming.md](references/ssr-hydration-and-streaming.md) |

Если задача пересекает ветки, прочитай каждого владельца решения. Не загружай
остальные references «на всякий случай». Заверши шаг, когда загружены все
владельцы применимых решений и ни одна нерелевантная тяжёлая ветка.

### 5. Реализовать или провести review

Следуй project-native file layout. Co-locate повторно используемые `queryKey` и
`queryFn` через `queryOptions`/`infiniteQueryOptions`, когда они нужны нескольким
consumers или prefetch/cache APIs. Не создавай abstraction для одноразового
query только ради единообразия.

Для новой operation, wire change или подтверждённого mismatch сначала проверь
source OpenAPI contract через `openapi`, затем запусти
project-native Kubb generation. Для cache/UI-only изменения используй
существующие generated functions, types, schemas, keys и hooks/options без
правок source contract или generated output.

В code review или diagnosis выдавай findings по убыванию серьёзности:

```text
[серьёзность] path:line — проблема
Влияние: наблюдаемое нарушение cache/runtime semantics
Исправление: минимальное конкретное исправление
```

Заверши шаг, когда diff или findings покрывают весь cache contract без
несогласованного расширения scope.

### 6. Проверить

Если source contract, Kubb config или generated artifacts изменялись, выполни
project-native Kubb generation, generated typecheck и повторную generation с
нулевым diff. Для cache/UI-only изменения докажи, что source contract и
generated output остались неизменны.

Для CSR докажи stable browser generated client и отсутствие искусственного
требования server composition. Для SSR докажи request-scoped server client. При
hydration/client revalidation дополнительно докажи stable browser client,
недостижимость server-only module из client graph и одинаковую generated
query-key identity по обе стороны hydration.

Затем запусти formatter check, lint, typecheck, build и доступную browser
проверку. В code review и diagnosis используй только read-only/check modes; не
запускай generator, formatter или другие команды, записывающие файлы, и отметь
generation/drift как непроверенный gap, если проект не предоставляет read-only
gate.
Для runtime-поведения проверь применимое:

- Network timeline и отсутствие случайных serial waterfalls;
- console/hydration errors;
- cancellation обычной query и отсутствие ложных ожиданий для Suspense hooks;
- mutation pending → invalidation → refreshed data;
- optimistic update → success либо rollback;
- pagination transition и запрет перехода по stale placeholder;
- infinite fetch guard и отсутствие duplicate/overwritten pages;
- Suspense fallback, Error Boundary и query reset.

Заверши шаг только с командами, результатами и явным списком непроверенных
runtime gaps.

## Общие инварианты

- `queryKey` — сериализуемый массив со всеми стабильными inputs, определяющими
  cached data. Для paginated `useQuery` page/cursor входит в key; у
  `useInfiniteQuery` переходный cursor передаётся через `pageParam`, а key
  описывает весь список и его filters.
- Generated HTTP `queryFn` возвращает data, отличную от `undefined`, либо
  бросает status/Zod error и передаёт обычной query предоставленный
  `AbortSignal`.
- Mutation invalidates самый узкий key prefix, полностью покрывающий impact.
  `staleTime: "static"` не refetch-ится после invalidation: для ручной
  revalidation используй другую freshness policy, а для известного результата
  mutation — `setQueryData`.
- Cache-level optimistic update сначала отменяет конфликтующий refetch,
  сохраняет snapshot, обновляет cache иммутабельно и имеет rollback path.
- Независимые requests стартуют параллельно; зависимый waterfall должен быть
  продуктовой необходимостью, а не случайной вложенностью компонентов.
- Infinite query сохраняет синхронные `pages` и `pageParams`.
- CSR использует stable browser `QueryClient` и stable generated Fetch client.
- SSR изолирует server `QueryClient` и generated Fetch client между requests; при
  browser consumer соответствующие browser clients остаются стабильными.
- Один фрагмент revalidating data имеет одного owner.
- Fetch client, TypeScript types, Zod schemas и React Query hooks одной operation
  генерируются одним Kubb run из одного OpenAPI entrypoint.
- CSR требует только client base URL role. SSR с hydrated browser consumer
  требует раздельные server/client base URL roles; server variable не достигает
  client bundle.
- Experimental API явно маркируется и не выбирается production default.

## Передача результата

- Implementation/refactor: изменённые flows и файлы; cache contract; CSR/SSR
  ownership; выполненные команды и runtime checks; assumptions и gaps.
- Code review: findings по severity, затем открытые вопросы, непроверенные gates
  и подтверждение отсутствия writes.
- Diagnosis: reproduction, вероятный или подтверждённый root cause, исключённые
  гипотезы и следующий минимальный fix/experiment без автоматического write.
