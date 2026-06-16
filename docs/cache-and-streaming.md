# Кеширование и streaming

Стандарт работы с данными в проекте на базе Next.js 16 `cacheComponents`. Описывает два слоя: **серверный кэш** (`use cache` функции и компоненты) и **динамические серверные компоненты** (async RSC внутри `<Suspense>`), которые стримятся клиенту по мере готовности.

В этом гайде нет React Query. С включёнными cache components весь data-fetching живёт на сервере: публичные данные кешируются через `use cache`, персональные — рендерятся в async Server Component и стримятся в HTML. Клиент получает готовую разметку, а не JSON + кэш для гидратации.

**Рабочие примеры:** все четыре паттерна — streaming-лист, параллельный Suspense, optimistic мутации и infinite RSC — собраны в `app/(public)/examples/`. Они используют кодогенерированный `@repo/api/codegen` и in-memory store над сгенерированными моками, так что открываются без бэка: `/examples/pets`, `/examples/pets/[petId]`, `/examples/store`, `/examples/feed`.

**Параллель на React Query** — `app/(public)/rq-examples/`. Использует сгенерированные RQ-хуки (`@repo/api/codegen/hooks/*`) + mock client поверх `createPet()` из `@repo/api/codegen/mocks`. Показывает классический подход (`useSuspenseQuery`, `useMutation` с `onMutate`/`onError`, `useSuspenseInfiniteQuery`) рядом с RSC-версией для прямого сравнения. Оба стенда изолированы: RSC держит state на сервере, RQ — в клиенте, синхронизации между ними нет.

## Когда вообще нужен клиентский data layer

С `cacheComponents` клиентский кэш (React Query / SWR) перестаёт быть инфраструктурным дефолтом. Он остаётся оправданным только для узких сценариев:

- Long-poll / websocket / SSE стримы, где данные приходят вне HTTP request-response.
- Высокочастотный realtime UI (graphs, ticker), где сетевой round-trip к серверу слишком дорогой.
- Сложные клиентские workflow с локальной нормализацией кэша между несвязанными экранами.

Всё остальное — каталоги, карточки, корзины, профили, формы, фильтры, пагинация, мутации — закрывается RSC + Server Actions. Этот документ описывает именно такой путь.

## Архитектура

```
┌───────────────────────────────────────────────────────────┐
│  Server Component (RSC)                                    │
│  ┌───────────────────────┐   ┌─────────────────────────┐  │
│  │  use cache              │   │  async RSC              │  │
│  │  cacheLife / cacheTag   │   │  + cookies()/headers()  │  │
│  │  (public, bounded)      │   │  (per-request, dynamic) │  │
│  └───────────────────────┘   └─────────────────────────┘  │
│          PPR Shell                  Streaming Suspense     │
├────────────────────────────────────────────────────────────┤
│  Client Component                                          │
│  ┌───────────────────────┐   ┌─────────────────────────┐  │
│  │  useActionState        │   │  useOptimistic           │  │
│  │  Server Actions        │   │  Optimistic UI           │  │
│  └───────────────────────┘   └─────────────────────────┘  │
│      Мутации                       Мгновенный отклик       │
└────────────────────────────────────────────────────────────┘
```

На каждой странице три типа контента:

| Тип          | Описание                                                | Откуда                               |
| ------------ | ------------------------------------------------------- | ------------------------------------ |
| Статический  | Синхронный JSX — навигация, заголовки, shell            | CDN, мгновенно                       |
| Кешированный | Данные с `use cache` + `cacheLife`                      | Серверный кэш с TTL                  |
| Динамический | Async RSC внутри `<Suspense>`, чувствительный к запросу | Стримится клиенту по мере готовности |

PPR (Partial Prerendering) отдаёт статический shell мгновенно, кешированные данные — из кэша, динамические RSC — стримит как HTML chunks.

## Серверный кэш (`use cache`)

### Включение

Уже включено в `next.config.ts`:

```ts
const nextConfig: NextConfig = {
    cacheComponents: true,
}
```

**Что это даёт.** `cacheComponents` в Next.js 16 — новая реализация Partial Prerendering, заменяющая `experimental.ppr`. Она разрешает директиву `'use cache'` на компонентах/функциях, автоматически определяет границу между статическим shell и dynamic-частями (всё, что зависит от `cookies()`, `headers()`, `searchParams`, `fetch()` без кэша), и стримит dynamic-части по мере готовности.

