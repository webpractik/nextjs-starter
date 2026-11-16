---
type: reference
title: 'Cache Components в App Router: справочник Next.js 16.4.6'
description: Официальная модель Cache Components, директивы use cache, cacheLife, теги, инвалидация, runtime-границы, ISR и self-hosting с привязкой к настройкам starter.
tags: [nextjs, app-router, cache-components, caching, revalidation]
verified:
  - by: openwiki/0.7.2
    at: 2026-11-16T15:55:30.306Z
sources:
  - id: openwiki-source-50a18d054b596a7ed0eeffb0
    resource: repo://next.config.ts
  - id: openwiki-source-5b54a58d1b51cd490b0e7162
    resource: repo://package.json
  - id: openwiki-source-efec11b1a4dae3b601863151
    resource: repo://src/api/client-config.ts
  - id: openwiki-source-c44b755fabdf8dc20103b25a
    resource: repo://src/api/codegen/cache-tags/pets.ts
generated: { by: "codex", at: "2026-11-16T15:55:30.306Z" }
---

# Cache Components в App Router

Проверено 16 ноября 2026 года. В `package.json`, lockfile и установленном пакете используется
Next.js 16.4.6. В `next.config.ts` включены `cacheComponents: true`, `partialPrefetching: true`
и `output: 'standalone'`. Это подтверждённые настройки проекта, а не результат runtime-теста.

