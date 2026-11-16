---
type: reference
title: Официальные источники Cache Components и Partial Prefetching
description: Тематический каталог актуальных официальных руководств Next.js App Router, API кеширования и предзагрузки, диагностик, миграций и release notes для версии 16.4.6.
tags: [nextjs, app-router, cache-components, partial-prefetching, sources]
verified:
  - by: openwiki/0.7.2
    at: 2026-11-16T15:55:30.306Z
sources:
  - id: openwiki-source-50a18d054b596a7ed0eeffb0
    resource: repo://next.config.ts
  - id: openwiki-source-5093b074f16e0b77479219b2
    resource: repo://package-lock.json
  - id: openwiki-source-5b54a58d1b51cd490b0e7162
    resource: repo://package.json
generated: { by: "codex", at: "2026-11-16T15:55:30.306Z" }
---

# Официальные источники Cache Components и Partial Prefetching

Проверено 16 ноября 2026 года для Next.js 16.4.6 из `package.json` и `package-lock.json`.
В проекте обе возможности включены в `next.config.ts`.
В каталоге собраны руководства по этим возможностям и связанным контрактам App Router.
Страницы Pages Router, кеш сборки CI и Turbopack не входят в эту модель runtime-кеширования.

Краткие описания находятся в справочниках
[Cache Components](next-cache-components.md) и [Partial Prefetching](next-partial-prefetching.md).
Примеры интеграции SDK и TanStack Query находятся на странице
[кеширования и streaming проекта](cache-and-streaming.md).

## Версия и происхождение