### Где применять

Применяй `use cache` **на уровне компонента или функции**, а не на уровне файла. Это предотвращает случайное кеширование динамических частей.

```tsx
// Правильно — компонент
async function ProductList() {
    'use cache'
    cacheLife('minutes')
    cacheTag('products')

    const products = await getProducts()
    return <ProductGrid products={products} />
}

// Правильно — функция
async function getPopularProducts() {
    'use cache'
    cacheLife('hours')
    cacheTag('products', 'popular')

    return fetchPopularProducts()
}
```

### Стратегии `cacheLife`

| Профиль                                | Когда использовать       | Примеры                       |
| -------------------------------------- | ------------------------ | ----------------------------- |
| `'minutes'`                            | Часто обновляемые данные | Каталоги, списки, поиск       |
| `'hours'`                              | Редко меняющиеся данные  | Агрегаты, статистика, конфиги |
| `'days'` / `'weeks'`                   | Почти статические данные | Справочники, словари          |
| Inline `{ stale, revalidate, expire }` | Точный контроль TTL      | Специфичные бизнес-требования |

Пример inline-конфигурации:

```tsx
async function DashboardStats() {
    'use cache'
    cacheLife({
        stale: 300, // 5 минут — отдаёт stale, пока ревалидирует
        revalidate: 600, // 10 минут — интервал фоновой ревалидации
        expire: 3600, // 1 час — жёсткое истечение
    })
    cacheTag('dashboard-stats')

    const stats = await getDashboardStats()
    return <StatsDisplay stats={stats} />
}
```

### Теги `cacheTag`

Теги привязываются к сущностям бизнес-домена. Используй двойную разметку — коллекция + конкретная сущность:

```tsx
cacheTag('products') // вся коллекция
cacheTag('products', `product-${id}`) // коллекция + конкретный продукт
```

Это позволяет инвалидировать как один элемент (`updateTag('product-123')`), так и всю коллекцию (`updateTag('products')`).

В этом проекте строки тегов не пишутся руками — их генерирует kubb-плагин из OpenAPI (см. раздел «Кодогенерируемые хелперы тегов» ниже). Импортируй `productsTag` / `productTag(...)` из `@repo/api/tags` вместо литералов, чтобы read- и write-стороны всегда совпадали.

### Ограничение: runtime API

Внутри `use cache` **нельзя** вызывать `cookies()`, `headers()`, `searchParams`. Решение — передавать как аргументы из родительского серверного компонента. Но осторожно: аргументы становятся частью ключа кэша, поэтому **кардинальность аргумента определяет кардинальность кэша**.

```tsx
// ❌ НЕПРАВИЛЬНО — unbounded cache
async function ProfilePage() {
    const session = (await cookies()).get('session')?.value
    return <CachedProfile sessionId={session!} />
}

async function CachedProfile({ sessionId }: { sessionId: string }) {
    'use cache'
    cacheTag('profile', `profile-${sessionId}`)
    // Каждая сессия создаёт отдельную запись в серверном кэше.
    // На активной базе пользователей кэш растёт неограниченно.
    const user = await getUserBySession(sessionId)
    return <ProfileCard user={user} />
}
```

**Правила bounded cardinality:**

- Аргументы `use cache`-функции должны принадлежать **ограниченному множеству**: роль (`admin | user | guest`), тариф (`free | pro | enterprise`), locale, feature-flag variant.
- Идентификаторы пользователей, сессий, устройств — **запрещены как ключ публичного кэша** для per-user данных. Такие данные либо рендерятся через async RSC без `use cache` (см. ниже), либо живут под `'use cache: private'`.

```tsx
// ✅ ПРАВИЛЬНО — bounded cardinality
async function TierBenefits({ tier }: { tier: 'free' | 'pro' | 'enterprise' }) {
    'use cache'
    cacheLife('hours')
    cacheTag('tier-benefits', `tier-${tier}`)
    // Максимум 3 записи в кэше — по одной на tier.
    const benefits = await getTierBenefits(tier)
    return <BenefitsList benefits={benefits} />
}
```

