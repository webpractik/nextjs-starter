---
type: workflow
title: Тесты и проверка качества
description: Тесты и проверка качества в Next.js Starter, инструкции и проверяемые контракты.
tags: [nextjs, starter, workflow]
sources:
  - id: openwiki-source-8a8b78afd6e03e85194289b4
    resource: repo://.jscpd.json
  - id: openwiki-source-5b54a58d1b51cd490b0e7162
    resource: repo://package.json
  - id: openwiki-source-5e753d9d77984cb67aae1517
    resource: repo://playwright.config.ts
  - id: openwiki-source-ce7f77c99e4eeaf6bd1d8f05
    resource: repo://src/api/schemas.test.ts
  - id: openwiki-source-213b041a521bfb74f76bc155
    resource: repo://src/tests/allure-labels.ts
  - id: openwiki-source-22df64ef67f337cc601445d9
    resource: repo://src/tests/setup-allure-component.ts
  - id: openwiki-source-b333c6e46143ea4db8da3227
    resource: repo://src/tests/setup-allure-unit.ts
  - id: openwiki-source-fbadcd8591b65031efaaedce
    resource: repo://vitest.config.ts
generated: { by: "codex", at: "2026-11-16T14:41:28.183Z" }
verified:
  - by: openwiki/0.7.2
    at: 2026-11-16T14:41:28.183Z
---

# Тестирование

В проекте есть два проекта Vitest, Playwright E2E и Storybook. Имя файла определяет запуск:
используйте суффиксы `.unit.test` и `.component.test`, чтобы тест не потерялся.

> Источники истины: `vitest.config.ts`, `playwright.config.ts`, `.storybook/` и npm scripts.

Vitest и browser/coverage packages зафиксированы на 5.1.0. Storybook addon-vitest 10.6.7
объявляет поддержку Vitest 5. Allure 3.14.0 требует явного peer `@vitest/runner@4.1.11` для
Node reporter; браузерный alias `src/tests/mocks/vitest-runner.ts` направляет чтение текущего
теста на bundled `TestRunner` Vitest 5. Это сохраняет runtime labels в emitted reports.

В Vitest 5 `toHaveTextContent` проверяет точное совпадение строки. Для прежней проверки
подстроки или регулярного выражения используйте `toMatchTextContent`.

## Какой runner выбрать

| Что проверяем | Среда                       | Какие файлы запускаются                                               |
| ------------- | --------------------------- | --------------------------------------------------------------------- |
| Unit          | Node                        | `**/*.unit.test.ts(x)`, `src/api/**/*.test.ts`                        |
| Component     | Headless Chromium, real DOM | `**/*.component.test.ts(x)`, `app/**/*.test.tsx`, `src/**/*.test.tsx` (кроме `*.unit.test.tsx`) |
| E2E           | Chromium                    | `src/tests/e2e/**/*.@(spec\|test).?(c\|m)[jt]s?(x)`                   |
| Storybook     | Browser preview             | `app/**/*.stories.tsx`, `src/**/*.stories.*`, `src/**/*.mdx`          |

У выбора файлов есть исключения:

- `src/example.test.ts` не входит ни в один проект Vitest. Назовите файл
  `example.unit.test.ts`.
- `src/example.test.tsx` попадает в компонентный проект даже без `.component.`.
- `src/api/example.test.ts` попадает в модульный проект.

Chromium устанавливается один раз после `npm ci`:

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
npx vitest run src/mock-mode/runtime.unit.test.ts --project unit

# Тесты API
npm run api:test
```

Модульный проект работает в Node; не добавляйте самодельный jsdom. Макет, фокус, события указателя
и клавиатуры, Base UI и гидратацию проверяйте компонентным тестом.

`src/tests/setup-env.ts` подменяет `fetch`: запросы без моков падают. Подменяйте транспорт или
`fetch` либо используйте сгенерированный мок-клиент; модульным тестам не нужен запущенный бэкенд.

Для `#/api` отдельно проверяйте транспорт, конфиг клиента, сценарии моков и независимые
постгенераторы. После изменения этапов генерации или OpenAPI запускайте полный `gen`, включая
корневую проверку TypeScript со сгенерированным кодом.

```bash
npx vitest run src/api/client-config.unit.test.ts src/api/mock-client.test.ts src/api/mock-scenarios.test.ts --project unit
npx vitest run src/api/generators --project unit
npm run api:gen
```

## Компонентные тесты

Компонентный проект использует `@vitest/browser-playwright` и реальный headless Chromium.
`vitest-browser-react` рендерит компоненты, браузерные локаторы проверяют взаимодействия.

```bash
# Весь Component project
npm run test:component

# Один файл
npx vitest run src/components/utilities/error-boundary/error-boundary.test.tsx --project component
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

Проверяйте Base UI в браузере, не подменяя глобальным моком ради удобства. Состояния общего
компонента опишите в Storybook: история не заменяет тест взаимодействий, а компонентный тест —
визуальное ревью всех состояний.

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

Конфигурации GitHub Actions и GitLab CI удалены. E2E и production-сборка запускаются локально.

## Storybook

В Storybook просматривают состояния общих UI-компонентов и вручную проверяют доступность.

```bash
# Локальный preview
npm run storybook

