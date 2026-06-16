# Архитектура

Модульная архитектура для Next.js 16 + React 19 + TypeScript 6 monorepo стартера.
Масштабируется от лендинга до 50+ страниц. Построена на принципах clean architecture, Atomic Design и модели серверных/клиентских компонентов Next.js.

## Слои

Четыре слоя со строгим правилом зависимостей сверху вниз — каждый слой может импортировать только из слоёв ниже.

```
┌─────────────────────────────────────────────────┐
│  app/                        ROUTING LAYER      │
│  Роуты, layouts, pages, loading/error states    │
│  Route-local компоненты в _components/          │
├─────────────────────────────────────────────────┤
│  src/modules/                DOMAIN LAYER       │
│  Shared бизнес-логика между роутами             │
│  auth, cart, realtime, analytics...             │
├─────────────────────────────────────────────────┤
│  src/                        SHARED LAYER       │
│  components, hooks, utils, schemas, masks,      │
│  constants, providers, env, types               │
├─────────────────────────────────────────────────┤
│  packages/*                  INFRASTRUCTURE     │
│  core (дизайн-система), api (codegen),          │
│  logger, metrics, design-tokens, ts-config      │
└─────────────────────────────────────────────────┘
```

### Правила зависимостей

| Откуда           | Может импортировать                   |
| ---------------- | ------------------------------------- |
| `app/`           | `src/modules/`, `src/*`, `packages/*` |
| `src/modules/`   | `src/*` (shared), `packages/*`        |
| `src/*` (shared) | `packages/*`                          |
| `packages/*`     | только другие `packages/*`            |

**Кросс-модульные импорты запрещены.** Модуль никогда не импортирует из другого модуля. Общая логика между модулями спускается в shared-слой.

### Кросс-модульное взаимодействие

Когда модулям нужно общаться (auth проверяет права на действие из realtime, cart реагирует на события из orders), запрещено решать это прямым импортом. Допустимые паттерны:

- **Композиция в layout** — родительский layout/page собирает из обоих модулей и передаёт данные/коллбэки через props. Само взаимодействие живёт в роуте, а не в модулях.
- **Event bus в shared-слое** — `src/utils/events.ts` или подобный pub/sub. Каждый модуль публикует и подписывается на свои события, не зная о других. Подходит для realtime-уведомлений, аналитики.
- **Инверсия через провайдер** — модуль-потребитель принимает зависимость через React Context из родительского провайдера, который собирается в layout уровня приложения.

Если ни один паттерн не подходит — это сигнал, что границы модулей проведены неверно: либо логика должна жить в одном из модулей, либо общая часть выделяется в третий модуль/shared.

### ESLint Enforcement (TODO)

> Правила границ ниже **ещё не внедрены** в `eslint.config.ts`. Текущий конфиг (`@antfu/eslint-config`) проверяет только `no-restricted-imports` для `@repo/*`. Внедрение `eslint-plugin-boundaries` — отдельная задача.

Целевые правила (через `eslint-plugin-boundaries` или `eslint-plugin-import/no-restricted-paths`):

- `src/modules/*` не может импортировать из другого `src/modules/*`
- `src/components/*`, `src/hooks/*`, `src/utils/*` не могут импортировать из `app/`
- `src/modules/*` не может импортировать из `app/`
- `packages/*` не могут импортировать из `src/` или `app/`

---

## Серверные / клиентские границы

**Принцип: Server by default, Client at the leaf.**

Гибридный подход: выносим `'use client'` на минимальную интерактивную часть (leaf-level), но если компонент по сути целиком интерактивный — не дробим искусственно.

### По слоям

| Слой                                         | Server / Client                                                        |
| -------------------------------------------- | ---------------------------------------------------------------------- |
| `packages/core/`                             | **Client** — интерактивные UI-примитивы (Base UI), leaf по определению |
| `packages/api/` хуки                         | **Client** — React Query хуки                                          |
| `packages/api/` fetch-клиенты, Zod           | **Universal** — работают и на сервере                                  |
| `src/components/`                            | **Per-component** — решение по каждому                                 |
| `src/hooks/`                                 | **Client** — хуки требуют state/effects                                |
| `src/providers/`                             | **Client** — контекст = client boundary                                |
| `src/utils/`, `src/constants/`, `src/types/` | **Universal**                                                          |
| `src/schemas/`, `src/masks/`                 | **Universal**                                                          |
| `src/env/server.ts`                          | **Server-only**                                                        |
| `src/env/client.ts`                          | **Universal**                                                          |
| `src/modules/`                               | **Оба типа**, разделённые явно                                         |
| `app/` pages, layouts                        | **Server** — кешируются через `cacheComponents`                        |
| `app/` `_components/`                        | **Per-component**                                                      |