### `'use cache: private'` — per-user с TTL

Если действительно нужен серверный кэш per-user (тяжёлый запрос, который окупает ресайз кэша), используй приватный профиль. Он разрешает `cookies()`/`headers()` внутри и хранится изолированно от публичного кэша:

```tsx
async function PersonalRecommendations() {
    'use cache: private'
    cacheLife({ stale: 60, revalidate: 300, expire: 600 })

    const userId = (await cookies()).get('uid')?.value
    const recs = await computeRecommendations(userId)
    return <RecommendationGrid items={recs} />
}
```

Используй умеренно: каждая запись приватного кэша живёт на сервере, на больших аудиториях это память. Для простых случаев предпочитай обычный async RSC без кэша — он стримится мгновенно и не оставляет следа.

## Динамические серверные компоненты (streaming)

Раньше эту роль выполнял `prefetchQuery` + `HydrationBoundary` + `useSuspenseQuery`. С `cacheComponents` она закрывается проще: пишешь обычный async серверный компонент, оборачиваешь его в `<Suspense>` — Next.js сам стримит его HTML.

### Базовый паттерн

```tsx
// app/(public)/products/page.tsx
import { Suspense } from 'react'
import { ProductList } from './_components/product-list'
import { ProductListSkeleton } from './_components/product-list-skeleton'

export default function ProductsPage() {
    return (
        <Suspense fallback={<ProductListSkeleton />}>
            <ProductList />
        </Suspense>
    )
}
```

```tsx
// app/(public)/products/_components/product-list.tsx
import { getProducts } from '@repo/api/codegen/products'
import { ProductGrid } from './product-grid'

export async function ProductList() {
    const products = await getProducts()
    return <ProductGrid products={products} />
}
```

`ProductList` — обычный серверный компонент, не `'use client'`. Никакого dehydrate, никакого HydrationBoundary, никакого клиентского кэша. PPR shell отдаётся мгновенно, async-часть стримится.

Если этот же список нужно ещё и кешировать на сервере — добавь `'use cache'` внутрь `ProductList` (см. раздел выше). С `'use cache'` он попадает в кэш, без — каждый запрос ходит к API.

### Per-user данные

Поскольку рендер идёт на сервере, доступ к `cookies()`/`headers()` обычное дело — никаких утечек между пользователями быть не может, потому что нет общего клиентского кэша, в котором два пользователя могли бы пересечься.

```tsx
// app/(public)/profile/page.tsx
import { Suspense } from 'react'
import { UserProfile } from './_components/user-profile'

export default function ProfilePage() {
    return (
        <Suspense fallback={<ProfileSkeleton />}>
            <UserProfile />
        </Suspense>
    )
}

async function UserProfile() {
    const userId = (await cookies()).get('uid')?.value
    if (!userId) return <SignInPrompt />
    const user = await getUser(userId)
    return <ProfileCard user={user} />
}
```

Запрос `cookies()` автоматически делает компонент dynamic: Next выделяет его в Suspense boundary, отдаёт PPR shell мгновенно, а профиль стримит после.

### Параллельные данные на одной странице

Каждый async компонент в своём `<Suspense>` стримится независимо — быстрые блоки появляются первыми:

```tsx
export default function DashboardPage() {
    return (
        <>
            <Suspense fallback={<StatsSkeleton />}>
                <DashboardStats />
            </Suspense>
            <Suspense fallback={<OrdersSkeleton />}>
                <RecentOrders />
            </Suspense>
            <Suspense fallback={<NotificationsSkeleton />}>
                <Notifications />
            </Suspense>
        </>
    )
}

async function DashboardStats() {
    'use cache'
    cacheLife('minutes')
    cacheTag('dashboard-stats')
    const stats = await getStats()
    return <StatsDisplay stats={stats} />
}

async function RecentOrders() {
    const userId = (await cookies()).get('uid')!
    const orders = await getRecentOrders(userId)
    return <OrdersList items={orders} />
}

async function Notifications() {
    const userId = (await cookies()).get('uid')!
    const items = await getNotifications(userId)
    return <NotificationFeed items={items} />
}
```

