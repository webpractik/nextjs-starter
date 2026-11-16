---
type: workflow
title: Тесты и проверка качества
description: Тесты и проверка качества в Next.js Starter, инструкции и проверяемые контракты.
tags: [nextjs, starter, workflow]
sources:
  - id: openwiki-source-8a8b78afd6e03e85194289b4
    resource: repo://.jscpd.json
  - id: openwiki-source-808b9ff10fba3d7819aa09ab
    resource: repo://.storybook/main.ts
  - id: openwiki-source-362e06c30ccfdafd87339cb0
    resource: repo://ARCHITECTURE.md
  - id: openwiki-source-72b816a72bb5f72d95b334ea
    resource: repo://lefthook.yml
  - id: openwiki-source-5b54a58d1b51cd490b0e7162
    resource: repo://package.json
  - id: openwiki-source-5e753d9d77984cb67aae1517
    resource: repo://playwright.config.ts
  - id: openwiki-source-213b041a521bfb74f76bc155
    resource: repo://src/tests/allure-labels.ts
  - id: openwiki-source-22df64ef67f337cc601445d9
    resource: repo://src/tests/setup-allure-component.ts
  - id: openwiki-source-b333c6e46143ea4db8da3227
    resource: repo://src/tests/setup-allure-unit.ts
  - id: openwiki-source-8c1c6fe3dc524dd1d72fbfb7
    resource: repo://tests/unit/src/api/schemas.test.ts
  - id: openwiki-source-13445c2f1001b83805761c34
    resource: repo://tests/unit/tools/check-imports.unit.test.ts
  - id: openwiki-source-5a9de896f4709eefddfc5d99
    resource: repo://tools/check-imports.mjs
  - id: openwiki-source-af56594a1a698e5b1e7a2049
    resource: repo://tools/check-structure.mjs
  - id: openwiki-source-cf45045e1d79371a26328263
    resource: repo://tools/start-standalone.mjs
  - id: openwiki-source-fbadcd8591b65031efaaedce
    resource: repo://vitest.config.ts
generated: { by: "codex", at: "2026-11-16T15:55:30.306Z" }
verified:
  - by: openwiki/0.7.2
    at: 2026-11-16T15:52:45.490Z
---

# Тестирование

В репозитории настроены два проекта Vitest, Playwright E2E и Storybook. Проект Vitest определяется
по каталогу `tests/unit/` или `tests/component/`. Имя файла должно соответствовать `*.test.ts(x)`.
Суффиксы `.unit.test` и `.component.test` дополнительно обозначают назначение теста.

> Источники истины: `vitest.config.ts`, `playwright.config.ts`, `.storybook/` и npm scripts.

Vitest и пакеты для браузерных тестов и покрытия зафиксированы на 5.1.0. Storybook addon-vitest 10.6.7
объявляет поддержку Vitest 5. Allure 3.14.0 требует явного peer `@vitest/runner@4.1.11` для
Node reporter. Браузерный alias `src/tests/mocks/vitest-runner.ts` направляет чтение текущего
теста на встроенный `TestRunner` Vitest 5. Благодаря этому метки, заданные во время теста, сохраняются в отчётах.

В Vitest 5 `toHaveTextContent` проверяет точное совпадение строки. Для прежней проверки
подстроки или регулярного выражения используйте `toMatchTextContent`.

## Какой runner выбрать

| Что проверяем | Среда                       | Какие файлы запускаются                                               |
| ------------- | --------------------------- | --------------------------------------------------------------------- |
| Unit          | Node                        | `tests/unit/**/*.test.{ts,tsx}` |
| Component     | Headless Chromium, реальный DOM | `tests/component/**/*.test.{ts,tsx}` (кроме `*.unit.test.{ts,tsx}`) |
| E2E           | Chromium                    | `src/tests/e2e/**/*.@(spec\|test).?(c\|m)[jt]s?(x)`                   |
| Storybook     | Браузерный preview             | `stories/**/*.stories.@(js\|jsx\|mjs\|ts\|tsx)`, `stories/**/*.mdx` |

