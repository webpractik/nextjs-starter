# Архитектура

> Тип: объяснение + правила · Статус: актуально · Источник истины: дерево репозитория,
> `tsconfig.json`, `next.config.ts` и `AGENTS.md`

Проект — ESM-монорепозиторий на npm workspaces. Next.js приложение находится в корне, reusable
packages — в `packages/`. Архитектура использует принцип «самая узкая подходящая область»: код
поднимается выше только после появления реального второго потребителя.

## Слои и направление зависимостей

```text
app/                  routing и композиция страниц
  ↓
src/modules/          доменная логика для нескольких routes (создаётся по необходимости)
  ↓
shared src/*          общие компоненты и инфраструктура приложения
  ↓
packages/*            переиспользуемые package APIs
```

| Слой           | Может зависеть от                                |
| -------------- | ------------------------------------------------ |
| `app/`         | `src/modules/`, shared `src/*`, `packages/*`     |
| `src/modules/` | shared `src/*`, `packages/*`                     |
| shared `src/*` | `packages/*`                                     |
| `packages/*`   | других `packages/*`, внешних библиотек и runtime |

`src/modules/` сейчас отсутствует: это предусмотренная точка роста, а не обязательный scaffold.
Модуль создаётся, когда одна доменная возможность реально обслуживает два и более routes. Модули
не импортируют друг друга напрямую; композиция выполняется в route/layout или через узкий shared
contract.

### Известное нарушение границы

`packages/api/fetch.client.ts` сейчас импортирует root-level `src/env`, `src/constants` и
`src/mock-mode`. Это связывает `@repo/api` с конкретным приложением и противоречит целевому правилу
для packages. Нарушение оставлено как известный технический долг: не копируйте этот паттерн в
другие packages. Исправление требует отдельного решения о dependency injection или переносе
transport adapter в application layer.

Границы пока не полностью контролируются Oxlint, поэтому их нужно проверять на review.

## Фактическая карта

```text
app/
├── (public)/                 публичные pages, loading/error states, route-local UI
├── api/                      health, readiness, metrics и gated cache probe
├── layout.tsx                глобальные providers и document shell
└── global-error.tsx          корневая error boundary

src/
├── cache/                    server-only Valkey handler для Cache Components
├── components/               shared составные компоненты и providers
├── constants/                общие константы runtime
├── env/                      server/client environment schemas
├── fonts/                    локальные font assets и setup
├── hooks/                    shared client hooks
├── mock-mode/                runtime выбор generated mocks
├── observability/            Adze logger и Prometheus registry
├── proxy/                    Next.js Proxy pipeline
├── styles/                   глобальные Tailwind styles
├── tests/                    test setup, browser aliases и Playwright E2E
├── types/                    глобальные declarations
└── utils/                    shared utilities

packages/
├── api/                      OpenAPI sources, Kubb, clients, schemas и mocks
└── core/                     Base UI/shadcn-style primitives и typed forms
```

Не выдавайте примеры будущих каталогов за существующую архитектуру. CASL, Socket.IO, Zustand и
другие domain libraries в starter не установлены.

## Как выбрать место для кода

| Область использования         | Размещение                                     |
| ----------------------------- | ---------------------------------------------- |
| Один компонент                | Рядом с компонентом                            |
| Один route/segment            | `app/.../_components/` или файл в этом segment |
| Одна доменная возможность     | Route-local, пока нет второго route            |
| Два и более routes            | `src/modules/<name>/`                          |
| Несколько модулей/общий infra | Подходящий shared каталог `src/*`              |
| Независимый reusable UI       | `packages/core/`                               |
| API contract/generated API    | `packages/api/`                                |

Route-local private компоненты находятся в единственной директории `_components/` своего
segment. Schema, constants или utilities, общие только для этого segment, остаются рядом с route.
Не создавайте пустые `types.ts`, `hooks/`, `utils/` и `variants.ts` заранее.

`index.ts` определяет публичный API области. Внешний код должен импортировать через public export,
а не deep import во внутреннюю реализацию, кроме generated API, где конкретные paths являются
частью текущего output contract.

## Server и Client Components