### Суффиксы файлов

| Суффикс      | Значение                                                              |
| ------------ | --------------------------------------------------------------------- |
| `.server.ts` | Server-only (cookies, headers, DB)                                    |
| `.client.ts` | Явно client-only (необязательно при наличии директивы `'use client'`) |
| без суффикса | Universal или определяется по директиве `'use client'`                |

### Правило принятия решения

```
Компонент использует state, effects, event handlers или browser API?
  Да  → 'use client', изолировать минимально
  Нет → Server component (кешируется бесплатно через cacheComponents)

Серверный компонент содержит интерактивную часть?
  → Вынести интерактивность в отдельный клиентский leaf
  → Серверная обёртка передаёт данные через props/children (composition)
```

### Пример: серверная обёртка с клиентским leaf

```tsx
// product-card.tsx (Server — кешируется)
import { AddToCartButton } from './add-to-cart-button'

export function ProductCard({ product }) {
    return (
        <div>
            <ProductImage src={product.image} /> {/* Server */}
            <ProductInfo product={product} /> {/* Server */}
            <AddToCartButton id={product.id} /> {/* Client leaf */}
        </div>
    )
}
```

---

## Routing Layer — `app/`

Компоненты и логика живут рядом с роутом, который их использует (colocation).
Next.js игнорирует директории с префиксом `_` при роутинге.

```
app/
├── layout.tsx                            # Root layout (Server)
├── (public)/
│   └── catalog/
│       ├── page.tsx                      # Server component
│       ├── layout.tsx
│       ├── loading.tsx
│       ├── error.tsx
│       ├── schemas.ts                    # Схемы роута (shared между _components)
│       ├── constants.ts                  # Константы роута
│       └── _components/
│           ├── catalog-grid/
│           │   ├── catalog-grid.tsx      # Server
│           │   ├── catalog-grid.test.tsx
│           │   ├── catalog-grid.stories.tsx
│           │   ├── variants.ts
│           │   ├── types.ts
│           │   └── index.ts
│           └── catalog-filters/
│               ├── catalog-filters.tsx   # Client
│               ├── catalog-filters.test.tsx
│               ├── hooks/
│               │   └── use-filter-state.ts
│               ├── utils/
│               │   └── parse-filters.ts
│               ├── types.ts
│               └── index.ts
```

`_components/` — единственная private-директория в сегменте роута. Shared-код роута (схемы, константы, утилиты общие между компонентами роута) лежит как файлы непосредственно в сегменте роута.

### Структура файлов компонента (стандарт)

Kebab-case для файлов, PascalCase для экспортов.

```
component-name/
├── component-name.tsx           # Реализация компонента
├── component-name.test.tsx      # Тесты
├── component-name.stories.tsx   # Storybook story
├── variants.ts                  # CVA варианты (если есть)
├── types.ts                     # Типы (если нетривиальные)
├── hooks/                       # Хуки компонента
├── utils/                       # Утилиты компонента
└── index.ts                     # Re-export
```

Файлы создаются по необходимости — не нужно scaffoldить пустые `variants.ts` или `types.ts`.

---

## Shared Layer — `src/components/`

Группировка по назначению, вдохновлена категориями MUI/Ant Design.

**Atomic Design маппинг:** атомы и молекулы живут в `packages/core/`, организмы и выше — в `src/components/`.