| Источник                                                                                                               | Назначение                                                                                  |
| ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| [Официальный индекс документации](https://nextjs.org/docs/llms.txt)                                                    | Обнаружение текущих canonical URL и страниц, добавленных после последнего обновления базы   |
| [Документация тега v16.4.6](https://github.com/vercel/next.js/tree/v16.4.6/docs/01-app)                                | Воспроизводимый снимок, совпадающий с версией проекта                                       |
| [Caching в теге v16.4.6](https://github.com/vercel/next.js/blob/v16.4.6/docs/01-app/01-getting-started/08-caching.mdx) | Основное описание модели для установленной версии                                           |
| [Исходники runtime v16.4.6](https://github.com/vercel/next.js/tree/v16.4.6/packages/next/src)                          | Уточнение поведения, когда prose и фактическая версия расходятся                            |
| `node_modules/next/dist/docs/`                                                                                         | Доступный локально Markdown из установленного пакета; не коммитится в wiki отдельной копией |

Ссылки `nextjs.org/docs/app/` указывают на изменяемую текущую документацию.
Тег GitHub фиксирует версию. Ветка `canary` и исторические preview-статьи не определяют контракт
установленного пакета. В каталоге приведены краткие аннотации. Полные тексты
остаются у владельца документации.

## Основные руководства

| Официальная страница                                                                              | Что она покрывает                                                                          |
| ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| [Caching](https://nextjs.org/docs/app/getting-started/caching)                                    | Включение Cache Components, кеш данных и UI, runtime APIs, prerendering и prefetching      |
| [Revalidating](https://nextjs.org/docs/app/getting-started/revalidating)                          | Временное и явное обновление, профили lifetime и выбор API после мутации                   |
| [Migrating to Cache Components](https://nextjs.org/docs/app/guides/migrating-to-cache-components) | Замена route configs, fetch options, unstable_cache, React.cache и динамических параметров |
| [Adopting Partial Prefetching](https://nextjs.org/docs/app/guides/adopting-partial-prefetching)   | Глобальное и поэтапное включение, перенос прежних full prefetch и сохранение нужного UI    |
| [Optimizing prefetching](https://nextjs.org/docs/app/guides/optimizing-prefetching)               | URL data, сессионная оболочка, стадии shell/prefetch/navigation и стоимость server render  |
| [Optimizing the static shell](https://nextjs.org/docs/app/guides/optimizing-the-static-shell)     | Состав полезного shell первого открытия и размещение Suspense                              |
| [Instant navigation](https://nextjs.org/docs/app/guides/instant-navigation)                       | Доступный немедленно UI, dev validation, Navigation Inspector и E2E instant()              |
| [Keeping pages static](https://nextjs.org/docs/app/guides/keeping-pages-static)                   | Требования ensureStatic для оболочки, per-link prefetch и полного маршрута                 |
| [Prefetching](https://nextjs.org/docs/app/guides/prefetching)                                     | Автоматический и ручной prefetch, scheduling, hover, отмена и побочные эффекты             |
| [Linking and navigating](https://nextjs.org/docs/app/getting-started/linking-and-navigating)      | Общая модель переходов, медленные сети, streaming и loading states                         |
| [Streaming](https://nextjs.org/docs/app/guides/streaming)                                         | Потоковый HTML/RSC и независимые Suspense-границы                                          |
| [Preserving UI state](https://nextjs.org/docs/app/guides/preserving-ui-state)                     | React Activity, скрытые маршруты, effects и тестирование видимого UI                       |
| [Glossary](https://nextjs.org/docs/app/glossary)                                                  | Static shell, App Shell, URL data, navigation stages, client cache и PPR                   |

## Директивы и функции

| API                                                                                                | Основной контракт                                                                        |
| -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| [use cache](https://nextjs.org/docs/app/api-reference/directives/use-cache)                        | Async scopes, ключи, сериализация, вложенность, runtime storage и ограничения            |
| [use cache: remote](https://nextjs.org/docs/app/api-reference/directives/use-cache-remote)         | Общий durable cache, платформенные handlers, цена сетевого lookup                        |
| [use cache: private](https://nextjs.org/docs/app/api-reference/directives/use-cache-private)       | Request APIs, production request deduplication и браузерный кеш; отдельная dev-семантика |
| [cacheLife](https://nextjs.org/docs/app/api-reference/functions/cacheLife)                         | stale/revalidate/expire, presets, пороги prerender/App Shell и вложенные сроки           |
| [cacheTag](https://nextjs.org/docs/app/api-reference/functions/cacheTag)                           | Назначение тегов, ограничения количества и длины                                         |
| [updateTag](https://nextjs.org/docs/app/api-reference/functions/updateTag)                         | Немедленное истечение в Server Action для read-your-own-writes                           |
| [revalidateTag](https://nextjs.org/docs/app/api-reference/functions/revalidateTag)                 | SWR, profile/expire, webhook и deprecated форма без второго аргумента                    |
| [revalidatePath](https://nextjs.org/docs/app/api-reference/functions/revalidatePath)               | Инвалидация page/layout; отличие пути от прикладного тега                                |
| [refresh](https://nextjs.org/docs/app/api-reference/functions/refresh)                             | Обновление client router из Server Action                                                |
| [useRouter](https://nextjs.org/docs/app/api-reference/functions/use-router)                        | router.prefetch, onInvalidate, refresh, переходы и безопасность URL                      |
| [prefetch](https://nextjs.org/docs/app/api-reference/functions/prefetch)                           | await prefetch() из next/cache как граница до per-link prefetch или navigation           |
| [navigation](https://nextjs.org/docs/app/api-reference/functions/navigation)                       | await navigation() для выполнения только при переходе                                    |
| [io](https://nextjs.org/docs/app/api-reference/functions/io)                                       | Синхронные часы, random и I/O, исключаемые из prerendering                               |
| [connection](https://nextjs.org/docs/app/api-reference/functions/connection)                       | Ожидание реального запроса и исключение продолжения из prerendering                      |
| [generateStaticParams](https://nextjs.org/docs/app/api-reference/functions/generate-static-params) | Известные параметры, build-time генерация и ограничения Cache Components                 |
| [next/root-params](https://nextjs.org/docs/app/api-reference/functions/next-root-params)           | Доступ к корневым параметрам и их участие в ключе cached scope                           |
| [cookies](https://nextjs.org/docs/app/api-reference/functions/cookies)                             | Чтение/изменение cookies и влияние на клиентский кеш                                     |
| [headers](https://nextjs.org/docs/app/api-reference/functions/headers)                             | Request headers и ограничения общего кеширования                                         |
| [draftMode](https://nextjs.org/docs/app/api-reference/functions/draft-mode)                        | Request-time preview и взаимодействие с кешем                                            |

`prefetch()` из `next/cache`, `router.prefetch()` и prop `prefetch` у Link являются разными API.
Имена route export `prefetch` и импортируемой функции могут конфликтовать; официальный справочник
показывает импорт функции под другим именем.

## Конфигурация, файлы и компоненты

| Справочник                                                                                                                             | Что проверять                                                                          |
| -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| [cacheComponents](https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents)                                     | Флаг верхнего уровня, Node.js, PPR и Activity                                          |
| [partialPrefetching](https://nextjs.org/docs/app/api-reference/config/next-config-js/partialPrefetching)                               | Зависимость от cacheComponents, false/unset и общий App Shell                          |
| [cacheLife config](https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheLife)                                          | Пользовательские и переопределённые lifetime-профили                                   |
| [cacheHandlers](https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheHandlers)                                         | Handler API директив, soft tags, согласованность и remote storage                      |
| [cacheMaxMemorySize](https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheMaxMemorySize)                               | Размер локального кеша экземпляра                                                      |
| [deploymentId](https://nextjs.org/docs/app/api-reference/config/next-config-js/deploymentId)                                           | Версии deployment, cache keys и защита от version skew                                 |
| [staleTimes](https://nextjs.org/docs/app/api-reference/config/next-config-js/staleTimes)                                               | Экспериментальная глобальная настройка client cache, не срок server cache              |
| [prefetchInlining](https://nextjs.org/docs/app/api-reference/config/next-config-js/prefetchInlining)                                   | Экспериментальное переопределение встроенного объединения небольших prefetch responses |
| [exposeTestingApiInProductionBuild](https://nextjs.org/docs/app/api-reference/config/next-config-js/exposeTestingApiInProductionBuild) | Экспериментальный API только для отдельной тестовой production-сборки                  |
| [Link](https://nextjs.org/docs/app/api-reference/components/link)                                                                      | Native prop prefetch, scroll, client navigation и onNavigate                           |
| [useLinkStatus](https://nextjs.org/docs/app/api-reference/functions/use-link-status)                                                   | Индикатор ожидающего перехода                                                          |
| [loading](https://nextjs.org/docs/app/api-reference/file-conventions/loading)                                                          | Segment fallback, prefetch, streaming, metadata и status codes                         |
| [Route Segment Config](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config)                                | Доступные экспорты и совместимость с Cache Components                                  |
| [prefetch segment config](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config/prefetch)                    | partial/force-disabled, destination overrides и границы действия                       |
| [instant segment config](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config/instant)                      | Проверка мгновенной навигации, severity и dev-only ограничения                         |
| [ensureStatic](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config/ensureStatic)                           | Статичность стадий shell/prefetch/navigation и конфликты exports                       |
| [Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers)                                                           | Prerender GET при Cache Components и кешируемые вспомогательные функции                |

## Авторизация, данные и эксплуатация

| Руководство                                                                                                         | Область применения                                                                |
| ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| [Authentication with Cache Components](https://nextjs.org/docs/app/guides/authentication-with-cache-components)     | Session helpers, private scopes, Suspense, login/logout и session-derived data    |
| [Authentication](https://nextjs.org/docs/app/guides/authentication)                                                 | Аутентификация, авторизация и серверная проверка прав                             |
| [Data security](https://nextjs.org/docs/app/guides/data-security)                                                   | Server-only доступ и предотвращение передачи чувствительных данных клиенту        |
| [Fetching data](https://nextjs.org/docs/app/getting-started/fetching-data)                                          | Parallel reads, preload и устранение waterfalls                                   |
| [Mutating data](https://nextjs.org/docs/app/getting-started/mutating-data)                                          | Server Functions, формы и обновление интерфейса                                   |
| [Server Actions](https://nextjs.org/docs/app/guides/server-actions)                                                 | Сетевая модель мутаций, roundtrip, безопасность и интеграция кеша                 |
| [Client-side data fetching](https://nextjs.org/docs/app/guides/client-side-data-fetching)                           | Граница server/client cache и начальные данные                                    |
| [TanStack Query](https://nextjs.org/docs/app/guides/client-side-data-fetching/tanstack-query)                       | Query cache, initial data и согласование с серверным кешем                        |
| [ISR with Cache Components](https://nextjs.org/docs/app/guides/incremental-static-regeneration-cache-components)    | Listed/unlisted paths, сохранение результата и обновление после первого посещения |
| [How revalidation works](https://nextjs.org/docs/app/guides/how-revalidation-works)                                 | Explicit/soft tags, HTML/RSC, multi-instance coordination и деградация            |
| [Self-hosting](https://nextjs.org/docs/app/guides/self-hosting)                                                     | Reverse proxy, streaming, несколько экземпляров и deployment coordination         |
| [CDN caching](https://nextjs.org/docs/app/guides/cdn-caching)                                                       | Вариативность ответа, ключи CDN и текущие ограничения                             |
| [Implementing PPR in an adapter](https://nextjs.org/docs/app/api-reference/adapters/implementing-ppr-in-an-adapter) | Fallback output и hooks для платформенного адаптера                               |
| [Runtime integration](https://nextjs.org/docs/app/api-reference/adapters/runtime-integration)                       | Связь build adapter и runtime cache interfaces                                    |

## Диагностики и ошибки

Таблица содержит ссылки на объяснения ошибок из основных руководств.
Выбор исправления зависит от того, что должно оставаться в shell и что может ждать запроса.

| Диагностика                                                                                                 | Проверяемая граница                                                 |
| ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| [blocking-prerender-dynamic](https://nextjs.org/docs/messages/blocking-prerender-dynamic)                   | Некешируемый async I/O без подходящего fallback                     |
| [blocking-prerender-runtime](https://nextjs.org/docs/messages/blocking-prerender-runtime)                   | Request APIs блокируют prerender                                    |
| [blocking-prerender-random](https://nextjs.org/docs/messages/blocking-prerender-random)                     | Синхронная недетерминированная операция                             |
| [blocking-prerender-client-hook](https://nextjs.org/docs/messages/blocking-prerender-client-hook)           | Клиентский hook блокирует немедленный UI                            |
| [blocking-prerender-metadata-runtime](https://nextjs.org/docs/messages/blocking-prerender-metadata-runtime) | Runtime data в metadata                                             |
| [instant-shell-url-data](https://nextjs.org/docs/messages/instant-shell-url-data)                           | URL data блокирует общий App Shell                                  |
| [instant-link-prefetch-partial](https://nextjs.org/docs/messages/instant-link-prefetch-partial)             | Ссылка запрашивает per-link prefetch на ещё не принятом destination |
| [instant-navigation-stage](https://nextjs.org/docs/messages/instant-navigation-stage)                       | Данные не соответствуют выбранной стадии навигации                  |
| [instant-navigation-stage-metadata](https://nextjs.org/docs/messages/instant-navigation-stage-metadata)     | Стадия выполнения metadata                                          |
| [instant-navigation-stage-viewport](https://nextjs.org/docs/messages/instant-navigation-stage-viewport)     | Стадия выполнения viewport                                          |
| [static-route-runtime](https://nextjs.org/docs/messages/static-route-runtime)                               | Request data нарушает ensureStatic                                  |
| [static-route-dynamic](https://nextjs.org/docs/messages/static-route-dynamic)                               | Некешируемые данные нарушают ensureStatic                           |
| [next-request-in-use-cache](https://nextjs.org/docs/messages/next-request-in-use-cache)                     | Request API внутри общего cached scope                              |
| [empty-generate-static-params](https://nextjs.org/docs/messages/empty-generate-static-params)               | Пустой набор prerender params при Cache Components                  |
| [generate-static-params](https://nextjs.org/docs/messages/generate-static-params)                           | Невалидный результат генератора параметров                          |
| [edge-runtime-deprecated](https://nextjs.org/docs/messages/edge-runtime-deprecated)                         | Несовместимый runtime при миграции                                  |

Дополнительные случаи timeout, Draft Mode и изоляции React.cache собраны в
[Troubleshooting use cache](https://nextjs.org/docs/app/api-reference/directives/use-cache#troubleshooting).

## История и прежняя модель

| Источник                                                                                       | Как интерпретировать                                                                            |
| ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| [Next.js 16](https://nextjs.org/blog/next-16)                                                  | Исходный выпуск Cache Components; не описывает все добавления 16.3/16.4                         |
| [Next.js 16.3 Instant Navigations](https://nextjs.org/blog/next-16-3-instant-navigations)      | Анонс от 25 июня 2026 года, содержит исторический контекст preview                              |
| [Next.js 16.4](https://nextjs.org/blog/next-16-4)                                              | Выпуск от 6 октября 2026 года: stable Instant Navigations, ensureStatic и navigation-stage APIs |
| [Version 16 upgrade guide](https://nextjs.org/docs/app/guides/upgrading/version-16)            | Удалённые experimental flags и переходы старых API                                              |
| [Caching, previous model](https://nextjs.org/docs/app/guides/caching-without-cache-components) | Сравнение с fetch cache/route configs для проектов без cacheComponents                          |
| [unstable_cache](https://nextjs.org/docs/app/api-reference/functions/unstable_cache)           | Совместимость старого Data Cache и отличие deploy lifetime                                      |
| [fetch](https://nextjs.org/docs/app/api-reference/functions/fetch)                             | Старые fetch cache options и отдельные поддерживаемые сценарии                                  |

## Граница проверки и обновления

Проверка источников подтверждает наличие и содержание документации. Скорость приложения она не измеряет.
Установленная версия, флаги и проектная обёртка ссылок проверены по текущим исходникам.
Копия сайта целиком и внешние пересказы не добавлялись.

При обновлении Next.js меняются версия и смысл некоторых контрактов. Для следующего
обновления каталога нужны новый `package.json`/lockfile, встроенные docs, текущий официальный индекс
и release notes между версиями. Отметьте расхождения с latest и обновите
оба справочника, аннотации и дату проверки. Поведение приложения и E2E проверяйте отдельным запуском.
