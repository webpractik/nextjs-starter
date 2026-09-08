# Next.js App Router testing

## Boundary

Используй этот reference, когда затронуты каталог `app`, React Server
Components, Client Component, layout, Route Handler, Server Action или
App Router navigation. Сначала классифицируй конкретный модуль и подтверди
версию Next.js, route tree, runtime, test config и реальные CI commands.

## Component classification

| App Router surface | Минимальный уровень | Решение |
| --- | --- | --- |
| Client Component | component/integration | Рендери с реальными providers и проверяй DOM interaction |
| Sync Server Component | project-confirmed renderer | Используй только доказанную локальным suite поддержку |
| async Server Component | E2E | Проверяй собранный маршрут; не изобретай renderer workaround |
| Extracted pure server logic | unit | Проверяй inputs, return value и errors без Next internals |
| Route Handler | Request/Response integration | Вызывай export с реалистичным Request и проверяй Response |
| Server Action с framework effects | E2E | Проверяй mutation, redirect/revalidation и видимый результат |

Если repository уже имеет рабочий harness для конкретной server surface,
подтверди его отдельным существующим тестом и сохрани тот же уровень. Наличие
jsdom само по себе не доказывает поддержку Server Component.

## Route outcomes

Покрывай `loading`, `error`, `not-found` и `global-error` на двух границах:
локальный UI-контракт соответствующего Client Component, когда он изолируем,
и реальный route outcome через E2E, когда важны streaming, status, recovery или
router coordination.

Для dynamic segments проверь валидный param и критический invalid/missing path.
Для parallel routes и intercepted routes проверяй выбранный slot, fallback,
modal/background navigation, refresh и direct entry в реальном браузере. Не
подменяй эти контракты snapshot дерева каталогов.

## Server boundaries

Для Route Handler проверяй method, URL/search params, headers, cookies, body,
status и сериализованный Response. Подменяй внешнюю сеть, storage или service
на их границе; не мокай `next/server` целиком.

Для Server Action отделяй чистую validation/domain-функцию и тестируй её как
unit. Framework effects — cookies, redirect, `revalidatePath`, `revalidateTag`
и обновление UI — доказывай integration harness только если он уже подтверждён,
иначе E2E. Не вызывай production side effects из теста.

## Streaming, caching, and hydration

Проверяй Suspense streaming как наблюдаемый порядок fallback и результата в
поддерживаемом integration harness или E2E. Для cache и revalidation сначала
зафиксируй конкретный контракт: повторный request, mutation, invalidation и
новые данные. Не делай вывод о cache только по числу вызовов mocked function.

Server/client boundary, hydration, environment variables и browser-only APIs
проверяй в соответствующем runtime. Не импортируй server-only модуль в client
test и не раскрывай secrets в fixtures, trace или report.

## Navigation and session

Локальный Client Component может проверять вызов подтверждённой публичной
router-границы. Реальные Link transitions, redirects, back/forward history,
refresh, scroll/focus, cookies, auth/session и middleware outcomes проверяй
через E2E. Используй уникальную session/data на worker и безопасный cleanup.

Не считай прямой вызов route module доказательством browser navigation, status
страницы или пользовательского recovery flow.