```
src/components/
├── layout/              # Структура страницы
│   ├── page-container/  #   Server
│   ├── header/          #   Server + client leaves (меню, поиск)
│   ├── footer/          #   Server
│   ├── sidebar/         #   Client — collapsible state
│   └── section/         #   Server
│
├── data-display/        # Отображение данных
│   ├── data-table/      #   Client — сортировка, пагинация, фильтры
│   ├── stat-card/       #   Server
│   ├── empty-state/     #   Server
│   └── key-value/       #   Server
│
├── forms/               # Составные форм-элементы
│   ├── form-section/    #   Server — группировка полей с заголовком
│   ├── search-input/    #   Client — debounce + state
│   └── file-upload/     #   Client — drag & drop
│
├── feedback/            # Обратная связь пользователю
│   ├── alert/           #   Server
│   ├── confirm-dialog/  #   Client
│   └── loading-overlay/ #   Client
│
├── navigation/          # Навигация
│   ├── breadcrumbs/     #   Server
│   ├── pagination/      #   Client
│   └── nav-menu/        #   Client
│
├── providers/           # Инфраструктурные / фреймворковые провайдеры
│   └── query-provider/  #   QueryClient + ReactQueryStreamedHydration — точка входа
│                         #   streaming-префетча, см. cache-and-streaming.md
│                         #   Сюда же: NuqsAdapter, ThemeProvider, Sentry boundary.
│                         #   Доменные провайдеры (auth, sockets) → src/modules/*/provider/
│
└── utilities/           # Служебные компоненты
    ├── error-boundary/
    └── responsive/
```

**Правило категоризации:** компонент попадает в категорию по его основной функции, а не по месту использования.

**Новая категория:** когда 3+ компонентов не ложатся ни в одну существующую.

### Инфраструктурный vs доменный провайдер

Критерий разделения:

| Свойство                                               | Инфраструктурный (`src/components/providers/`)  | Доменный (`src/modules/*/provider/`)             |
| ------------------------------------------------------ | ----------------------------------------------- | ------------------------------------------------ |
| Знает о бизнес-сущностях                               | Нет (User, Order, Product не упоминаются)       | Да                                               |
| Настраивает фреймворк / SDK                            | Да (React Query, Sentry, Theme, nuqs)           | Не обязательно                                   |
| Можно вынуть в отдельный пакет npm без знания о домене | Да                                              | Нет                                              |
| Пример                                                 | `QueryProvider`, `ThemeProvider`, `NuqsAdapter` | `AuthProvider`, `SocketProvider`, `CartProvider` |

Если провайдер начинает получать props с доменными типами (`<XProvider currentUser={user}>`) — он стал доменным, переезжает в модуль.

---

## Shared Layer — `src/utils/`

Группировка по типу операции. Утилита — это чистая функция без побочных эффектов, universal (server + client).

**Исключение — фабрики стейта.** `get-query-client.ts` и аналогичные фабрики (Zustand store factory, OTEL provider factory) допускаются здесь, несмотря на singleton-state и server/client разветвление. Критерий: фабрика не имеет бизнес-логики, её цель — отдать настроенный примитив инфраструктурного слоя. Альтернативное расположение — `src/query/`, если число таких фабрик вырастет до 3+.

```
src/utils/
├── cn.ts                    # Tailwind merge (clsx + twMerge)
├── get-query-client.ts      # React Query factory (исключение, см. выше)
├── get-url.ts               # URL helper
├── wait.ts                  # Promise delay
├── format/                  # Форматирование
│   ├── currency.ts
│   ├── date.ts
│   ├── number.ts
│   └── phone.ts
├── string/                  # Строковые операции
│   ├── pluralize.ts
│   └── truncate.ts
├── array/                   # Массивы
│   └── group-by.ts
└── url/                     # URL / query params
    └── build-query.ts
```

**Правило:** доменные функции идут в `src/modules/*/utils/`. Группировка в подпапку — когда 2+ файлов одной темы. До этого — плоский файл в корне `utils/`.

---

## Shared Layer — `src/constants/`

Группировка по домену:

```
src/constants/
├── env.ts               # isDev, isProd, isBrowser
├── routes.ts            # Route paths как типизированные константы
├── media.ts             # Breakpoints, media queries
├── date.ts              # Форматы дат, locale-константы
└── index.ts
```

**Правило:** константа модуля → `src/modules/*/constants.ts`. Константа роута → `app/.../constants.ts`. Shared → `src/constants/`.

---

## Shared Layer — `src/masks/`