После префикса `tests/unit/` или `tests/component/` повторяется путь
исходника от корня, включая `src/` или `app/`. Stories разрешены только для `src/components/`
и зеркалируют исходники в `stories/src/components/`. Тесты и stories рядом с исходниками
запрещены. Например, тест `src/components/ui/button/button.tsx` находится в
`tests/component/src/components/ui/button/button.component.test.tsx`, а story в
`stories/src/components/ui/button/button.stories.tsx`.

`src/tests/` содержит общие setup, фикстуры, моки и Playwright E2E. Вне `tests/`
модульные и компонентные тесты больше не запускаются, включая прежние `src/api/**/*.test.ts`.

Установите Chromium один раз после `npm ci`:

```bash
# macOS
npx playwright install chromium

# Linux и CI: Chromium вместе с системными библиотеками
npx playwright install --with-deps chromium
```

## Unit-тесты

Модульный проект проверяет чистые функции, схемы, плагины, сериализацию, маршрутизацию моков и
другую логику без браузера.

```bash
# Весь Unit project
npm run test:unit

# Один файл
npx vitest run tests/unit/src/mock-mode/runtime.unit.test.ts --project unit

# Тесты API
npm run api:test
```

Модульный проект работает в Node. Не добавляйте самодельный jsdom. Макет, фокус, события указателя
и клавиатуры, Base UI и гидратацию проверяйте компонентным тестом.

`src/tests/setup-env.ts` подменяет `fetch`. Запросы без моков падают. Подменяйте транспорт или
`fetch` либо используйте сгенерированный мок-клиент. Модульным тестам не нужен запущенный бэкенд.

Для `#/api` отдельно проверяйте транспорт, конфиг клиента, сценарии моков и независимые
постгенераторы. После изменения этапов генерации или OpenAPI запускайте полный `gen`, включая
корневую проверку TypeScript со сгенерированным кодом.

```bash
npx vitest run tests/unit/src/api/client-config.unit.test.ts tests/unit/src/api/mock-client.test.ts tests/unit/src/api/mock-scenarios.test.ts --project unit
npx vitest run tests/unit/src/api/generators --project unit
npm run api:gen
```

## Компонентные тесты

Компонентный проект использует `@vitest/browser-playwright` и реальный headless Chromium.
`vitest-browser-react` рендерит компоненты, браузерные локаторы проверяют взаимодействия.

```bash
# Весь Component project
npm run test:component

# Один файл
npx vitest run tests/component/src/components/utilities/error-boundary/error-boundary.test.tsx --project component
```

Минимальный пример:

```tsx
import { expect, test } from 'vitest'
import { render } from 'vitest-browser-react'

test('отправляет форму с валидными значениями', async () => {
    const screen = await render(<ExampleForm />)
    await screen.getByRole('button', { name: 'Save' }).click()
    await expect.element(screen.getByText('Saved')).toBeVisible()
})
```

Конфиг подменяет `next/navigation`, `next/image` и `next/script` алиасами из
`src/tests/mocks`. Мок навигации сбрасывается после каждого браузерного теста.

Проверяйте Base UI в браузере. Не подменяйте его глобальным моком ради удобства. Состояния общего
компонента опишите в Storybook. История не заменяет тест взаимодействий, а компонентный тест
не заменяет визуальное ревью всех состояний.

## E2E-тесты в Playwright

E2E проверяет приложение в Chromium по относительным URL. `playwright.config.ts` задаёт
`baseURL` через `FRONT_PORT`, по умолчанию `3000`.

### Локальная проверка на development server

```bash
# Вся E2E suite; Playwright сам поднимет npm run dev
npm run test:e2e

# Один файл
npx playwright test src/tests/e2e/example.spec.ts
```

При разработке Playwright использует уже запущенный сервер, если он есть.

### Production-проверка

