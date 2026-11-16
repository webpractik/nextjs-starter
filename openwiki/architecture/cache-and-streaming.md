---
type: concept
title: Кеширование и streaming
description: Кеширование и streaming в Next.js Starter, реальные контракты и рабочие сценарии.
tags: [nextjs, starter, concept]
sources:
  - id: openwiki-source-50a18d054b596a7ed0eeffb0
    resource: repo://next.config.ts
  - id: openwiki-source-efec11b1a4dae3b601863151
    resource: repo://src/api/client-config.ts
  - id: openwiki-source-7af572f37fba83d195f6b0a4
    resource: repo://src/api/codegen/query.ts
  - id: openwiki-source-0c2f5b4fd3bfde535c9bb567
    resource: repo://src/utils/get-query-client.ts
generated: { by: "codex", at: "2026-11-16T15:55:30.306Z" }
verified:
  - by: openwiki/0.7.2
    at: 2026-11-16T15:55:30.306Z
---

# Cache Components и streaming

> Тип: объяснение + правила · Статус: включено · Источник истины: `next.config.ts`, generated cache
> tags и официальная документация Next.js

В `next.config.ts` включён `cacheComponents: true`. Этот опциональный режим Next.js 16 объединяет
Cache Components, Partial Prerendering и динамический I/O. Провайдер TanStack Query сохранён,
поэтому серверный кеш можно использовать вместе с управлением серверными данными в клиенте.

## База официальной документации

Документация собрана 16 ноября 2026 года для установленного Next.js 16.4.6.
Подробные контракты и изменения версий вынесены в отдельные справочники:

- [Cache Components в App Router](next-cache-components.md) описывает директивы, сроки,
  инвалидацию, runtime-границы и эксплуатацию.
- [Partial Prefetching и мгновенная навигация](next-partial-prefetching.md) описывает App Shell,
  стадии предзагрузки, `ensureStatic`, `instant` и проверку доступного до ответа сервера UI.
- [Каталог официальных источников](next-cache-prefetching-sources.md) содержит руководства,
  API, диагностики и release notes с привязкой к версии.

Семантика Next.js `<Link prefetch>` ниже относится к исходному компоненту Next.js.
Проектный [ForesightLink](../ui/link-prefetching.md) отключает его автоматический prefetch
и вызывает `router.prefetch(href)` по сигналу ForesightJS. Его `prefetch={true}` включает
предсказание намерения, а не передаёт одноимённый prop в Next.js Link.

## Выбор data layer

| Сценарий                                   | Предпочтительный старт                          |
| ------------------------------------------ | ----------------------------------------------- |
| Данные нужны только для server-rendered UI | Async Server Component                          |
| Общие данные выгодно переиспользовать      | `'use cache'` + `cacheLife`/`cacheTag`          |
| Request-specific данные                    | Dynamic Server Component внутри `<Suspense>`    |
| Client polling/realtime/частые refetch     | useQuery + generated options                   |
| Сложный optimistic client workflow         | React Query mutation или Server Action по месту |
| Мутация формы с server authorization       | Server Action с повторной auth/validation       |

Не переносите загрузку в клиент ради React Query и не удаляйте интерактивный клиентский кеш
ради Cache Components.

## Streaming

Асинхронные Server Components можно разделять границами Suspense. `loading.tsx` задаёт заглушку
для сегмента. Локальный `<Suspense>` позволяет выводить блоки независимо, по мере готовности.

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

Запускайте независимые промисы до первого `await` или в соседних
асинхронных компонентах. Сохраняйте примерный размер блока в заглушке, чтобы уменьшить сдвиг макета.

Ошибки рендеринга маршрута обрабатывает ближайший `error.tsx`. Последняя граница находится в `global-error.tsx`.
Sentry `ErrorBoundary` полезна в клиентском поддереве, но не заменяет обработку ошибок сегмента
и не перехватывает произвольные ошибки обработчиков событий.

## `'use cache'`

Директива применяется к асинхронной функции, компоненту или файлу. Сериализуемые аргументы и
захваченные значения входят в ключ кеша.

```tsx
import { cacheLife, cacheTag } from 'next/cache'

import { getPetById } from '#/api'
import { pets } from '#/api/cache-tags'

export async function loadPet(petId: string) {
    'use cache'
    cacheLife('minutes')
    cacheTag(pets.petsTag, pets.petTag({ petId }))

    const { data } = await getPetById({
        path: { petId },
        fetch: globalThis.fetch,
        throwOnError: true,
    })
    return data
}
```