Параллельность достигается тем, что Next запускает рендер каждого Suspense-блока сразу, не дожидаясь соседей. Хочешь, чтобы данные стартовали ещё раньше — выноси `await` в начало родителя:

```tsx
export default async function DashboardPage() {
    // Стартуем все запросы одновременно, не блокируя на каждом
    const statsPromise = getStats()
    const ordersPromise = getRecentOrders(/* ... */)

    return (
        <>
            <Suspense fallback={<StatsSkeleton />}>
                <DashboardStats statsPromise={statsPromise} />
            </Suspense>
            <Suspense fallback={<OrdersSkeleton />}>
                <RecentOrders ordersPromise={ordersPromise} />
            </Suspense>
        </>
    )
}

async function DashboardStats({ statsPromise }: { statsPromise: Promise<Stats> }) {
    const stats = await statsPromise
    return <StatsDisplay stats={stats} />
}
```

### `generateMetadata` — `React.cache` для дедупликации

`generateMetadata` выполняется до рендера `Page`. Если ему нужны те же данные, что и странице, оборачивай fetch в `React.cache()` — это дедуплицирует запрос в рамках одного HTTP-запроса:

```tsx
import { cache } from 'react'
import { getProduct } from '@repo/api/codegen/products'

const loadProduct = cache(async (id: string) => getProduct({ params: { id } }))

export async function generateMetadata({ params }: Props) {
    const { id } = await params
    const product = await loadProduct(id)
    return { title: product.name }
}

export default async function ProductPage({ params }: Props) {
    const { id } = await params
    const product = await loadProduct(id) // тот же вызов — берётся из React.cache
    // ...
}
```

`React.cache` — это per-request memoization, не серверный кэш. Если данные продукта стоит ещё и кешировать с TTL — оберни `getProduct` (или вызывающий компонент) в `'use cache'` отдельно.

### Error boundaries рядом с Suspense

Если async компонент бросает, исключение всплывает до ближайшего error boundary. В production каждая Suspense-граница должна иметь парный error boundary: либо сегментный `error.tsx` в сегменте роута, либо явный `<ErrorBoundary>` внутри страницы.

```tsx
import { ErrorBoundary } from 'react-error-boundary'
;<ErrorBoundary fallback={<ProductListError />}>
    <Suspense fallback={<ProductListSkeleton />}>
        <ProductList />
    </Suspense>
</ErrorBoundary>
```

Порядок обёрток важен: `ErrorBoundary` **снаружи** `Suspense`, иначе ошибка не будет поймана.

## Интерактивность без клиентского кэша

«Но как же фильтры/пагинация/refetch без React Query?» — вопрос законный. Ответ: через URL state, Server Actions и React 19 hooks. Каждый из этих механизмов закрывает один из use-кейсов, ради которых обычно тянут клиентский кэш.

### Фильтры и пагинация → URL state

Фильтры храни в `searchParams` (или через `nuqs` для типобезопасности). Любая навигация/обновление URL → Next ререндерит соответствующий сегмент → новые данные приходят с сервера.

```tsx
// app/(public)/products/page.tsx
type SearchParams = Promise<{ category?: string; page?: string }>

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
    const { category, page = '1' } = await searchParams

    return (
        <>
            <ProductFilters />
            <Suspense
                key={`${category ?? ''}-${page}`} // ключ заставляет Suspense сбрасываться
                fallback={<ProductListSkeleton />}
            >
                <ProductList category={category} page={Number(page)} />
            </Suspense>
        </>
    )
}

async function ProductList({ category, page }: { category?: string; page: number }) {
    'use cache'
    cacheLife('minutes')
    cacheTag('products', category ? `category-${category}` : 'all')

    const products = await getProducts({ category, page })
    return <ProductGrid products={products} />
}
```

Чтение `searchParams` делает `ProductsPage` dynamic. Сам `ProductList` остаётся в `use cache` с bounded ключом (категория + страница), значит каждая популярная комбинация кешируется.

`<ProductFilters>` — клиентский компонент, который пушит изменения в URL через `useRouter().push(...)`/`<Link>`/`nuqs`. Никакого собственного кэша он не хранит — источник истины это URL.

### «Load more» → Server Action + `useActionState`

Если нужен «подгрузить ещё» без полной навигации, используй Server Action, который возвращает следующий чанк, и `useActionState` для накопления:

```tsx
// app/(public)/products/actions.ts
'use server'

import { getProducts } from '@repo/api/products'

export async function loadMoreProducts(
    prev: { items: Product[]; nextCursor: string | null },
    cursor: string | null,
) {
    const page = await getProducts({ cursor })
    return {
        items: [...prev.items, ...page.items],
        nextCursor: page.nextCursor,
    }
}
```

```tsx
// app/(public)/products/_components/product-list-client.tsx
'use client'

import { useActionState } from 'react'
import { loadMoreProducts } from '../actions'

export function ProductListClient({
    initial,
}: {
    initial: { items: Product[]; nextCursor: string | null }
}) {
    const [state, formAction, isPending] = useActionState(
        (prev, _formData: FormData) => loadMoreProducts(prev, prev.nextCursor),
        initial,
    )

    return (
        <>
            <ProductGrid products={state.items} />
            {state.nextCursor && (
                <form action={formAction}>
                    <button disabled={isPending}>Load more</button>
                </form>
            )}
        </>
    )
}
```

Начальная страница приходит из RSC, дальнейшие — стримятся через Server Action. Никакого клиентского кэша.

### Refetch текущей страницы → `router.refresh()`

Когда данные стали неактуальны (после мутации, по таймеру, по событию), вызывай `router.refresh()` из клиентского компонента — Next перерендерит текущий роут на сервере:

```tsx
'use client'

import { useRouter } from 'next/navigation'

export function RefreshButton() {
    const router = useRouter()
    return <button onClick={() => router.refresh()}>Обновить</button>
}
```

`router.refresh()` уважает существующие `use cache` — если кэш ещё свежий, повторного запроса к API не будет. Чтобы инвалидировать конкретные теги, используй Server Action с `updateTag()` (см. ниже).

### Мутации → Server Actions + `useOptimistic`

Мутации идут через Server Actions, оптимистичный UI — через `useOptimistic`. Это полностью покрывает то, что в RQ делалось через `useMutation` + `optimisticUpdate`.

```tsx
// app/(public)/todos/actions.ts
'use server'

import { updateTag } from 'next/cache'
import { db } from '#/db'

export async function toggleTodo(id: string, done: boolean) {
    await db.todos.update({ where: { id }, data: { done } })
    updateTag(`todo-${id}`)
    updateTag('todos')
}
```

```tsx
// app/(public)/todos/_components/todo-list.tsx
'use client'

import { useOptimistic, useTransition } from 'react'
import { toggleTodo } from '../actions'

export function TodoList({ initial }: { initial: Todo[] }) {
    const [optimistic, applyOptimistic] = useOptimistic(
        initial,
        (state, patch: { id: string; done: boolean }) =>
            state.map((t) => (t.id === patch.id ? { ...t, done: patch.done } : t)),
    )
    const [, startTransition] = useTransition()

    return (
        <ul>
            {optimistic.map((todo) => (
                <li key={todo.id}>
                    <input
                        type="checkbox"
                        checked={todo.done}
                        onChange={(e) =>
                            startTransition(async () => {
                                applyOptimistic({ id: todo.id, done: e.target.checked })
                                await toggleTodo(todo.id, e.target.checked)
                            })
                        }
                    />
                    {todo.title}
                </li>
            ))}
        </ul>
    )
}
```

`useOptimistic` мгновенно перерисовывает чекбокс, Server Action синхронизирует серверный state и инвалидирует теги. `router.refresh()` тут не обязателен — `updateTag()` сам триггерит ре-рендер RSC, использующих эти теги в активной навигации.

## Мутации и инвалидация

С единственным серверным кэшем модель инвалидации становится одной трубой: мутация → `updateTag()`/`revalidateTag()` → следующий рендер RSC видит свежие данные.

### Server Action — базовый паттерн

```tsx
// app/(public)/products/actions.ts
'use server'

import { updateTag } from 'next/cache'
import { updateProductApi } from '@repo/api/products'

export async function updateProduct(id: string, data: ProductInput) {
    await updateProductApi(id, data)
    updateTag(`product-${id}`)
    updateTag('products')
}
```

Любой `use cache`-компонент с тегом `products` или `product-${id}` будет считаться устаревшим. Когда пользователь увидит этот компонент в следующий раз — Next пересоберёт его с сервера.

