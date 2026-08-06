# Тестирование

В проекте есть два Vitest projects, Playwright E2E и Storybook. Главное правило: имя файла
определяет, какой runner увидит тест. Используйте явные суффиксы `.unit.test` и
`.component.test`, чтобы тест не потерялся.

> Источники истины: `vitest.config.ts`, `playwright.config.ts`, `.storybook/` и npm scripts.

## Какой runner выбрать

| Что проверяем | Среда                       | Какие файлы запускаются                                                                        |
| ------------- | --------------------------- | ---------------------------------------------------------------------------------------------- |
| Unit          | Node                        | `**/*.unit.test.ts(x)`, `packages/**/*.test.ts`                                                |
| Component     | Headless Chromium, real DOM | `**/*.component.test.ts(x)`, `app/**/*.test.tsx`, `src/**/*.test.tsx`                          |
| E2E           | Chromium                    | `src/tests/e2e/**/*.@(spec\|test).?(c\|m)[jt]s?(x)`                                            |
| Storybook     | Browser preview             | `app/**/*.stories.tsx`, `packages/core/**/*.stories.tsx`, `src/**/*.stories.*`, `src/**/*.mdx` |

Обратите внимание на исключения:

- `src/example.test.ts` не входит ни в один Vitest project. Назовите файл
  `example.unit.test.ts`.
- `src/example.test.tsx` попадает в Component project даже без `.component.`.
- `packages/example.test.ts` попадает в Unit project.
- `packages/example.test.tsx` без `.component.` не попадает под общий package pattern.

Chromium устанавливается один раз после `npm ci`:

```bash
# macOS
npx playwright install chromium

# Linux и CI: Chromium вместе с системными библиотеками
npx playwright install --with-deps chromium
```

## Unit-тесты

Используйте Unit project для чистых функций, schemas, plugins, serialization, mock routing и
логики, которая не зависит от браузера.

```bash
# Весь Unit project
npm run test:unit

# Один файл
npx vitest run src/mock-mode/runtime.unit.test.ts --project unit

# Тесты API workspace
npm --workspace @repo/api run test
```

Unit project работает в Node. Не добавляйте самодельный jsdom setup. Если тест зависит от layout,
focus, pointer/keyboard events, Base UI или hydration, используйте Component project.

`src/tests/setup-env.ts` подменяет `fetch`: любой незамоканный network request падает с ошибкой.
Явно mock transport или `fetch`, либо используйте generated mock client. Unit test не должен
случайно зависеть от запущенного backend.

Для `@repo/api` отдельно проверяйте transport, client config, mock scenarios и независимые
post-generators. После изменения pipeline или OpenAPI запускайте полный `gen`: он завершается
root TypeScript check, который включает generated output.

```bash
npx vitest run packages/api/client-config.unit.test.ts packages/api/mock-client.test.ts packages/api/mock-scenarios.test.ts --project unit
npx vitest run packages/api/generators --project unit
npm --workspace @repo/api run gen
```

## Компонентные тесты

Component project запускается через `@vitest/browser-playwright` в реальном headless Chromium.
Компоненты рендерятся через `vitest-browser-react`, а взаимодействия проверяются browser
locators.

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

Config подменяет `next/navigation`, `next/image` и `next/script` aliases из
`src/tests/mocks`. Navigation mock сбрасывается после каждого browser test.

Не добавляйте глобальный mock Base UI только ради удобства: проверяйте реальное browser behavior.
Для визуальных состояний reusable-компонента добавьте Storybook story. Story не заменяет
interaction test, а Component test не заменяет visual review всех состояний.

## E2E-тесты в Playwright

E2E проверяет приложение через Chromium. Tests открывают относительные URL, а
`playwright.config.ts` формирует `baseURL` из `FRONT_PORT`, по умолчанию `3000`.

### Локальная проверка на development server

```bash
# Вся E2E suite; Playwright сам поднимет npm run dev
npm run test:e2e

# Один файл
npx playwright test src/tests/e2e/example.spec.ts
```

В development mode Playwright переиспользует уже запущенный server.

GitLab pipeline сейчас не запускает E2E и не создаёт production build. Зелёный CI не означает,
что production E2E прошёл.

## Storybook

Storybook нужен для просмотра состояний reusable UI и ручной проверки accessibility.

```bash
# Локальный preview
npm run storybook

# Проверка production Storybook build
npm run build-storybook
```

Story располагайте рядом с reusable component. Интерактивное поведение всё равно покрывайте
Component test.

## Как называть тесты

Человекочитаемые названия новых и изменяемых `test`/`it` пишите по-русски. Начинайте с глагола
в настоящем времени и описывайте наблюдаемое поведение: `возвращает`, `показывает`,
`блокирует`, `сохраняет`.

