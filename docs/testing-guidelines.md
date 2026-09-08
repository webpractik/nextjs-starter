# Тестирование

В проекте есть два проекта Vitest, Playwright E2E и Storybook. Имя файла определяет запуск:
используйте суффиксы `.unit.test` и `.component.test`, чтобы тест не потерялся.

> Источники истины: `vitest.config.ts`, `playwright.config.ts`, `.storybook/` и npm scripts.

Vitest и пакеты `@vitest/*` зафиксированы на `4.1.11`: `@storybook/addon-vitest@10.6.0`
объявляет совместимость только с Vitest 3 и 4. Переход на Vitest 5 требует поддержки аддона,
синхронного обновления всех пакетов запуска и проверки генераторов отчётов, браузерных тестов и Storybook.

## Какой runner выбрать

| Что проверяем | Среда                       | Какие файлы запускаются                                                                        |
| ------------- | --------------------------- | ---------------------------------------------------------------------------------------------- |
| Unit          | Node                        | `**/*.unit.test.ts(x)`, `packages/**/*.test.ts`                                                |
| Component     | Headless Chromium, real DOM | `**/*.component.test.ts(x)`, `app/**/*.test.tsx`, `src/**/*.test.tsx`                          |
| E2E           | Chromium                    | `src/tests/e2e/**/*.@(spec\|test).?(c\|m)[jt]s?(x)`                                            |
| Storybook     | Browser preview             | `app/**/*.stories.tsx`, `packages/core/**/*.stories.tsx`, `src/**/*.stories.*`, `src/**/*.mdx` |

У выбора файлов есть исключения:

- `src/example.test.ts` не входит ни в один проект Vitest. Назовите файл
  `example.unit.test.ts`.
- `src/example.test.tsx` попадает в компонентный проект даже без `.component.`.
- `packages/example.test.ts` попадает в модульный проект.
- `packages/example.test.tsx` без `.component.` не соответствует общему шаблону файлов пакетов.

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

# Тесты API workspace
npm --workspace @repo/api run test
```

Модульный проект работает в Node; не добавляйте самодельный jsdom. Макет, фокус, события указателя
и клавиатуры, Base UI и гидратацию проверяйте компонентным тестом.

`src/tests/setup-env.ts` подменяет `fetch`: запросы без моков падают. Подменяйте транспорт или
`fetch` либо используйте сгенерированный мок-клиент; модульным тестам не нужен запущенный бэкенд.

Для `@repo/api` отдельно проверяйте транспорт, конфиг клиента, сценарии моков и независимые
постгенераторы. После изменения этапов генерации или OpenAPI запускайте полный `gen`, включая
корневую проверку TypeScript со сгенерированным кодом.

```bash
npx vitest run packages/api/client-config.unit.test.ts packages/api/mock-client.test.ts packages/api/mock-scenarios.test.ts --project unit
npx vitest run packages/api/generators --project unit
npm --workspace @repo/api run gen
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

GitLab CI пока не запускает E2E и production-сборку; его успех не означает успешный production E2E.

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
`FRONT_PORT` и `PORT` описано в [справочнике env](environment.md).

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
`npm run verify` добавляет Knip, JSCPD, оба проекта Vitest, свежую сборку и standalone
Playwright E2E.

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

- [Mock mode](mock-mode.md)
- [API codegen](api-codegen.md)
- [Deployment](deployment.md)
- [Переменные окружения](environment.md)