### `updateTag` vs `revalidateTag`

| Функция           | Поведение                                                                                                | Когда использовать                                                                |
| ----------------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `updateTag()`     | Немедленная инвалидация. Текущий запрос видит свежие данные, и активная навигация подхватывает их сразу. | После мутации пользователя — он ожидает увидеть результат сразу.                  |
| `revalidateTag()` | Фоновая ревалидация (stale-while-revalidate). Следующий запрос получит свежие данные.                    | Webhook от внешней системы, массовые обновления, когда немедленность не критична. |

### Кодогенерируемые хелперы тегов

Строки тегов не пишутся руками. На каждой генерации API kubb-плагин `kubb-plugin-cache-tags` обходит OpenAPI и под каждый тег операции создаёт файл в `packages/api/tags/`. Внутри — четыре экспорта на сущность:

- `productsTag` — литерал коллекции (`'products'`).
- `productTag({ productId })` — функция, возвращающая типизированную строку entity-тега (`products:productId:${productId}`).
- `revalidateProducts()` — обёртка над `updateTag(productsTag)`.
- `revalidateProduct({ productId })` — обёртка над `updateTag(productTag({ productId }))`.

Index реэкспортирует их как namespace, поэтому импорт выглядит так:

```ts
import { products, orders } from '@repo/api/tags'
```

**Read-сторона** — на тех же тегах размечаем `use cache`-компоненты:

```tsx
import { cacheLife, cacheTag } from 'next/cache'
import { products } from '@repo/api/tags'
import { getProduct } from '@repo/api/codegen/products'

async function ProductDetails({ productId }: { productId: string }) {
    'use cache'
    cacheLife('minutes')
    cacheTag(products.productsTag, products.productTag({ productId }))

    const product = await getProduct({ params: { productId } })
    return <ProductCard product={product} />
}
```

**Write-сторона** — Server Action вызывает `revalidate*()` без знания о формате строки:

```ts
// app/(public)/products/actions.ts
'use server'

import { products } from '@repo/api/tags'
import { updateProduct as updateProductApi } from '@repo/api/codegen/products'

export async function updateProduct(productId: string, data: ProductInput) {
    await updateProductApi({ params: { productId }, body: data })

    await products.revalidateProduct({ productId }) // конкретная карточка
    await products.revalidateProducts() // листинги/агрегаты
}
```

Зачем это нужно:

- **Один источник истины.** Backend переименовал тег или параметр сущности — `bun run generate` перегенерирует `packages/api/tags/`, и TypeScript подсветит все места, где формат тега больше не сходится. Литералы `cacheTag('product-${id}')` такой защиты не дают.
- **Типобезопасные параметры.** `productTag({ productId })` принимает объект ровно той формы, которую отдаёт OpenAPI. Опечатка в имени параметра ломает билд, а не молча инвалидирует пустое множество.
- **Симметрия read/write.** Read-компонент и Server Action импортируют один и тот же модуль, поэтому невозможна ситуация, когда мутация инвалидирует `'product-123'`, а кэш помечен как `'products:productId:123'`.

Что **не меняется** при переходе на хелперы:

- Правило bounded cardinality из раздела про `use cache`. `productTag({ productId })` сам по себе ничего не ограничивает — если `productId` фактически принимает миллион значений и используется как ключ публичного `use cache`, кэш всё равно будет расти. Решай это уровнем выше: либо рендери такие данные через async RSC без кэша, либо кешируй только bounded-агрегаты.
- Различие между `updateTag` и `revalidateTag`. Сгенерированные `revalidate*()` всегда зовут `updateTag` (немедленная инвалидация под пользовательскую мутацию). Если нужно фоновое поведение под webhook — дёргай `revalidateTag(products.productsTag)` напрямую.
- Необходимость `router.refresh()` после мутации из клиента, если требуется перерисовать уже отрендеренный экран без навигации (см. ниже).

### Когда нужен `router.refresh()`

`updateTag()` помечает кэш устаревшим, но компонент, уже отрендеренный на клиенте, обновится только при следующем рендере. Если мутация вызывается из клиентского компонента и нужно увидеть свежие данные **на той же странице без навигации** — добавь `router.refresh()`:

```tsx
'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { updateProduct } from '../actions'

export function ProductForm({ productId }: { productId: string }) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    return (
        <form
            action={(formData) =>
                startTransition(async () => {
                    await updateProduct(productId, parseFormData(formData))
                    router.refresh() // принудительный re-render текущего роута
                })
            }
        >
            {/* fields */}
        </form>
    )
}
```

`router.refresh()` прогоняет RSC заново; благодаря `updateTag()` свежие данные подтянутся из источника, а не из устаревшего кэша.

С `useActionState` чаще `router.refresh()` не нужен — state обновляется через возвращаемое значение Server Action, и при следующей навигации/обновлении страницы данные уже свежие.

## Полный пример страницы

```tsx
// app/(public)/products/[id]/page.tsx
import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { cache } from 'react'
import { cacheLife, cacheTag } from 'next/cache'
import { getProduct } from '@repo/api/products'
import { products } from '@repo/api/tags'

const loadProduct = cache((id: string) => getProduct({ params: { id } }))

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props) {
    const { id } = await params
    const product = await loadProduct(id)
    return { title: product.name }
}

export default async function ProductPage({ params }: Props) {
    const { id } = await params

    return (
        <>
            {/* Серверный кэш: карточка продукта, одинакова для всех */}
            <Suspense fallback={<ProductDetailsSkeleton />}>
                <ProductDetails productId={id} />
            </Suspense>

            {/* Динамика: персональные рекомендации */}
            <Suspense fallback={<RecommendationsSkeleton />}>
                <Recommendations productId={id} />
            </Suspense>

            {/* Динамика: статус корзины */}
            <Suspense fallback={<CartStatusSkeleton />}>
                <CartStatus productId={id} />
            </Suspense>
        </>
    )
}

async function ProductDetails({ productId }: { productId: string }) {
    'use cache'
    cacheLife('minutes')
    cacheTag(products.productsTag, products.productTag({ productId }))

    const product = await loadProduct(productId)
    return <ProductCard product={product} />
}

async function Recommendations({ productId }: { productId: string }) {
    // per-user, без use cache — рендерится на каждый запрос
    const userId = (await cookies()).get('uid')?.value
    const recs = await getRecommendations({ productId, userId })
    return <RecommendationGrid items={recs} />
}

async function CartStatus({ productId }: { productId: string }) {
    const userId = (await cookies()).get('uid')?.value
    if (!userId) return <AddToCartCta productId={productId} />
    const inCart = await isInCart(userId, productId)
    return inCart ? <InCartBadge /> : <AddToCartCta productId={productId} />
}
```

Карточка кешируется (одинакова для всех, ключ `product-${id}`), рекомендации и статус корзины стримятся per-request. После мутации `addToCart` достаточно вернуть свежий `CartStatus` через `router.refresh()` или дать Server Action`-у `updateTag('cart-${userId}')`.

## Чеклист для новой страницы

1. Определи типы данных: статические / кешированные / динамические.
2. Статический контент — обычный JSX, ничего не делай.
3. Общие данные с TTL → оберни в `use cache` + `cacheLife` + `cacheTag`. Проверь: аргументы функции — **bounded cardinality** (не user id).
4. Per-user данные → async серверный компонент в `<Suspense>`, без `use cache`. Если запрос тяжёлый и оправдывает память — `'use cache: private'`.
5. Каждый блок данных — в свою пару `<ErrorBoundary>` + `<Suspense>` с skeleton-fallback.
6. Фильтры/пагинация → URL state (`searchParams` / `nuqs`), `key` на `<Suspense>` для сброса.
7. Для `generateMetadata` — fetch, обёрнутый в `React.cache()`.
8. Для мутаций — Server Action + `revalidate*()` хелпер из `@repo/api/tags` (или `updateTag()` напрямую, если нужен тег вне OpenAPI). Если нужен мгновенный отклик в UI — `useOptimistic`. Если требуется обновить уже отрендеренный экран — `router.refresh()` после Server Action.
9. На read- и write-стороне используй один и тот же кодогенерируемый тег (`productsTag` / `productTag(...)`) — никаких строковых литералов, чтобы регенерация API ломала билд, а не кэш.
