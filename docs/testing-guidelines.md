# Testing guidelines

> Тип: справочник + правила · Статус: актуально · Источник истины: `vitest.config.ts`,
> `playwright.config.ts`, `.storybook/` и npm scripts

В репозитории есть два Vitest projects, отдельный Playwright E2E runner и Storybook. Имя файла
определяет, какой project увидит test; неправильное имя может дать ложное ощущение покрытия.

## Матрица test files

| Вид       | Environment                 | Include patterns                                                                               |
| --------- | --------------------------- | ---------------------------------------------------------------------------------------------- |
| Unit      | Node                        | `**/*.unit.test.ts(x)`, `packages/**/*.test.ts`                                                |
| Component | Headless Chromium, real DOM | `**/*.component.test.ts(x)`, `app/**/*.test.tsx`, `src/**/*.test.tsx`                          |
| E2E       | Chromium, Firefox, WebKit   | `src/tests/e2e/**`                                                                             |
| Storybook | Browser preview             | `app/**/*.stories.tsx`, `packages/core/**/*.stories.tsx`, `src/**/*.stories.*`, `src/**/*.mdx` |

Критичные следствия:

- обычный `src/example.test.ts` не входит ни в один Vitest project — используйте
  `example.unit.test.ts`;
- `src/example.test.tsx` попадает в Component project даже без `.component.`;
- package-level `*.test.ts` попадает в Unit, но package-level `*.test.tsx` без `.component.` не
  покрывается общим package pattern;
- `.component.test.tsx` — предпочтительное явное имя для browser behavior независимо от каталога.

## Команды

```bash
# Все Vitest projects
npm run test

# По одному project
npm run test:unit
npm run test:component

# Один файл
npx vitest run src/mock-mode/runtime.unit.test.ts --project unit
npx vitest run src/components/utilities/error-boundary/error-boundary.test.tsx --project component

# API package
npm --workspace @repo/api run test

# Coverage и watch
npm run test:coverage
npm run test:watch

# Standalone E2E
npm run test:e2e
npx playwright test src/tests/e2e/example.spec.ts

# Storybook
npm run storybook
npm run build-storybook
```

Перед browser tests установите browsers. Для GitLab Vitest component job достаточно Chromium;
для полного локального Playwright набора нужны все configured engines:

```bash
npx playwright install --with-deps
```

## Unit tests

Unit project использует Node environment. Выбирайте его для чистых functions, schemas, plugins,
serialization, mock routing и server-independent logic.

Не подменяйте browser APIs самодельным jsdom setup. Если поведение зависит от layout, focus,
pointer/keyboard events, Base UI или hydration, пишите Component test.

`src/tests/setup-env.ts` запрещает незамоканный network: каждый вызов `fetch` по умолчанию бросает
ошибку. Явно mock transport/fetch или используйте generated mock client. Test не должен случайно
зависеть от доступного локального backend.

## Component tests

Component project запускается через `@vitest/browser-playwright` в реальном headless Chromium.
Рендер выполняется через `vitest-browser-react`, а assertions/interactions — через browser locators.

```tsx
import { expect, test } from 'vitest'
import { render } from 'vitest-browser-react'

test('submits a form', async () => {
    const screen = await render(<ExampleForm />)
    await screen.getByRole('button', { name: 'Save' }).click()
    await expect.element(screen.getByText('Saved')).toBeVisible()
})
```

Config заменяет `next/navigation`, `next/image` и `next/script` aliases из `src/tests/mocks`.
Сброс navigation mock выполняется после каждого browser test. Не добавляйте global mock для Base UI
компонента только ради удобства: проверяйте фактическое browser behavior.

Для visual state добавляйте Storybook story рядом с reusable component. Story не заменяет
interaction assertions, а Component test не заменяет ручной/visual review всех состояний.

## Playwright E2E

Playwright config использует `FRONT_PORT` (default `3000`) для `baseURL` и web-server probe.
Локально он поднимает `npm run dev` и переиспользует существующий server. При `CI=true` запускает
`npm run prod`, поэтому production build должен уже существовать.

Текущий `src/tests/e2e/example.spec.ts` открывает абсолютный `http://localhost:3000/`, а не
относительный `/`. Из-за этого non-default `FRONT_PORT` пока не работает для этого примера, даже
если config изменён. Исправление test — отдельная небольшая задача; до неё используйте порт 3000.

GitLab pipeline сейчас не запускает `npm run test:e2e` и не создаёт production build. Не трактуйте
зелёный CI как пройденный standalone E2E.

## Test environment

Vitest формирует allowlist variables сначала из `process.env`, затем из корневого `.env` и
инжектирует их через `src/tests/setup-env.ts`. Не вызывайте dotenv в каждом test file и не
коммитьте test credentials.

Playwright не использует этот Vitest mechanism: environment передаётся обычным process/container
способом. Полный список и различие `FRONT_PORT`/`PORT` — в [environment.md](environment.md).

Reporters создают `test-results/`, `allure-results/` и Playwright report artifacts. Они игнорируются
Git и не должны попадать в implementation commit.

## Что проверять по типу изменения

| Изменение                 | Минимум                                                   |
| ------------------------- | --------------------------------------------------------- |
| Pure utility/schema       | Узкий Unit test + `tsc`                                   |
| React/Base UI component   | Component test; story для reusable visual states          |
| Route/navigation behavior | Component test и/или узкий Playwright E2E                 |
| OpenAPI contract          | `lint:openapi`, `gen`, API tests, `tsc`, generation drift |
| Env/config/proxy          | Unit tests где возможно + `build`                         |
| Deployment/headers        | Production build и smoke через реальный proxy/ingress     |
| Bug fix                   | Сначала минимальный regression test                       |

После узких tests запускайте `npm run verify:fast`. Перед merge существенного изменения — полный
релевантный набор; `npm run verify` дополнительно выполняет Knip, JSCPD, оба Vitest projects и
standalone Playwright E2E.

## Качество теста

- Проверяйте наблюдаемое поведение, а не внутренние state/implementation details.
- Используйте accessible roles/names вместо хрупких CSS selectors.
- Не используйте arbitrary timeout; ожидайте locator/state/event.
- Контролируйте время, randomness и network явно.
- Generated Faker factories детерминированы; задавайте overrides, когда нужны разные значения.
- Для bug fix убедитесь, что test падает на старом поведении и проходит после исправления.
- Не обновляйте snapshots вслепую; прочитайте semantic diff.

## Связанные документы

- [Mock mode](mock-mode.md)
- [API codegen](api-codegen.md)
- [Deployment](deployment.md)
- [Environment](environment.md)