Маски ввода — UI-логика форматирования (позиция курсора, частичный ввод, paste handling). Отдельно от utils.

```
src/masks/
├── phone.ts             # +7 (___) ___-__-__
├── date.ts              # DD.MM.YYYY
├── currency.ts          # 1 000 000,00
├── card-number.ts       # ____ ____ ____ ____
├── types.ts             # MaskConfig, MaskFn
└── index.ts
```

**Почему не `packages/core/`:** маски зависят от бизнес-контекста (формат телефона, валюта), а дизайн-система — нет.

**Почему не `src/utils/`:** маски — это поведение ввода, а не чистое форматирование.

---

## Shared Layer — `src/schemas/`

Shared Zod-схемы валидации, переиспользуемые между роутами/модулями.

```
src/schemas/
├── user.ts              # userSchema, emailSchema, passwordSchema
├── address.ts           # addressSchema, zipCodeSchema
├── pagination.ts        # paginationSchema (page, limit, sort)
├── common.ts            # dateRangeSchema, phoneSchema, moneySchema
└── index.ts
```

Размещение регулируется общим правилом продвижения (см. ниже). Особый случай — схемы, автогенерируемые из OpenAPI: они живут в `packages/api/codegen/zod/` и никогда не копируются в `src/schemas/`.

---

## Правило продвижения (Promotion Rule)

Единое правило для hooks, utils, schemas, constants, masks. Когда код используется шире — продвигаем вверх:

| Область                           | Расположение                                                                                | Пример                                  |
| --------------------------------- | ------------------------------------------------------------------------------------------- | --------------------------------------- |
| 1 компонент                       | Колокация: `component-name/hooks/`, `component-name/utils/`                                 | `data-table/hooks/use-sort.ts`          |
| 1 роут                            | `app/.../_components/*/` или файлы в сегменте: `app/.../schemas.ts`, `app/.../constants.ts` | `app/(public)/catalog/schemas.ts`       |
| 1 модуль                          | Уровень модуля: `src/modules/*/hooks/`, `src/modules/*/utils/`, `src/modules/*/schemas.ts`  | `src/modules/auth/hooks/use-session.ts` |
| 2+ модулей или shared-компонентов | Shared: `src/hooks/`, `src/utils/`, `src/schemas/`, `src/masks/`, `src/constants/`          | `src/schemas/pagination.ts`             |
| Автогенерация из OpenAPI          | `packages/api/codegen/` (никогда не копируется в `src/`)                                    | `packages/api/codegen/zod/`             |

**Принцип:** код стартует в самой узкой области и поднимается _по факту_ появления второго потребителя — не на опережение.

---

## Domain Layer — `src/modules/`

Модуль — это автономная единица бизнес-логики. Содержит доменные компоненты, хуки, утилиты, сторы, схемы и типы.

### Правила модулей

- Модуль **никогда** не импортирует из другого модуля
- Общая логика между модулями → shared-слой (`src/hooks/`, `src/utils/` и т.д.)
- Модуль создаётся когда бизнес-логика используется в 2+ роутах
- Логика, используемая в 1 роуте, остаётся в `app/.../_components/`
- `index.ts` = публичный API модуля, внутренние файлы — implementation detail

### Пример: auth (CASL abilities)

```
src/modules/auth/
├── components/
│   ├── auth-guard.tsx                # Server — проверяет сессию, рендерит children
│   └── login-form/
│       ├── login-form.tsx            # Client
│       ├── hooks/
│       │   └── use-login.ts
│       └── index.ts
├── abilities/
│   ├── define-abilities.ts           # defineAbilityFor(user) → AppAbility
│   ├── subjects.ts                   # type Subjects = 'Article' | 'Comment' | ...
│   └── actions.ts                    # type Actions = 'create' | 'read' | 'update' | 'delete' | 'manage'
├── hooks/
│   ├── use-session.ts                # Client — подписка на сессию
│   └── use-ability.ts                # Client — useAbility() из CASL React
├── utils/
│   ├── permissions.ts                # checkPermission, canAccess (обёртка над CASL)
│   └── session.server.ts             # Server-only
├── schemas.ts
├── constants.ts                      # ROLES, TOKEN_TTL
├── types.ts                          # Session, Role, Permission, AppAbility
└── index.ts
```