```bash
npm run build
PLAYWRIGHT_SERVER_MODE=standalone npm run test:e2e
```

В режиме `standalone` Playwright запускает `tools/start-standalone.mjs`, который готовит
static/public assets и запускает `.next/standalone/server.js`. Этот режим не использует
`npm run prod` и не переиспользует development server. Сам E2E не создаёт свежую сборку.
Без явного `PLAYWRIGHT_SERVER_MODE` значение `CI=true` также выбирает standalone.

Конфигурации GitHub Actions и GitLab CI удалены. E2E и production-сборка запускаются локально.

## Storybook

В Storybook просматривают состояния общих UI-компонентов и вручную проверяют доступность.

```bash
# Локальный preview
npm run storybook

# Проверка production Storybook build
npm run build-storybook
```

Размещайте историю общего компонента в `stories/src/components/` с зеркальным путём
исходника. Для `app/` stories запрещены. Поведение покрывайте
компонентным тестом из `tests/component/`.

## Проверка структуры

`npm run check:structure` входит в `verify:fast` и pre-commit. Скрипт контролирует
размещение тестов, существование соответствующей директории исходников, зеркальный
путь story и одноимённые тесты компонентов `.tsx` в `src/components/`
и `app/**/_components/`. Story требуется и разрешена только для `src/components/`.
Чистые re-export `index.tsx` исключаются; наличие реализации
определяется по `return` или `=>`, без AST-анализа.

CSS Modules с расширениями css, scss, sass и less разрешены только в `src/styles/`.
Для оформления используйте прежде всего классы Tailwind и общие токены.

Скрипт не проверяет качество assertions. Обязательность файлов пока не распространяется
на будущий `src/modules/`. Проверка зеркальности не охватывает MDX и `.spec.*`.
Для произвольного теста проверяется соответствующая директория, а не одноимённый исходник.
Точное совпадение имени нужно для обязательного теста компонента.

## Проверка импортов

`npm run check:imports` проверяет зависимости по [архитектурному контракту](../../ARCHITECTURE.md):
границы shared/app/modules, независимость UI от API и env, публичные входы API,
модулей и компонентов, доступ к route-local UI и независимость чистых слоёв.
Запреты слоёв учитывают транзитивные локальные импорты и реэкспорты;
публичный вход проверяется на каждом отдельном импорте.

Domain/application распознаются по каталогу слоя или начальному маркеру
`/** @architecture domain */` / `/** @architecture application */` в плоском файле.
Проверка учитывает type-only импорты. Неотмеченные бизнес-правила автоматически
не классифицируются. Полный список границ, примеры и ограничения описаны
в [справочнике check:imports](../architecture/import-boundaries.md).

```bash
# Текущий граф импортов приложения
npm run check:imports

# Регрессии самого проверяющего скрипта
npx vitest run tests/unit/tools/check-imports.unit.test.ts --project unit

# Все быстрые проверки перед коммитом
npm run verify:fast
```

`verify:fast` выполняет `check:structure` → `check:imports` → `fmt:check` → `lint` → `tsc`.
Та же команда подключена к pre-commit в `lefthook.yml`; для автоматического запуска
Git hook должен быть установлен. Unit-тесты скрипта запускаются отдельно и входят
в unit project. Они проверяют разрешённые зависимости, запрещённые границы, маркеры,
публичные входы, динамические импорты и обходы через локальные helpers и barrels.

`check:structure` проверяет размещение файлов. `check:imports` проверяет зависимости.
Успешная проверка импортов не доказывает runtime-поведение, авторизацию, безопасность
секретов и RSC-сериализацию; Next build и проверки поведения остаются отдельными шагами.

## Как называть тесты

Новые и изменяемые `test`/`it` называйте по-русски. Описывайте поведение глаголом настоящего времени:
`возвращает`, `показывает`,
`блокирует`, `сохраняет`.