В этом серверном примере `fetch: globalThis.fetch` обходит runtime mocks.
Стандартный apiFetch может читать next/headers для выбора режима и сценария, а внутри
общего `use cache` request APIs запрещены. Для кешируемого общего чтения нужен
транспорт без данных текущего запроса. Пример обращается к настоящему backend.
Для изолированного теста передайте явный детерминированный транспорт. Cookie mocks
оставляйте вне общего кеша и не кешируйте их вместе с реальными данными.

Правила:

- выбирайте срок кеширования по допустимой давности данных;
- оценивайте число комбинаций аргументов. Каждая создаёт отдельный ключ;
- не используйте секреты и токены сессии в ключах общего кеша;
- не помещайте персонализированный результат в общий кеш ради производительности;
- измеряйте долю попаданий и память, особенно на собственной инфраструктуре с несколькими репликами.

`cacheLife` работает только в области кеширования. Профили и значения могут меняться между версиями
Next.js. Проверяйте их по
[актуальному справочнику API](https://nextjs.org/docs/app/api-reference/functions/cacheLife).

## Runtime APIs и `'use cache: private'`

Обычный `'use cache'` не читает напрямую `cookies()`, `headers()` и `searchParams`. Читайте их
снаружи и передавайте минимум безопасных данных аргументом либо оставьте компонент динамическим.

Правила проекта пока рассматривают `'use cache: private'` как эксперимент.
В официальном справочнике Next.js 16.4.6 у директивы уже нет отметки experimental.
В production результат можно переиспользовать внутри одного запроса, но он не хранится
на сервере между запросами. Router Cache удерживает результат в памяти браузера на срок `stale`.
Перезагрузка страницы очищает его. В development есть отдельный кеш в памяти сервера,
зависящий от cookies и headers, поэтому dev не доказывает production-семантику.
API запроса разрешены, Route Handlers не поддерживаются. Директива исключена из static shell.
Для её применения в проекте нужно отдельное решение.

Перед применением проверьте версию Next.js и
[официальное описание](https://nextjs.org/docs/app/api-reference/directives/use-cache-private).

## Cache tags

Локальный плагин Kubb генерирует пространство имён по тегу OpenAPI. Текущий контракт создаёт:

```ts
import { pets } from '#/api/cache-tags'

pets.petsTag // 'pets'
pets.petTag({ petId: 'pet_123' }) // 'pets:petId:pet_123'
```

Используйте эти функции при чтении и записи. Строковые литералы могут разойтись после изменения
параметров контракта.

### `updateTag` и `revalidateTag`

| API                              | Где разрешён                    | Семантика                                  |
| -------------------------------- | ------------------------------- | ------------------------------------------ |
| `updateTag(tag)`                 | Только Server Action            | Немедленное expire для read-your-writes    |
| `revalidateTag(tag, 'max')`      | Server Function и Route Handler | Stale-while-revalidate при следующем visit |
| `revalidateTag(tag)` без profile | Не использовать                 | Deprecated blocking behavior               |

Сгенерированные `pets.revalidatePet()` и `pets.revalidatePets()` вызывают `updateTag`.
Несмотря на имя `revalidate*`, они разрешены только в Server Action.

```ts
'use server'

import { updatePet } from '#/api'
import { pets } from '#/api/cache-tags'

export async function markPetSold(petId: string) {
    // Повторно проверьте authentication, authorization и входные данные здесь.
    await updatePet({ path: { petId }, body: { status: 'sold' }, throwOnError: true })
    await pets.revalidatePet({ petId })
    await pets.revalidatePets()
}
```

В webhook или Route Handler вызывайте `revalidateTag(pets.petsTag, 'max')` напрямую.
Сгенерированная обёртка над `updateTag` вызовет ошибку выполнения.

Server Actions доступны по сети как публичные обработчики мутаций. Проверяйте аутентификацию и
права внутри каждой Server Action, даже если кнопка скрыта.

## React Query остаётся поддержанным

Корневой layout подключает `QueryProvider` и `ReactQueryStreamedHydration`.
Сгенерированные фабрики опций вместе с useQuery подходят для данных, нужных только клиенту,
опроса, обновлений по событиям в реальном времени и сложных оптимистичных обновлений.

```tsx
'use client'

import { useQuery } from '@tanstack/react-query'

import { getPetByIdOptions } from '#/api/query'

export function PetStatus({ petId }: { petId: string }) {
    const query = useQuery(getPetByIdOptions({ path: { petId } }))
    if (query.isPending) return <span>Загрузка…</span>
    if (query.isError) return <span>Не удалось загрузить данные</span>
    return <span>{query.data?.status}</span>
}
```

Не дублируйте в кеше Query полностью отрендеренные данные Server Component без необходимости,
если клиент не перезапрашивает их.

## Self-hosting и несколько replicas

Кеш по умолчанию хранится в памяти процесса. У каждой реплики standalone или Docker свой кеш,
который очищается при перезапуске. Общий бэкенд `cacheHandlers` не настроен.
Для согласованности реплик нужно спроектировать общий кеш.

## Чеклист

1. Определите, нужны ли данные клиенту после гидратации.
2. Добавьте подходящую заглушку Suspense/loading для динамического блока.
3. Для `'use cache'` задайте срок хранения, проверьте число ключей и наличие чувствительных данных.
4. Используйте сгенерированные теги при чтении и записи.
5. `updateTag` вызывайте только из Server Action. Для Route Handler используйте
   `revalidateTag(tag, 'max')`.
6. Проверяйте аутентификацию, права и входные данные внутри каждой Server Action.
7. Тестируйте production-сборку. В разработке кеширование и потоковый рендеринг работают иначе.
8. Для нескольких реплик отдельно решите вопрос общего кеша и инвалидации.

## Официальные источники

- [Cache Components](https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents)
- [`use cache`](https://nextjs.org/docs/app/api-reference/directives/use-cache)
- [`use cache: private`](https://nextjs.org/docs/app/api-reference/directives/use-cache-private)
- [`cacheLife`](https://nextjs.org/docs/app/api-reference/functions/cacheLife)
- [`updateTag`](https://nextjs.org/docs/app/api-reference/functions/updateTag)
- [`revalidateTag`](https://nextjs.org/docs/app/api-reference/functions/revalidateTag)
- [Mutating data and Server Actions](https://nextjs.org/docs/app/getting-started/mutating-data)

## Partial Prefetching в этом проекте

В `next.config.ts` включены `cacheComponents: true` и `partialPrefetching: true`.
React Compiler включается только в production. Это независимые настройки.

Cache Components определяют, какие серверные вычисления можно повторно использовать.
Partial Prefetching определяет, что Next.js загружает до перехода по ссылке.
TanStack Query хранит данные запросов для интерактивного клиента. Codegen создаёт SDK,
фабрики опций и теги, но не выбирает стратегию кеширования экрана.

| Механизм | Что хранит или загружает | Чем обновлять |
| --- | --- | --- |
| Next.js `use cache` | Результат серверной функции/компонента | `updateTag` или `revalidateTag` |
| Next.js prefetch | App Shell и запрошенные части маршрута | Серверная инвалидация; при необходимости `router.refresh()` |
| TanStack Query | Результат query по generated key | `invalidateQueries` или `setQueryData` |

При Partial Prefetching обычная ссылка загружает общую оболочку маршрута App Shell.
Части, зависящие от `params` или `searchParams`, по умолчанию приходят после перехода
из-за границы Suspense. `prefetch={true}` дополнительно разрешает URL-данные и кешируемое
содержимое за ними до клика. `prefetch={false}` отключает предварительную загрузку ссылки.
Это поведение проверяется в production. Автоматический prefetch не работает в `next dev`.

Общий App Shell может включать кешируемое содержимое с `cacheLife.stale` не менее пяти минут.
Профиль `seconds` для этого не подходит. Короткоживущие и некешируемые данные загружайте
потоковыми блоками после перехода. Сессионная оболочка не разрешает помещать секреты
или персональные результаты в общий серверный кеш.

### Добавление динамического экрана

1. Оставьте заголовок, навигацию и независимые блоки снаружи Suspense.
2. Передайте promise `params`/`searchParams` компоненту под Suspense и читайте его там.
   Если `await params` стоит до границы, вложенный Suspense не позволяет вывести оболочку до завершения ожидания.
3. Для общих данных используйте SDK в `use cache`, как в `loadPet` выше. Для данных
   текущего пользователя читайте сессию снаружи кеша, проверяйте права и сохраняйте
   динамическую границу. SDK не переносит серверные cookies автоматически.
4. Для polling, клиентских фильтров и мутаций используйте `#/api/query` с TanStack hooks.
   Root layout уже подключает QueryProvider и NuqsAdapter. Фильтры URL должны входить
   в `query` опций. Одно подключение nuqs не синхронизирует Query cache.
5. Добавляйте `prefetch={true}` только конкретным ссылкам, для которых нужны данные URL
   до клика. Учитывайте дополнительную серверную работу на каждую такую ссылку.

Псевдокод показывает границы. PetDetails и PetSkeleton здесь обозначают компоненты вашего маршрута:

```tsx
import { Suspense } from 'react'

interface PetPageProps {
    params: Promise<{ petId: string }>
}

export default function PetPage({ params }: PetPageProps) {
    return <Suspense fallback={<PetSkeleton />}><PetContent params={params} /></Suspense>
}

async function PetContent({ params }: PetPageProps) {
    const { petId } = await params
    return <PetDetails petId={petId} />
}
```

При глобальном флаге `true` экспорт `prefetch = 'partial'` в каждом page не нужен.
Такой экспорт подходит для постепенного внедрения при глобальном флаге `false`.
Не добавляйте `instant = false` для скрытия диагностик вместо исправления границ.

### Мутация и обновление интерфейса

Server Action выше использует `throwOnError: true`. Ошибка HTTP или Zod прерывает действие
до инвалидации. Перед использованием действия реализуйте авторизацию и проверку входных данных
продукта. Пример показывает только интеграцию SDK и cache tags.

Клиентская мутация обновляет другой кеш:

```tsx
'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'

import { getPetByIdQueryKey, updatePetMutation } from '#/api/query'

export function MarkPetSold({ petId }: { petId: string }) {
    const queryClient = useQueryClient()
    const mutation = useMutation({
        ...updatePetMutation(),
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: getPetByIdQueryKey({ path: { petId } }),
            })
        },
    })
    return (
        <div>
            <button disabled={mutation.isPending} type="button"
                onClick={() => mutation.mutate({ path: { petId }, body: { status: 'sold' } })}>
                Продано
            </button>
            {mutation.isError ? <p role="alert">Не удалось сохранить изменения</p> : null}
        </div>
    )
}
```

Пример использует нативную кнопку, чтобы показать работу с данными. В экране используйте
проектный Button. Если экран показывает также списки, инвалидируйте их фактические ключи
с теми же фильтрами и baseUrl. Generated keys включают operationId, base URL, path/query
и теги OpenAPI. Теги в ключе Query не выполняют Next.js-инвалидацию.

Если браузерный SDK выполняет мутацию напрямую в backend, Next.js server cache не обновляется.
Для экрана с обоими кешами организуйте Server Action либо защищённый webhook
для server tags и отдельно обновите Query cache. `router.refresh()` повторно получает
серверное дерево, но не инвалидирует серверный кеш и не очищает TanStack Query.
Нельзя импортировать `#/api/cache-tags` в Client Component.

### Гидратация и предварительная загрузка Query

`getQueryClient()` создаёт новый клиент при серверном вызове и переиспользует один
в браузере. Значение `staleTime` равно 60 секундам. Dehydration допускает pending queries.
QueryProvider использует ReactQueryStreamedHydration. Наличие этой инфраструктуры
не гарантирует, что произвольный клиентский useQuery уже попал в App Shell.

Для ручного `prefetchQuery` используйте те же generated options и тот же экземпляр
QueryClient, который передаёте через HydrationBoundary. Два вызова getQueryClient
на сервере дадут разные экземпляры. Не добавляйте вторую гидратацию поверх текущего
провайдера без конкретного сценария. Next.js Link prefetch не вызывает автоматически
queryClient.prefetchQuery и не загружает заранее данные произвольных browser queries.

### Проверка и ограничения внедрения

В проекте уже есть `ForesightLink` с вызовом `router.prefetch` и production E2E
`src/tests/e2e/foresight.spec.ts`. Команда `npm run test:e2e:production` временно добавляет
тестовые маршруты, собирает приложение, запускает E2E и затем пересобирает его без fixtures.
Эти тесты проверяют момент сетевого prefetch и обычный переход. Они не проверяют весь UI,
доступный до возобновления серверного ответа. Состав тестов подтверждён чтением исходников.
Их успешный запуск не подтверждался при сборе этой документации.

Для новых маршрутов проверяйте каждую исходную ссылку и целевой URL:

1. В `next dev` откройте маршрут и проверьте диагностики URL-данных вне Suspense.
2. Выполните свежий `npm run build` и `PLAYWRIGHT_SERVER_MODE=standalone npm run test:e2e`.
3. В production проверьте, что видно до завершения динамических запросов, на холодном
   переходе, повторном переходе и browser back. Проверяйте конкретную ссылку, не только URL.
4. Убедитесь, что мутация обновляет все реально используемые кеши, а ошибка их не инвалидирует.
5. Для строгой проверки UI до клика используйте `instant()` из отдельного `@next/playwright`.
   Сейчас этого пакета и специальных instant-тестов в проекте нет. Обычный E2E их не заменяет.

Гайд сверяется с документацией установленного Next.js 16.4 в
`node_modules/next/dist/docs/`. Первичные руководства:
[Partial Prefetching](https://nextjs.org/docs/app/guides/adopting-partial-prefetching),
[настройка partialPrefetching](https://nextjs.org/docs/app/api-reference/config/next-config-js/partialPrefetching),
[оптимизация prefetch](https://nextjs.org/docs/app/guides/optimizing-prefetching).