### Пример: realtime (Socket.IO)

```
src/modules/realtime/
├── provider/
│   ├── socket-provider.tsx           # Client — socket instance в контексте
│   └── index.ts
├── hooks/
│   ├── use-socket.ts                 # Client — доступ к socket instance из контекста
│   ├── use-socket-event.ts           # Client — useSocketEvent('order:updated', handler)
│   └── use-socket-emit.ts            # Client — useSocketEmit('order:create', payload)
├── utils/
│   ├── create-socket.ts              # Фабрика socket instance с логикой reconnect
│   └── socket.server.ts              # Server-side emit (API routes → broadcast)
├── constants.ts                      # EVENTS, NAMESPACES, RECONNECT_INTERVAL
├── types.ts                          # ServerToClientEvents, ClientToServerEvents
└── index.ts
```

### Пример: использование модулей в роуте

```tsx
// app/layout.tsx (Server)
import { SocketProvider } from '#/modules/realtime'
import { AbilityProvider } from '#/modules/auth'

export default function Layout({ children }) {
    return (
        <AbilityProvider>
            <SocketProvider>{children}</SocketProvider>
        </AbilityProvider>
    )
}
```

```tsx
// app/(public)/orders/_components/order-list/order-list.tsx (Client)
import { useSocketEvent } from '#/modules/realtime'
import { useAbility } from '#/modules/auth'

function OrderList() {
    const ability = useAbility()
    useSocketEvent('order:updated', (order) => {
        /* ... */
    })

    if (ability.cannot('read', 'Order')) return null
    // ...
}
```

---

## Управление состоянием

| Тип состояния                  | Инструмент            | Расположение                  |
| ------------------------------ | --------------------- | ----------------------------- |
| Серверные данные (API)         | React Query           | `packages/api/codegen/hooks/` |
| URL state (фильтры, пагинация) | nuqs                  | В компоненте                  |
| Формы                          | React Hook Form + Zod | В компоненте формы            |
| Глобальный UI state            | Zustand               | `src/modules/*/store/`        |
| Scoped state (тема, сокеты)    | React Context         | `src/modules/*/provider/`     |
| Локальный state                | useState / useReducer | В компоненте                  |

### Zustand-стор внутри модуля

```
src/modules/cart/
├── store/
│   ├── cart-store.ts              # create store, actions, selectors
│   ├── cart-store.test.ts
│   └── index.ts
├── hooks/
│   └── use-cart-totals.ts         # Derived — стор + вычисления
├── utils/
│   └── calculate-totals.ts
├── types.ts
└── index.ts
```

**Правила:**

- Один стор на модуль, не на компонент
- Стор экспортируется через `index.ts` как часть публичного API модуля
- Если стор нужен только в одном роуте → `app/.../_components/*/store/`
- Selectors внутри стора для оптимизации ре-рендеров

---

## Дополнительные заметки

### `src/proxy/`

Часть shared-слоя. Используется только корневым `proxy.ts` и API route handlers. Модули и компоненты из него не импортируют. См. [BFF Proxy документацию](bff-proxy.md).

### `src/fonts/`

Существующая директория (шрифты Geist). Импортируется из root layout. Остаётся как есть.

---

## Полная карта директорий `src/`

```
src/
├── components/              # Shared UI по категориям (организмы+)
│   ├── layout/
│   ├── data-display/
│   ├── forms/
│   ├── feedback/
│   ├── navigation/
│   ├── providers/
│   └── utilities/
├── modules/                 # Доменная бизнес-логика
│   ├── auth/
│   ├── cart/
│   ├── realtime/
│   └── ...
├── hooks/                   # Shared хуки
├── utils/                   # Чистые утилиты (по типу операции)
├── masks/                   # Маски ввода
├── schemas/                 # Shared Zod-схемы
├── constants/               # Shared константы (по домену)
├── env/                     # Zod-validated env vars
├── proxy/                   # BFF proxy pipeline
├── fonts/                   # Шрифты (Geist)
├── styles/                  # Tailwind globals
├── types/                   # Глобальные type declarations
└── tests/                   # E2E тесты
```