| Хорошо                                     | Плохо                       | Почему                                   |
| ------------------------------------------ | --------------------------- | ---------------------------------------- |
| `возвращает пустое тело для ответа 204`    | `обработка ответа 204`      | Не указаны действие и результат                |
| `показывает ошибку после потери фокуса`    | `должен работать корректно` | Неясно, что ожидается                    |
| `отправляет форму с валидными значениями`  | `проверяет submitForm`      | Описана реализация, а не поведение       |
| `игнорирует cookie mock-mode в production` | `calls setState`            | Английский текст и детали реализации |

`describe` тоже пишите по-русски, называя объект или контекст проверки. Идентификаторы вроде
`mock-mode`, `NEXT_PUBLIC_BFF_PATH` и методов API не переводите.

Файлы называйте по-английски, по шаблонам первой таблицы: `registration-form.component.test.tsx`.
Переводите название теста при его изменении. Массовое переименование делайте отдельно.

## Параллельное выполнение

Тесты уже запускаются параллельно. Создавайте данные и очищайте состояние в каждом тесте.
Не разделяйте между тестами запись БД, аккаунт, очередь, временный путь, cookie/storage или синглтон модуля.

### Vitest

Vitest запускает файлы параллельно в воркерах, а тесты внутри файла последовательно.
`test.concurrent` и `describe.concurrent` подходят только независимым асинхронным тестам,
ожидающим преимущественно I/O или таймеры. `Promise.all` в одном воркере не ускоряет синхронные вычисления.

Не совмещайте конкурентные тесты с общими `vi.stubEnv`, `vi.stubGlobal`, поддельными таймерами,
моками модулей и DOM браузера. Берите `expect` и `onTestFinished` из локального контекста теста.

```bash
# Ограничить workers на одной машине
npx vitest run --project unit --maxWorkers=4

# Диагностика race condition
npx vitest run --project unit --maxWorkers=1
```

### Playwright

Включённый `fullyParallel: true` разрешает параллельный запуск файлов и отдельных тестов. Встроенные фикстуры
`page` и `context` изолированы для каждого теста. Не храните их в переменной модуля и не создавайте
однократно в `beforeAll`.

Делайте внешние данные уникальными для теста или воркера. Дорогой ресурс можно вынести в фикстуру
воркера с пространством имён, например по `workerInfo.workerIndex`. `serial` допустим лишь для неизолируемой
последовательности с общим состоянием. Обычно лучше написать один E2E-тест или разделить данные.

```bash
# Workers на одной машине
npx playwright test --workers=4

# Диагностика race condition
npx playwright test --workers=1
```

Воркеры делят тесты на одной машине, а шарды распределяют их между задачами CI:

```bash
npx vitest run --project unit --shard=1/2
npx playwright test --shard=1/2
```

Шардам нужны отдельные пути артефактов. Объединяйте отчёты Playwright через blob reporter и
`playwright merge-reports`. Текущий pipeline не настраивает шардинг и объединение отчётов.

