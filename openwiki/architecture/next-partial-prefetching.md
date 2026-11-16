---
type: reference
title: Partial Prefetching и мгновенная навигация в App Router
description: App Shell, предзагрузка URL и session data, route exports prefetch/instant/ensureStatic, navigation-stage APIs, миграция и production-проверки Next.js 16.4.6 с учётом ForesightLink.
tags: [nextjs, app-router, partial-prefetching, instant-navigation, app-shell]
verified:
  - by: openwiki/0.7.2
    at: 2026-11-16T15:55:30.306Z
sources:
  - id: openwiki-source-50a18d054b596a7ed0eeffb0
    resource: repo://next.config.ts
  - id: openwiki-source-5b54a58d1b51cd490b0e7162
    resource: repo://package.json
  - id: openwiki-source-5e753d9d77984cb67aae1517
    resource: repo://playwright.config.ts
  - id: openwiki-source-c529e645d3caa8118b0c750b
    resource: repo://src/components/utilities/foresight-link/index.tsx
  - id: openwiki-source-ceefa4095552f57d55f4b2a1
    resource: repo://src/tests/e2e/foresight.spec.ts
  - id: openwiki-source-25b312c3a9f58f0e72fd1a8a
    resource: repo://tools/test-production-prefetch.mjs
generated: { by: "codex", at: "2026-11-16T15:55:30.306Z" }
---

# Partial Prefetching и мгновенная навигация