Базовый режим — Server Component. `'use client'` добавляется на минимальном интерактивном листе,
которому нужны state, effects, event handlers, browser API или client-only library.

| Область                                   | Граница                                               |
| ----------------------------------------- | ----------------------------------------------------- |
| `app/` pages/layouts                      | Server по умолчанию                                   |
| `packages/core/` interactive primitives   | Client API                                            |
| Generated React Query hooks               | Client API                                            |
| Generated models, Zod и fetch clients     | Universal, пока caller не добавил server-only context |
| Valkey handler из `src/cache/`            | Только server                                         |
| `src/env/server.ts`                       | Только server                                         |
| `src/env/client.ts`                       | Допустим в client bundle                              |
| `src/components/providers/query-provider` | Client boundary                                       |
| Чистые `src/utils`                        | Universal                                             |

Server Component может импортировать и рендерить Client Component. Обратный импорт server-only
модуля из Client Component запрещён. Serializable data передаётся через props; secrets и server
environment не пересекают client boundary.

Для явных ограничений используйте суффиксы `.server.ts` и `.client.ts`. Universal-файлам суффикс
не нужен.

## Packages

### `@repo/core`

Здесь находятся reusable UI primitives без знания бизнес-сущностей. Base UI оборачивается тонко с
сохранением accessibility semantics. Варианты оформляются через CVA, classes объединяются через
`cn`. Stories и browser component tests располагаются рядом с компонентом.

Typed forms экспортируются из `@repo/core/form`. `useAppForm` регистрирует общие field components и
`SubmitButton`; Zod передаётся TanStack Form напрямую через Standard Schema. Составная форма с
бизнес-правилами остаётся в route или domain module, а не переносится в `core`.

### `@repo/api`

`openapi/` — источник истины, `codegen/` — коммитимый generated output, `bundled.yaml` —
игнорируемый промежуточный файл. Generated code не редактируется вручную. React Query hooks —
client-facing слой; fetch clients/Zod/models могут использоваться на сервере. Подробнее — в
[API codegen](api-codegen.md).

## Данные и состояние

| Задача                            | Текущий инструмент                         |
| --------------------------------- | ------------------------------------------ |
| Server rendering и server cache   | Async Server Components + Cache Components |
| Shared cache обычного `use cache` | `cacheHandlers.default` + Valkey           |
| Client server-state               | TanStack Query                             |
| URL filters/navigation state      | nuqs                                       |
| Forms                             | TanStack Form + Zod                        |
| Локальная интерактивность         | React state/reducer                        |

Cache Components и React Query сосуществуют. Выбор зависит от места потребления и требований к
интерактивности, а не от универсального запрета одного подхода. Правила — в
[cache-and-streaming.md](cache-and-streaming.md).

## Cross-cutting инфраструктура

- `src/env/` валидирует server и browser-visible environment; `next.config.ts` импортирует обе
  схемы, поэтому ошибки могут возникнуть до компиляции.
- `proxy.ts` собирает pipeline из `src/proxy/` и добавляет `x-url`, необходимый runtime mock mode.
- `src/observability/` содержит единственные application logger и Prometheus registry.
- `instrumentation.ts` регистрирует OTEL и server Sentry; client Sentry запускается только в
  production.
- Root layout содержит Nuqs adapter, Query provider, Toaster и development Form Devtools provider.

## Именование и imports

- Файлы и директории компонентов — kebab-case; React exports — PascalCase.
- `~/*` указывает на корень, `@/*` — на `app/`, `#/*` — на `src/`.
- Packages импортируются через `@repo/core` и `@repo/api`, не через `~/packages/...`.
- Type-only imports отделяются через `import type`.
- Server/client граница важнее удобства короткого import path.

## Чеклист архитектурного review

1. Код начинается в самой узкой реальной области?
2. Новый shared/module/package имеет минимум два фактических потребителя?
3. Зависимость направлена вниз и не создаёт новый cross-module import?
4. Client boundary не поднята выше интерактивного листа без необходимости?
5. Server secrets и `src/env/server.ts` не попали в client graph?
6. Generated output изменён через source/config и повторный `gen`?
7. Новое публичное поведение отражено в профильной документации?