Текст опирается на [актуальный раздел Caching](https://nextjs.org/docs/app/getting-started/caching)
и документацию установленного пакета в `node_modules/next/dist/docs/`.
Для воспроизводимого чтения есть [исходники документации v16.4.6](https://github.com/vercel/next.js/tree/v16.4.6/docs/01-app).
Все руководства, API и сообщения диагностики перечислены в [каталоге источников](next-cache-prefetching-sources.md).

## Модель рендеринга

Cache Components объединяет кеширование функций и компонентов с Partial Prerendering.
Синхронный предсказуемый UI и подходящие кешируемые вычисления образуют static shell.
Данные текущего запроса и некешируемый I/O выполняются позднее внутри границ `<Suspense>`.
Загрузка данных по умолчанию динамическая. Директива указывает, какой результат можно использовать повторно.
Режим требует Node.js. Экспорт `runtime`, включая `'nodejs'`, с ним несовместим.
Старые `experimental.ppr`, `experimental_ppr`, `experimental.useCache` и `experimental.dynamicIO`
заменены текущей моделью. [Конфигурация cacheComponents](https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents).

Static shell описывает результат prerendering для первого открытия страницы.
App Shell описывает переиспользуемый результат для клиентской предзагрузки маршрута.
App Shell может дополнительно зависеть от сессии, но по умолчанию не от URL конкретной ссылки.
Подробности описаны в [справочнике Partial Prefetching](next-partial-prefetching.md).

## Директивы кеширования

| Директива              | Хранение и область повторного использования                | Request APIs                                                  | Ограничения                                                                    |
| ---------------------- | ---------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `'use cache'`          | Серверный результат; по умолчанию память экземпляра        | Читаются снаружи, необходимые значения передаются аргументами | Ключ и lifetime определяют переиспользование                                   |
| `'use cache: remote'`  | Выбранный cache handler, обычно общий внешний backend      | Как у обычного `use cache`                                    | Сетевой lookup, стоимость инфраструктуры, реализация handler                   |
| `'use cache: private'` | В production повтор внутри запроса и Router Cache браузера | Разрешены `cookies`, `headers`, `searchParams`                | Нет server cache между production-запросами; нет static shell и Route Handlers |

Обычная директива применяется к async-функции, async-компоненту или файлу.
При директиве на уровне файла все экспортируемые функции должны быть async.
В ключ входят аргументы и захваченные переменные, а также идентификаторы функции
и сборки, либо `deploymentId`, если он задан. Новый deploy меняет пространство ключей.
Аргументы и результат сериализуются по правилам React. JSX можно передать через `children`,
если кешируемая функция передаёт его дальше, не читая содержимое.
Секреты и произвольные объекты соединений не подходят для ключа.
[Справочник use cache](https://nextjs.org/docs/app/api-reference/directives/use-cache).

Remote cache полезен для общих дорогих чтений и нескольких экземпляров, если попадания
в кеш компенсируют сетевые затраты. Большое число уникальных ключей снижает пользу кеша.
При self-hosting хранилище нужно настроить отдельно, несмотря на имя `remote`.
[Справочник use cache: remote](https://nextjs.org/docs/app/api-reference/directives/use-cache-remote).

У private-директивы в официальной документации 16.4.6 нет отметки experimental.
Локальные правила `AGENTS.md` всё ещё требуют считать её применение в проекте экспериментом.
В development результат хранится в отдельном кеше в памяти сервера с ключом по cookies и headers
и обновляется в фоне. В production такого кеша между запросами нет. В браузере результат хранится
до истечения `stale` или очистки кеша. Перезагрузка удаляет его. Для private нельзя настроить
собственный cache handler. `connection()` внутри private запрещён.
[Справочник use cache: private](https://nextjs.org/docs/app/api-reference/directives/use-cache-private).

## Сроки cacheLife

`cacheLife` вызывается внутри кешируемой функции, а не на уровне модуля.
За одно выполнение должен сработать один вызов. Профиль можно выбрать по условию.
Пропущенные свойства наследуются из `default`. Именованные профили можно переопределить
или дополнить через верхнеуровневый `cacheLife` в Next config.
[Конфигурация профилей](https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheLife).

| Свойство     | Значение                                                                                          |
| ------------ | ------------------------------------------------------------------------------------------------- |
| `stale`      | Срок использования Router Cache без проверки сервера; не HTTP Cache-Control                       |
| `revalidate` | Возраст, после которого следующий запрос запускает фоновое обновление                             |
| `expire`     | Срок, после которого запрос ждёт свежий результат; должен превышать `revalidate`, если оба заданы |

Встроенные значения приведены без проектных переопределений:

| Профиль   | stale     | revalidate | expire                    |
| --------- | --------- | ---------- | ------------------------- |
| `default` | 5 минут   | 15 минут   | Без истечения по возрасту |
| `seconds` | 30 секунд | 1 секунда  | 1 минута                  |
| `minutes` | 5 минут   | 1 минута   | 1 час                     |
| `hours`   | 5 минут   | 1 час      | 1 день                    |
| `days`    | 5 минут   | 1 день     | 1 неделя                  |
| `weeks`   | 5 минут   | 1 неделя   | 30 дней                   |
| `max`     | 5 минут   | 30 дней    | 1 год                     |

| Условие                                             | Следствие для рендеринга                         |
| --------------------------------------------------- | ------------------------------------------------ |
| `revalidate === 0` или `expire < 300`               | Результат исключён из prerendering               |
| `stale < 30`                                        | Результат исключён из prerendering               |
| `30 <= stale < 300` при остальных допустимых сроках | Возможен prerender, но нет включения в App Shell |
| `stale >= 300` при остальных допустимых сроках      | Срок допускает включение в App Shell             |

Поэтому профиль `seconds` требует динамической границы. В Router Cache срок действия составляет
не менее 30 секунд. Явная инвалидация из Server Action обходит этот срок.
Вложенный кеш без явного lifetime может унаследовать более короткий срок дочернего кеша.
Для короткоживущего вложенного кеша нужно явно решить, какой срок действует во внешней области.
[Справочник cacheLife](https://nextjs.org/docs/app/api-reference/functions/cacheLife).

## Теги и инвалидация

`cacheTag(...tags)` связывает запись с прикладными тегами. Повторное назначение того же тега
ничего не добавляет. Одна операция принимает максимум 128 тегов по 256 символов.
Превышения пропускаются с предупреждением. Теги чувствительны к регистру.
[Справочник cacheTag](https://nextjs.org/docs/app/api-reference/functions/cacheTag).

| API                                 | Где вызывается                  | Эффект                                                                                      |
| ----------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------- |
| `updateTag(tag)`                    | Только Server Action            | Немедленное истечение записи, следующее чтение ждёт свежий результат                        |
| `revalidateTag(tag, 'max')`         | Server Action или Route Handler | Запись становится stale; следующий запрос запускает обновление с выдачей старого результата |
| `revalidateTag(tag, { expire: 0 })` | Server Action или Route Handler | Следующий запрос ждёт обновление, полезно для webhook с требованием немедленного истечения  |
| `revalidatePath(path, type?)`       | Server Action или Route Handler | Инвалидация результата страницы или layout по пути                                          |
| `refresh()` из `next/cache`         | Только Server Action            | Обновление клиентского дерева без самостоятельной инвалидации кешированных данных           |
| `router.refresh()`                  | Client Component                | Новый запрос RSC; серверный кеш сам по себе не инвалидируется                               |

`updateTag` предназначен для read-your-own-writes после успешной мутации.
[Справочник updateTag](https://nextjs.org/docs/app/api-reference/functions/updateTag).
Второй аргумент `revalidateTag` задаёт, как долго можно выдавать старый результат.
Из именованного профиля используется `expire`. Одноаргументная форма устарела и не соответствует
актуальной TypeScript-сигнатуре. Сам вызов не запускает массовый прогрев страниц.
[Справочник revalidateTag](https://nextjs.org/docs/app/api-reference/functions/revalidateTag).

Для динамического шаблона пути `revalidatePath` требуется `type: 'page'` или `'layout'`.
Инвалидация одного пути не заменяет тег, если те же данные отображаются на других маршрутах.
Route Handler отмечает результат для следующего посещения. Server Action может обновить текущий UI.
[Справочник revalidatePath](https://nextjs.org/docs/app/api-reference/functions/revalidatePath).

Обновление дерева не гарантирует новые значения, если источник остаётся кешированным.
[refresh](https://nextjs.org/docs/app/api-reference/functions/refresh),
[useRouter](https://nextjs.org/docs/app/api-reference/functions/use-router).

## Runtime-границы и авторизация

`cookies()` и `headers()` читаются вне общего кеша. Передача проверенного `userId` аргументом
может разделить записи, но приложение всё равно должно проверять права при каждом доступе.
Кеширование не делает результат проверки срока сессии и прав бессрочно достоверным.
Статический UI может находиться снаружи `<Suspense>`, а сессионный блок внутри.
[Authentication with Cache Components](https://nextjs.org/docs/app/guides/authentication-with-cache-components).

Сам `<Suspense>` не делает синхронную операцию динамической. Для текущего времени,
случайного значения или синхронного драйвера `await io()` из `next/cache` отделяет request-time
вычисление от prerendering. В cached scope `io()` ничего не откладывает.
[Справочник io](https://nextjs.org/docs/app/api-reference/functions/io).
`await connection()` связывает продолжение с реальным запросом и исключает его из prerendering.
Он не заменяет кеширование общих данных.
[Справочник connection](https://nextjs.org/docs/app/api-reference/functions/connection).

GET Route Handlers используют ту же модель prerendering. Данные запроса или некешируемый I/O
останавливают предварительное выполнение. `use cache` размещается во вспомогательной функции,
а не непосредственно в теле Route Handler.
[Route Handlers with Cache Components](https://nextjs.org/docs/app/getting-started/route-handlers#with-cache-components).

## Динамические параметры и ISR

`generateStaticParams` с Cache Components возвращает хотя бы один реальный набор параметров.
Пустой массив вызывает ошибку. Неперечисленные параметры могут обрабатываться при запросе.
`dynamicParams` с этим режимом несовместим. Для отсутствующих сущностей вызывается `notFound()`.
[generateStaticParams](https://nextjs.org/docs/app/api-reference/functions/generate-static-params).

Динамический маршрут без `generateStaticParams` может кешировать данные, но это не включает
ISR всего маршрута. С Partial Prefetching чтение `params` внутри `<Suspense>` позволяет отправить
fallback для неизвестного пути. Полный контракт listed/unlisted paths, ISR и on-demand revalidation
описан отдельно. [ISR with Cache Components](https://nextjs.org/docs/app/guides/incremental-static-regeneration-cache-components).

## Миграция и совместимость

| Старый механизм                                                    | Текущая модель                                                                                        |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| `dynamic`, `revalidate`, `fetchCache` в сегменте                   | Явные cached scopes, `cacheLife`, динамический I/O и Suspense                                         |
| `runtime`, `dynamicParams` в сегменте                              | Удаление несовместимого экспорта, Node.js и проверка отсутствующих сущностей                          |
| `fetch(..., { cache: 'force-cache', next: { revalidate, tags } })` | Область `use cache`, `cacheLife`, `cacheTag` для новой модели                                         |
| `unstable_cache`                                                   | Можно сохранять при необходимости; переход к `use cache` меняет хранение и ключи                      |
| Request memoization через `React.cache`                            | Не является кешем между запросами; области `use cache` изолируют memoization                          |
| `instant = false`                                                  | Разрешение блокировки при миграции, без исправления синхронного I/O и без принудительной динамичности |

Соответствия в таблице не означают механическую замену один к одному. Старый Data Cache,
в частности, сохраняет кеш между deploy, а ключи `use cache` привязаны к сборке.
[Migrating to Cache Components](https://nextjs.org/docs/app/guides/migrating-to-cache-components),
[unstable_cache](https://nextjs.org/docs/app/api-reference/functions/unstable_cache).
Для проверки статичности в 16.4 появился `ensureStatic`.
Его стадии разобраны в [справочнике навигации](next-partial-prefetching.md#проверка-статичности-ensurestatic).

## Эксплуатация и несколько экземпляров

Память процесса не разделяется автоматически между репликами.
При завершении процесса её содержимое теряется.
`cacheMaxMemorySize` ограничивает размер такого кеша. Постоянное хранение и согласованную инвалидацию
нужно реализовать отдельно. На serverless нельзя предполагать повторное использование
runtime-результата между запросами. Платформа может заменить стандартный handler.
[use cache: runtime considerations](https://nextjs.org/docs/app/api-reference/directives/use-cache#runtime-caching-considerations),
[cacheMaxMemorySize](https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheMaxMemorySize).

`cacheHandlers` во множественном числе управляет директивами `use cache` и `use cache: remote`.
Он отличается от `cacheHandler` для прежнего server cache. Реализация отвечает за чтение,
запись, streaming, жизненный цикл тегов и распространение инвалидации.
[Справочник cacheHandlers](https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheHandlers).
Для нескольких экземпляров нужны общие события тегов и согласованная версия HTML/RSC,
включая CDN. Стандартная локальная инвалидация этого не обеспечивает.
[How revalidation works](https://nextjs.org/docs/app/guides/how-revalidation-works).

## Применение в starter

Общий внешний `cacheHandlers` и пользовательские `cacheLife` в `next.config.ts` не настроены.
`src/api/codegen/cache-tags/pets.ts` помечен `server-only`. Функции `revalidatePet` и `revalidatePets`
вызывают `updateTag`, поэтому их можно вызывать только из Server Action.
Сгенерированный файл не редактируется вручную.

Стандартный `apiFetch` может читать `next/headers` для runtime mocks.
Кешируемое общее чтение использует транспорт без request APIs, как в
[практическом примере SDK](cache-and-streaming.md#use-cache).
TanStack Query имеет собственный кеш. Прямая браузерная мутация backend не инвалидирует Next.js.
Серверная инвалидация не заменяет `invalidateQueries` в клиентском workflow.

Страница описывает документацию и текущие исходники. Проверка не включала build, нагрузочные тесты,
реальное поведение backend, эффективность кеша и согласованность реплик.