Проверено 16 ноября 2026 года по официальной документации и установленному Next.js 16.4.6.
В проекте уже включены `cacheComponents: true` и `partialPrefetching: true`.
Страница описывает контракт и текущую интеграцию, не заявляя о скорости реальных переходов.
[Полный каталог источников](next-cache-prefetching-sources.md),
[документация версии v16.4.6](https://github.com/vercel/next.js/tree/v16.4.6/docs/01-app).

## Статическая оболочка и App Shell

Partial Prerendering делит первое открытие страницы на предварительно созданную static shell
и динамические части. Partial Prefetching определяет, что загружается до клиентского перехода.
Это связанные, но разные механизмы.

App Shell переиспользуется ссылками одного маршрута. Например, ссылки на `/pets/1`
и `/pets/2` могут разделять оболочку маршрута `/pets/[petId]`.
URL-specific части по умолчанию остаются за Suspense до перехода.
Сессионные `cookies()` и `headers()` не привязаны к конкретной ссылке. Такой App Shell
может формироваться для сессии и храниться на клиенте. Он отличается от static shell,
которая не содержит данных реального запроса.
[Конфигурация partialPrefetching](https://nextjs.org/docs/app/api-reference/config/next-config-js/partialPrefetching).

Без Cache Components глобальный `partialPrefetching` вызывает ошибку конфигурации.
`false` сохраняет прежнюю модель. Если значение не задано, оно ведёт себя как `false`,
а при включённом Cache Components появляется предупреждение. Так работает 16.4.6.
Официальная документация обещает убрать флаги в следующей основной версии,
но установленная версия ещё использует их.

## Три стадии навигации

| Стадия            | Что доступно                                                                   | Граница затрат                                |
| ----------------- | ------------------------------------------------------------------------------ | --------------------------------------------- |
| App Shell         | Результат, не зависящий от URL конкретной ссылки; статический или сессионный   | Переиспользование на уровне маршрута и сессии |
| Per-link prefetch | Оболочка и подходящее кешированное содержимое после чтения params/searchParams | Работа для выбранного URL ссылки              |
| Navigation        | Остальное дерево, включая свежие запросы и явно отложенные части               | Работа для фактического перехода              |

Завершённая per-link предзагрузка может улучшить UI до клика, но её завершение не гарантировано.
При раннем клике, медленной сети или отсутствии прогретого кеша переход использует оболочку
и потоковую загрузку. Полезный App Shell необходим и без per-link prefetch.
[Optimizing prefetching](https://nextjs.org/docs/app/guides/optimizing-prefetching).

Кешируемость не гарантирует попадание в оболочку. `cacheLife.stale` меньше пяти минут исключает
результат из App Shell, а короткие `expire` и `revalidate: 0` исключают prerendering.
Полные пороги собраны в [справочнике cacheLife](next-cache-components.md#сроки-cachelife).

## Prop prefetch у Next.js Link

Таблица относится к native Next.js Link при включённом Partial Prefetching:

| Значение                                    | Семантика                                                 |
| ------------------------------------------- | --------------------------------------------------------- |
| Не задан, `null` или `'auto'`               | Предзагрузка App Shell маршрута                           |
| `true`, включая сокращённый prop `prefetch` | App Shell и кешируемые URL-specific части                 |
| `false`                                     | Отключение предзагрузки этой ссылки при видимости и hover |

Автоматическая предзагрузка выполняется в production. Dev-переход сам по себе не доказывает
production-результат. Прежнее правило "true загружает весь динамический маршрут" описывает модель
до Partial Prefetching. В новой модели некешируемый контент может продолжать ждать navigation.
[Link: prefetch](https://nextjs.org/docs/app/api-reference/components/link#prefetch).

Видимые ссылки с `prefetch={true}` могут вызвать отдельную серверную работу для каждой
карточки. Если URL-specific данные ничего не добавляют к готовой оболочке, пользы от этого нет.
Предзагрузка по намерению пользователя ограничивает число ненужных запросов.
[Optimizing prefetching](https://nextjs.org/docs/app/guides/optimizing-prefetching).

## Экспорт prefetch у destination

`page.tsx` и `layout.tsx` Server Components могут задавать стратегию сегмента:

| Экспорт                                    | Значение                                                              |
| ------------------------------------------ | --------------------------------------------------------------------- |
| Не задан или `'auto'`                      | Использование глобальной стратегии                                    |
| `export const prefetch = 'partial'`        | Поэтапное включение Partial Prefetching для destination               |
| `export const prefetch = 'force-disabled'` | Исключение данных сегмента и более глубоких сегментов из предзагрузки |

`'force-disabled'` не блокирует route metadata. Предзагрузка родительского сегмента одним общим
per-link ответом может включить и вложенные сегменты с этим значением.
Это ограничение помогает планировать затраты, но не защищает доступ к данным.
`Link prefetch={false}` прекращает предзагрузку на уровне ссылки независимо от destination.
При глобальном `partialPrefetching: true` повторять `'partial'` в каждом page не требуется.
[prefetch segment config](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config/prefetch).

## Функции prefetch() и navigation()

Обе функции импортируются из `next/cache`, доступны с 16.4 и возвращают `Promise<void>`.
Они управляют стадией выполнения поддерева и сами не отправляют браузерный запрос.

| Вызов                | Отложенное runtime-содержимое                                                | Первое открытие и статический prerender |
| -------------------- | ---------------------------------------------------------------------------- | --------------------------------------- |
| `await prefetch()`   | Исключено из App Shell, может выполняться в per-link prefetch или navigation | Не откладывается этой функцией          |
| `await navigation()` | Исключено из App Shell и per-link prefetch, выполняется при navigation       | Не откладывается этой функцией          |

Граница действует на продолжение компонента и его поддерево. Соседние ветви не меняются.
Ближайший `<Suspense>` предоставляет fallback. Вызов находится снаружи cached scope,
а отдельная кешируемая функция вызывается ниже границы.
[prefetch()](https://nextjs.org/docs/app/api-reference/functions/prefetch),
[navigation()](https://nextjs.org/docs/app/api-reference/functions/navigation).

Пример показывает перенос повторно используемых данных на стадию navigation:

```tsx
import { navigation } from 'next/cache'

async function DeferredPet({ petId }: { petId: string }) {
    await navigation()
    const pet = await loadPet(petId)
    return <p>{pet.name}</p>
}
```

`loadPet` здесь кешируемая SDK-функция из
[практического примера](cache-and-streaming.md#use-cache), а `DeferredPet` размещается под Suspense.
`navigation()` не помещается внутрь `loadPet`.

Вызов внутри cached scopes, `unstable_cache`, `after`, `generateStaticParams` или Client Component
вызывает ошибку. Без Partial Prefetching `prefetch()` не действует, а `navigation()` не исключает
содержимое из legacy full prefetch. `connection()` делает продолжение
request-dependent и исключает его также из prerendering.
Если файл экспортирует `prefetch`, функцию импортируют под alias, например `prefetchStage`.

## Проверка статичности ensureStatic

`ensureStatic` появился в 16.4 и задаётся в server page/layout при Cache Components.
Более строгий уровень охватывает предыдущие стадии:

| Значение                         | Требуемый статический результат                                                   |
| -------------------------------- | --------------------------------------------------------------------------------- |
| `'auto'` или отсутствие экспорта | Без дополнительного требования                                                    |
| `'shell'`                        | App Shell                                                                         |
| `'prefetch'`                     | App Shell и per-link prefetch                                                     |
| `'navigation'`                   | Полный серверный результат маршрута                                               |
| `false`                          | Обычная модель, несовместимая с обязательным статическим уровнем другого сегмента |

`'shell'` и `'prefetch'` требуют Partial Prefetching для соответствующего эффекта.
Они меняют запрашиваемый статический результат. Отдельной полной проверки этих уровней
при сборке нет. `instant = false` отключает мгновенную проверку,
но сохраняет выбранный статический запрос.
У `'navigation'` есть отдельная проверка полного статического результата. `instant = false`
её не отключает. Suspense не разрешает server request data при этом уровне.

При `'navigation'` динамический маршрут требует `generateStaticParams` хотя бы с одним полным
набором всех динамических параметров. Клиентские hooks могут читать URL, но передача
request-dependent server promise в Client Component всё ещё нарушает статичность.
Дочерний сегмент не ослабляет уровень родителя. Несовместимые parallel slots и сочетание
`false` с обязательным уровнем вызывают ошибку сборки.
[ensureStatic](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config/ensureStatic),
[Keeping pages static](https://nextjs.org/docs/app/guides/keeping-pages-static).

## Проверка мгновенного UI через instant

`instant` стабилизирован в 16.3 вместо `unstable_instant`.
Он проверяет наличие немедленно доступного UI и отличается от `ensureStatic`.
Полностью статическая страница тоже может задержаться из-за загрузки в Client Component.

`instant = true` включает проверку, а `false` разрешает блокировку.
Поддерживаемый `level: 'warning'` работает в development. Отсутствие предупреждений при build
не доказывает мгновенный переход. При Cache Components страницы и default segments по умолчанию
проверяются в dev. Экспериментальный `instantInsights.validationLevel: 'manual-warning'`
ограничивает проверки явными opt-in, а `'warning'` сохраняет автоматический режим.
Опция находится внутри `experimental` и не включает сам prefetch.

Cache Components отдельно проверяет непустую static shell при prerendering.
Верхний `instant = false` в дереве маршрута может отключить эту проверку оболочки.
Он не исправляет синхронный I/O и не принуждает маршрут к динамическому рендерингу.
[instant config](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config/instant).

Navigation Inspector позволяет заморозить initial static UI или UI перехода до поступления
динамического содержимого. При нескольких проектах на `localhost` его служебная cookie общая
для домена, независимо от порта. Неожиданная остановка другого проекта может быть связана с ней.
[Instant navigation](https://nextjs.org/docs/app/guides/instant-navigation).

## Миграция и проверка до ответа сервера

Официальное руководство предлагает зафиксировать нужный UI при прежних full prefetch,
включить флаг или destination export и повторить ту же проверку. Уже статическое содержимое
не требует дополнительных per-link запросов. Общие читаемые данные можно кешировать.
URL-зависимые части остаются под Suspense и добавляются в per-link prefetch по необходимости.
Для сравнения прежней и новой модели используется одна исходная ссылка.
[Adopting Partial Prefetching](https://nextjs.org/docs/app/guides/adopting-partial-prefetching).

`instant()` из отдельного пакета `@next/playwright` удерживает динамическое содержимое,
пока тест проверяет немедленный UI. Это отличается от проверки финального заголовка после загрузки.
Для production test build требуется `experimental.exposeTestingApiInProductionBuild`
во время `next build`.
Добавление переменной только при запуске уже собранного сервера ничего не меняет.
Настройка предназначена для отдельной тестовой сборки и не включается в пользовательский deploy.
[Тестирование instant navigation](https://nextjs.org/docs/app/guides/instant-navigation#prevent-regressions-with-e2e-tests),
[testing API config](https://nextjs.org/docs/app/api-reference/config/next-config-js/exposeTestingApiInProductionBuild).

Повторные переходы и browser back используют сохранённое состояние через React Activity.
Скрытый старый маршрут остаётся в DOM, поэтому E2E должен проверять видимый результат.
Effects при скрытии очищаются и при показе запускаются снова.
[Preserving UI state](https://nextjs.org/docs/app/guides/preserving-ui-state).

## Ручная предзагрузка и экспериментальные настройки

`router.prefetch(href, { onInvalidate })` программно прогревает маршрут.
`onInvalidate` вызывается не чаще одного раза на запрос и сообщает о необходимости нового prefetch.
Сам callback не запускает бесконечное обновление.
[useRouter](https://nextjs.org/docs/app/api-reference/functions/use-router).
Побочный эффект при рендеринге страницы может сработать во время prefetch, ещё до посещения.
Мутации не размещаются в render. Аналитика посещения не должна считать prefetch просмотром.
[Prefetching](https://nextjs.org/docs/app/guides/prefetching).

Объединение небольших segment responses уже включено в App Router.
Экспериментальна настройка `experimental.prefetchInlining`, а не сам механизм.
Её стандартные пороги составляют 2048 байт на segment и 10240 байт на bundle после gzip.
[prefetchInlining](https://nextjs.org/docs/app/api-reference/config/next-config-js/prefetchInlining).
`experimental.staleTimes` глобально меняет client cache и отличается от `cacheLife` функции.
Его прежние таблицы full prefetch не заменяют контракт Partial Prefetching.
[staleTimes](https://nextjs.org/docs/app/api-reference/config/next-config-js/staleTimes).

## Интеграция starter и границы проверки

В приложении внутренние ссылки используют `ForesightLink` из
`#/components/utilities/foresight-link`. Он всегда передаёт `prefetch={false}` native Link,
а `useForesight` вызывает `router.prefetch(href)` по сигналу намерения пользователя.
Prop обёртки `prefetch` по умолчанию `true`, но управляет включением ForesightJS.
Он не пробрасывается в native prop и не принимает `'auto'`.
Правила внешних URL, target и download описаны в [документации обёртки](../ui/link-prefetching.md).

`src/tests/e2e/foresight.spec.ts` проверяет, что видимость ссылки сама по себе не вызывает запрос.
Он также проверяет появление RSC-запроса по hover/touch-сигналу, отключённый prefetch
и итоговый переход.
Файл включается при `FORESIGHT_E2E=true`.
`npm run test:e2e:production` временно размещает fixtures, выполняет свежий build и E2E,
затем удаляет их и пересобирает приложение. Обычный `npm run test:e2e` локально использует dev.

`@next/playwright` и флаг `exposeTestingApiInProductionBuild` в проект не добавлены.
Имеющиеся тесты не доказывают состав UI до динамического ответа.
При сборе документации build/E2E, нагрузка и backend не запускались.