# Проверка production Storybook build
npm run build-storybook
```

Размещайте историю рядом с общим компонентом. Поведение покрывайте компонентным тестом.

## Как называть тесты

Новые и изменяемые `test`/`it` называйте по-русски, описывая поведение глаголом настоящего времени:
`возвращает`, `показывает`,
`блокирует`, `сохраняет`.

| Хорошо                                     | Плохо                       | Почему                                   |
| ------------------------------------------ | --------------------------- | ---------------------------------------- |
| `возвращает пустое тело для ответа 204`    | `обработка ответа 204`      | Нет действия и результата                |
| `показывает ошибку после потери фокуса`    | `должен работать корректно` | Неясно, что ожидается                    |
| `отправляет форму с валидными значениями`  | `проверяет submitForm`      | Описана реализация, а не поведение       |
| `игнорирует cookie mock-mode в production` | `calls setState`            | Английский текст и implementation detail |

`describe` тоже пишите по-русски, называя объект или контекст проверки. Идентификаторы вроде
`mock-mode`, `NEXT_PUBLIC_BFF_PATH` и методов API не переводите.

Файлы называйте по-английски и шаблонам первой таблицы: `registration-form.component.test.tsx`.
Переводите название теста при его изменении; массовое переименование делайте отдельно.

## Параллельное выполнение

Тесты уже запускаются параллельно: создавайте данные и очищайте состояние в каждом. Не делите
запись БД, аккаунт, очередь, временный путь, cookie/storage или синглтон модуля.

### Vitest

Vitest запускает файлы параллельно в воркерах, тесты внутри файла — последовательно.
`test.concurrent` и `describe.concurrent` подходят только независимым асинхронным тестам,
ожидающим преимущественно I/O или таймеры: `Promise.all` в одном воркере не ускоряет синхронные вычисления.

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
`page` и `context` изолированы для каждого теста: не храните их в переменной модуля и не создавайте
однократно в `beforeAll`.

Делайте внешние данные уникальными для теста или воркера. Дорогой ресурс можно вынести в фикстуру
воркера с пространством имён, например по `workerInfo.workerIndex`. `serial` допустим лишь для неизолируемой
последовательности с общим состоянием; обычно лучше один E2E-тест или разделение данных.

```bash
# Workers на одной машине
npx playwright test --workers=4

# Диагностика race condition
npx playwright test --workers=1
```

Воркеры делят тесты на одной машине, шарды — между задачами CI:

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
игнорируются Git: не включайте их в коммит с кодом.

## Что запускать после изменения

| Изменение                   | Минимальная проверка                                       |
| --------------------------- | ---------------------------------------------------------- |
| Pure utility или schema     | Узкий Unit test + `npm run tsc`                            |
| React или Base UI component | Component test; story для reusable visual states           |
| Route или navigation        | Component test и/или узкий Playwright E2E                  |
| OpenAPI contract/codegen    | `lint:openapi`, два `gen`, API tests, generated/root `tsc` |
| Cache handler или cache env | Unit + cache integration + нужная dev/prod matrix          |
| Env, config или proxy       | Unit tests, где возможно, + `npm run build`                |
| Deployment или headers      | Production build + smoke через реальный proxy/ingress      |
| Документация                | Semantic review по коду и config                           |
| Bug fix                     | Сначала минимальный regression test                        |

Чтобы запустить все проекты Vitest, измерить покрытие или следить за изменениями:

```bash
npm run test
npm run test:coverage
npm run test:watch
```

После узких тестов проверьте форматирование, lint и TypeScript через `npm run verify:fast`.
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

## Проверки после обновления 16 ноября 2026

Прошли 130 тестов в 42 Vitest файлах, пять E2E в development и пять в production, root TypeScript, lint, Storybook и Next build. Knip анализирует runtime и development вместе и читает локальный .env, если он существует. Generated exports исключены из анализа unused exports, потому что их поверхность определяется OpenAPI. JSCPD проходит с 1,13% дублирования рукописного кода при неизменном пороге 2%. Машинные артефакты package-lock.json, src/api/codegen/** и src/api/bundled.yaml исключены; приложение, тесты и stories проверяются. Число рассчитано на этом наборе файлов и напрямую не сравнивается с прежними 3,2%, включавшими generated output.

Для E2E при занятом порте задайте оба значения, например FRONT_PORT=3117 PORT=3117. Development config может переиспользовать уже запущенный сервер, поэтому убедитесь, что на выбранном порту работает этот проект.

## Общие метки Allure и дублирование

`src/tests/allure-labels.ts` назначает layer, feature и severity через общие setup hooks обоих Vitest projects. Тест задаёт только свой сценарий через `await allure.story(...)`. При изменении общего helper проверьте фактические Allure JSON, а не только прохождение assertions. API browser test явно относится к API codegen.

Повторяющиеся блоки меток удалены из 13 файлов. Не повышайте JSCPD threshold и не исключайте рукописные тесты или stories для обхода проверки. Generated output меняется через контракт/генератор и проверяется отдельным `api:gen:check`.