Подробнее: [Vitest parallelism](https://vitest.dev/guide/parallelism.html),
[Playwright parallelism](https://playwright.dev/docs/test-parallel) и
[Playwright sharding](https://playwright.dev/docs/test-sharding).

## Среда тестов и артефакты

Vitest берёт разрешённые переменные сначала из `process.env`, затем из корневого `.env` и
передаёт через `src/tests/setup-env.ts`. Не вызывайте dotenv в каждом тестовом файле и не коммитьте
тестовые учётные данные.

Playwright получает окружение через процесс или контейнер. Различие между
`FRONT_PORT` и `PORT` описано в [справочнике env](../operations/environment.md).

Отчёты попадают в `test-results/`, `allure-results/` и артефакты Playwright. Эти каталоги
игнорируются Git. Не включайте их в коммит с кодом.

## Что запускать после изменения

| Изменение                   | Минимальная проверка                                       |
| --------------------------- | ---------------------------------------------------------- |
| Чистая функция или схема     | Узкий unit-тест и `npm run tsc`                            |
| Компонент React или Base UI | Компонентный тест и story для переиспользуемых визуальных состояний           |
| Маршрут или навигация        | Компонентный тест, узкий Playwright E2E или оба                  |
| Контракт или генерация OpenAPI    | `lint:openapi`, два `gen`, API-тесты, `tsc` для сгенерированного кода и корня проекта |
| Обработчик кеша или его переменные окружения | Unit-тесты, интеграционные тесты кеша и нужные сочетания development и production          |
| Окружение, конфигурация или proxy       | Unit-тесты, где возможно, и `npm run build`                |
| Развёртывание или заголовки      | Production-сборка и smoke через реальный proxy или ingress      |
| Документация                | Проверка смысла по коду и конфигурации                           |
| Исправление ошибки                     | Сначала минимальный регрессионный тест                        |

Чтобы запустить все проекты Vitest, измерить покрытие или следить за изменениями:

```bash
npm run test
npm run test:coverage
npm run test:watch
```

После узких тестов проверьте структуру, импорты, форматирование, lint и TypeScript
через `npm run verify:fast`.
`npm run verify` добавляет Knip, JSCPD, оба проекта Vitest и Playwright E2E в development.
Для production E2E отдельно выполните свежую сборку и установите `PLAYWRIGHT_SERVER_MODE=standalone`.

## Качество теста

- Проверяйте наблюдаемое поведение, а не внутреннее состояние.
- Используйте роли и доступные имена вместо хрупких CSS-селекторов.
- Ждите локатор, состояние или событие, а не произвольный тайм-аут.
- Контролируйте время, случайность и сеть.
- Мок-клиент создаёт изолированный Faker с заданным seed для каждого ответа. При прямом вызове
  фабрики передавайте управляемый Faker или переопределяйте значимые поля.
- При исправлении ошибки убедитесь, что тест падает на старом поведении и проходит на новом.
- Перед обновлением снимков проверьте смысл изменений.

## Связанные документы

- [Mock mode](../development/mock-mode.md)
- [API codegen](../development/api-codegen.md)
- [Deployment](../operations/deployment.md)
- [Переменные окружения](../operations/environment.md)

## Исторические проверки обновления 16 ноября 2026

Результаты ниже относятся к предыдущему обновлению зависимостей, до переноса тестов и stories.
Они не доказывают работоспособность текущего рабочего дерева. После изменений проверки нужно повторить.

Прошли 130 тестов в 42 файлах Vitest, пять E2E в development и пять в production. Также прошли корневая проверка TypeScript, lint, сборки Storybook и Next.js. Knip анализирует runtime и development вместе и читает локальный .env, если он существует. Сгенерированные экспорты исключены из проверки неиспользуемых экспортов, потому что их состав определяет OpenAPI. JSCPD проходит с 1,13% дублирования рукописного кода при неизменном пороге 2%. Машинные артефакты package-lock.json, src/api/codegen/** и src/api/bundled.yaml исключены. Приложение, тесты и stories проверяются. Число рассчитано на этом наборе файлов. Его нельзя напрямую сравнивать с прежними 3,2%, которые включали сгенерированный код.

Для E2E при занятом порте задайте оба значения, например FRONT_PORT=3117 PORT=3117. Конфигурация для development может использовать уже запущенный сервер. Убедитесь, что на выбранном порту работает этот проект.

## Общие метки Allure и дублирование

`src/tests/allure-labels.ts` назначает layer, feature и severity через общие setup hooks обоих проектов Vitest. Тест задаёт только свой сценарий через `await allure.story(...)`. При изменении общего helper проверьте содержимое Allure JSON. Успешного прохождения assertions для этого недостаточно. API browser test явно относится к API codegen.

Повторяющиеся блоки меток удалены из 13 файлов. Не повышайте порог JSCPD и не исключайте рукописные тесты или stories для обхода проверки. Сгенерированный код меняется через контракт или генератор и проверяется отдельно через `api:gen:check`.
