---
name: tanstack-query
description: >-
  Использовать при реализации, диагностике и ревью CSR/SSR-запросов в React
  с TanStack Query и Kubb для OpenAPI HTTP API: query keys, cache lifecycle,
  mutations, pagination, Suspense и hydration. Ориентироваться на последние
  стабильные релизы. Не использовать для GraphQL, RPC/tRPC, SDK-клиентов,
  non-HTTP sources, React local state и других framework adapters.
---

# Использование TanStack Query

Проектируй data fetching как согласованный cache contract. `queryKey` определяет
cache identity; отдельно зафиксируй freshness policy наблюдателей, consumers,
mutation impact и server/client ownership. Сначала установи этот contract, затем
выбирай API.

## Границы

- Целевая интеграция — существующее React-приложение с TanStack Query и
  OpenAPI-backed HTTP API, для которого transport, types, Zod schemas и React
  Query artifacts генерирует Kubb.
- Поддерживай оба runtime: чистый CSR с browser requests и SSR с
  request-scoped server requests; при hydration/client revalidation добавляй
  последующие browser requests.
- GraphQL, RPC/tRPC, SDK-owned clients и non-HTTP sources находятся вне scope.
  Не мигрируй их в OpenAPI/Kubb в рамках этого skill.
- В implementation/refactor режиме, если пакет отсутствует, добавь
  последний стабильный `@tanstack/react-query` текущим package manager и сохрани
  conventions проекта. В code review зафиксируй отсутствие пакета как finding
  или gap, но ничего не устанавливай.
- Не создавай новый React-проект через scaffolding и не заменяй router, state
  architecture или package manager. Handwritten OpenAPI-backed operation
  мигрируй в обязательный Kubb layer только когда эта operation входит в
  implementation/refactor scope.
- Cache/UI-only изменение с прежней generated identity не изменяет source
  OpenAPI contract и generated files. Изменение generated keys/options относится
  к настройке генерации и допускает regeneration без изменения wire contract.
- В implementation/refactor режиме вноси минимальный scoped diff. В diagnosis и
  code review оставайся read-only, пока пользователь явно не попросит fix.
- Не вводи глобальные `staleTime`, retry или invalidation defaults без
  подтверждённой продуктовой семантики.

## Актуальность пакетов

Всегда ориентируйся на последние стабильные релизы `@tanstack/react-query`,
Kubb и его plugins. Перед выбором API проверь `latest` в npm registry,
официальные docs/release notes, установленные версии и lockfile. Конкретные
номера фиксируй в отчёте проверки и lockfile проекта, не в правилах skill.

`latest` — цель сверки, а не разрешение обновлять зависимости вне задачи.
Если установленный пакет не поддерживает нужный актуальный API, укажи
несовместимость; upgrade/migration выполняй только в согласованном scope.
Не применяй новый API к старому runtime. Если registry или docs недоступны,
отметь актуальность как непроверенную, не называй версию последней по памяти.

## OpenAPI, Kubb и runtime

Всегда читай
[openapi-kubb-runtime.md](references/openapi-kubb-runtime.md). Он владеет
Kubb contract, проверкой совместимости пакетов, классификацией изменений и
раздельной композицией CSR/SSR clients.

`openapi` владеет source contract,
`modular-react` — generated/runtime boundaries и project-native generation/drift
checks. Обязательные проверки генерации описаны ниже и не требуют отдельного
review-skill. Читай актуальные `SKILL.md` этих смежных skills, когда они доступны
и соответствующая часть входит в scope; их отсутствие не отменяет локальные gates.

## Рабочий процесс

### 1. Исследовать проект

Определи:

- React/framework, установленные и последние стабильные версии packages,
  совместимость по `engines` и `peerDependencies`;
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
source OpenAPI contract, при доступности через `openapi`, затем запусти
project-native Kubb generation. Для изменения generated keys/options исправь
Kubb config и regenerate; корректный source contract сохраняй.
Runtime scope, недоступный generated helper, добавляй через единую key/options
composition по правилам Kubb reference; не меняй ключи разрозненно в consumers.
Для cache/UI-only изменения с прежней generated identity используй
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
нулевым diff относительно первого результата. Для cache/UI-only изменения с
прежней generated identity докажи, что source contract и
generated output остались неизменны.

Для CSR докажи stable browser generated client и отсутствие искусственного
требования server composition. Для SSR докажи request-scoped server client. При
hydration/client revalidation дополнительно докажи stable browser client,
недостижимость server-only module из client graph и одинаковую generated
или составную query-key identity по обе стороны hydration.
Проверь сериализуемость generated keys и наличие freshness policy у browser
consumer: `dehydrate` переносит состояние query, а не server `staleTime`.

Затем запусти formatter check, lint, typecheck, build и доступную browser
проверку. В code review и diagnosis используй только read-only/check modes; не
запускай команды с записью файлов. Kubb `generate --dryRun` использует memory
output; применяй его после проверки отсутствия побочных записей в project config
и custom plugins. Dry run не доказывает отсутствие drift относительно сохранённых
artifacts: если отдельного read-only diff gate нет, отметь drift как gap.
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

Во всех режимах укажи проверенные installed/latest версии, дату сверки и
источники. Ссылки этого пакета ведут на актуальную документацию; при расхождении
примера с последним стабильным релизом используй подтверждённый API релиза.