| Хорошо                                     | Плохо                       | Почему                                   |
| ------------------------------------------ | --------------------------- | ---------------------------------------- |
| `возвращает пустое тело для ответа 204`    | `обработка ответа 204`      | Нет действия и результата                |
| `показывает ошибку после потери фокуса`    | `должен работать корректно` | Неясно, что ожидается                    |
| `отправляет форму с валидными значениями`  | `проверяет submitForm`      | Описана реализация, а не поведение       |
| `игнорирует cookie mock-mode в production` | `calls setState`            | Английский текст и implementation detail |

`describe` тоже пишите по-русски: это название subject или context. Технические identifiers,
например `mock-mode`, `NEXT_PUBLIC_BFF_PATH` и API methods, не переводите.

Имена файлов остаются английскими и следуют patterns из первой таблицы:
`registration-form.component.test.tsx`. Существующее английское название теста переводите, когда
меняете этот тест. Массовое переименование всей suite выполняйте отдельной задачей.

## Параллельное выполнение

Runners уже используют параллелизм. Каждый тест должен сам создавать данные и очищать mutable
state. Не делите между параллельными тестами один database record, account, queue, temporary path,
cookie/storage или module singleton.

### Vitest

Vitest запускает файлы параллельно в workers, а tests внутри файла — последовательно.
`test.concurrent` и `describe.concurrent` используйте только для независимых async-тестов,
которые в основном ждут I/O или timers. Они выполняются через `Promise.all` в том же worker и не
ускоряют синхронный CPU-bound код.

Не используйте concurrent mode вместе с общими `vi.stubEnv`, `vi.stubGlobal`, fake timers,
module mocks или browser DOM. В concurrent test берите `expect` и `onTestFinished` из локального
Test Context.

```bash
# Ограничить workers на одной машине
npx vitest run --project unit --maxWorkers=4

# Диагностика race condition
npx vitest run --project unit --maxWorkers=1
```

### Playwright

В config включён `fullyParallel: true`, поэтому параллельно могут выполняться и files, и отдельные
tests. Используйте встроенные fixtures `page` и `context`: они изолированы для каждого теста.
Не сохраняйте их в module variable и не создавайте один раз в `beforeAll`.

Внешние данные делайте уникальными для test/worker. Дорогой ресурс можно оформить как worker-scoped
fixture с отдельным namespace, например по `workerInfo.workerIndex`. `serial` допустим только для
неизолируемой stateful sequence; обычно её лучше объединить в один E2E test или разделить данные.

```bash
# Workers на одной машине
npx playwright test --workers=4

# Диагностика race condition
npx playwright test --workers=1
```

Workers делят suite на одной машине, shards — между CI jobs:

```bash
npx vitest run --project unit --shard=1/2
npx playwright test --shard=1/2
```

Для shards нужны отдельные artifact paths. Playwright reports объединяйте через blob reporter и
`playwright merge-reports`. Текущий pipeline не настраивает sharding или merge reports.

Подробнее: [Vitest parallelism](https://vitest.dev/guide/parallelism.html),
[Playwright parallelism](https://playwright.dev/docs/test-parallel) и
[Playwright sharding](https://playwright.dev/docs/test-sharding).

## Среда тестов и артефакты

Vitest берёт разрешённые env values сначала из `process.env`, затем из корневого `.env`, и
передаёт их через `src/tests/setup-env.ts`. Не вызывайте dotenv в каждом test file и не коммитьте
test credentials.

Playwright не использует этот механизм: env передаётся через process или container. Различие между
`FRONT_PORT` и `PORT` описано в [справочнике env](environment.md).

Reporters создают `test-results/`, `allure-results/` и Playwright report artifacts. Эти
директории игнорируются Git и не должны попадать в implementation commit.

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

Для всех Vitest projects, coverage и watch mode:

```bash
npm run test
npm run test:coverage
npm run test:watch
```

После узких тестов запустите `npm run verify:fast`: он проверяет formatting, lint и TypeScript.
`npm run verify` дополнительно запускает Knip, JSCPD, оба Vitest projects, fresh build и standalone
Playwright E2E.

## Качество теста

- Проверяйте наблюдаемое поведение, а не внутренний state.
- Используйте accessible roles и names вместо хрупких CSS selectors.
- Не ставьте arbitrary timeout; ждите locator, state или event.
- Явно контролируйте время, randomness и network.
- Runtime mock client создаёт изолированный seeded Faker на каждый response. При прямом вызове
  factory передавайте контролируемый Faker или overrides для значимых полей.
- Для bug fix убедитесь, что тест падает на старом поведении и проходит после исправления.
- Не обновляйте snapshots вслепую: сначала прочитайте semantic diff.

## Связанные документы

- [Mock mode](mock-mode.md)
- [API codegen](api-codegen.md)
- [Deployment](deployment.md)
- [Переменные окружения](environment.md)
