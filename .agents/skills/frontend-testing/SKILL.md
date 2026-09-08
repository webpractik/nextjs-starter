---
name: frontend-testing
description: >-
  Использовать обязательно при audit, plan, implementation и diagnosis тестов
  React 18/19 и Next.js App Router/Pages Router: Vitest или Jest, React Testing
  Library, Playwright E2E, Allure labels, flaky tests, isolation и ускорение
  test suite.
---

# React и Next.js frontend testing

Проверяй наблюдаемое поведение через самую дешёвую границу, которая действительно
доказывает критерий или риск. Совместимость ограничена React 18 и React 19,
Next.js App Router и Pages Router с установленными project-local tools.

## Критические gates

### Режим и право на изменения

Сначала зафиксируй один режим:

- `audit` — только findings по существующим тестам и конфигурации;
- `plan` — сценарии, уровни, данные, порядок и реальные команды без writes;
- `implementation` — разрешённые тестовые изменения через TDD;
- `diagnosis` — воспроизведение и root cause без fix, пока его не запросили.

Не расширяй read-only запрос до правок. Не вводи runner, adapter, reporter,
mocking library или массовую миграцию без явного разрешения.

### Обязательные specialist skills

- Для подтверждённой Vitest-задачи полностью прочитай установленный skill vitest
  до любых version-specific решений.
- Для подтверждённой Playwright-задачи полностью прочитай установленный skill playwright-best-practices
  до любых version-specific решений.
- Если обязательный specialist skill missing или недоступен, останови
  version-specific writes и передай blocker; не подменяй его похожим skill.
- Missing playwright-best-practices не устанавливай автоматически; предложи
  `npx skills add https://github.com/currents-dev/playwright-best-practices-skill
  --skill playwright-best-practices` и дождись разрешения пользователя.

Для Jest и React Testing Library сверяй version-specific API с manifest,
lockfile, локальными тестами и официальной документацией установленной версии.

### Обязательные Allure labels

- Каждый runnable test/it callback обязан до subject-specific setup вызвать и
  await allure.labels(...) из allure-js-commons с layer, feature, story,
  severity.
- `beforeEach`, suite metadata, title tags и `globalLabels` не заменяют этот
  per-test Runtime API; для `test.each` вызывай labels внутри callback.
- До записи или изменения любого теста полностью прочитай
  [Allure labels](references/allure-labels.md).
- Если совместимый adapter и emitted-result pipeline не подтверждены, останови
  test writes и передай blocker либо запроси разрешение на setup.

Требование пользователя к Allure имеет приоритет над локальной краткостью или
существующими тестами без labels. Не объявляй compliance по одному source scan.

## Discovery до решений

Для затронутого package прочитай:

1. ближайшие repository instructions, manifest и lockfile;
2. версии React, Next.js, runner, renderer, browser tool и Allure adapter;
3. `app`/`pages` route tree, server/client boundaries и mixed-router участки;
4. test config, setup, environments, helpers, fixtures, mocks и соседние тесты;
5. package scripts и CI workflow, включая artifacts и report merge;
6. текущий diff и baseline релевантной проверки.

Не выдумывай команды, filter syntax, taxonomy, owner или business rule.
Используй существующие scripts из правильного cwd. При смешанном repository
классифицируй каждый затронутый маршрут отдельно.

## Сценарии и риск

Построй цепочку:

```text
criterion/risk -> observable scenario -> layer -> data/boundary -> test -> evidence
```

Для сценария зафиксируй initial state/role/data, действие или stimulus,
наблюдаемый исход, critical negative path и применимые
loading/empty/error/success states.

| Риск | Примеры | Минимальная граница |
| --- | --- | --- |
| Критический | auth, permissions, payment, loss/exposure данных | реальный route/session flow плюс focused logic |
| Высокий | главная mutation, routing, cache/revalidation | integration; E2E для browser/framework effects |
| Средний | форма, component state, error handling | unit или component/integration |
| Низкий | безопасный refactor, статический контракт | static или focused characterization |

При неопределённости подними риск и запиши вопрос; не принимай residual risk за
владельца продукта.

## Выбор React/Next границы

| Surface | Предпочтительный уровень |
| --- | --- |
| Pure validator/mapper/reducer | unit |
| React component, hook, provider, Suspense | component/integration через public DOM/contract |
| App Router Client Component | component/integration |
| Sync Server Component | только подтверждённый project renderer |
| async Server Component | E2E по умолчанию |
| Route Handler | Request/Response integration |
| Server Action с framework effects | E2E; чистую логику вынеси в unit |
| Pages Router data function | unit/integration по return contract |
| Реальные navigation, history, cookies, session, hydration | E2E |

Не заменяй browser contract unit-тестом mock router. Не опускай чистую логику в
E2E, если её дешевле и точнее доказать unit-тестом.

## Реализация через TDD

Для feature или bugfix:

1. Напиши минимальный тест отсутствующего/сломавшегося поведения со всеми
   обязательными Allure labels.
2. Запусти его и подтверди RED по ожидаемой причине, а не setup/syntax/fixture.
3. Внеси минимальную реализацию и подтверди GREEN.
4. Сделай REFACTOR, не ослабляя assertions, labels и isolation.
5. Запусти focused test, релевантный suite и существующие project gates.

Для чистого refactor сначала получи зелёный characterization test. Проверяй DOM,
accessibility tree, URL, Response, persisted data или другой public outcome; не
private state, JSX structure, handler calls или arbitrary sleep.

## Маршрутизация references

Прочитай только относящиеся к задаче владельцы, но всегда загружай React и
Allure policy перед test writes:

- [React 18/19](references/react-18-19-testing.md) — components, hooks,
  providers, Suspense, act и hydration boundary.
- [Next.js App Router](references/next-app-router-testing.md) — Server/Client
  Components, route outcomes, handlers, actions, streaming и navigation.
- [Next.js Pages Router](references/next-pages-router-testing.md) — page UI,
  data functions, next/router, preview и API routes.
- [Test data, network, boundaries](references/test-data-network-and-boundaries.md)
  — mocks, fixtures, server/client determinism, workers и cleanup.
- [Allure labels](references/allure-labels.md) — обязательный per-test contract,
  adapters, exceptions и emitted-result verification.
- [Diagnosis and verification](references/diagnosis-performance-and-verification.md)
  — flaky root cause, suite performance, evidence и handoff.

## Output contracts

### audit

Выдай findings по severity с file/line evidence, impact, рекомендацией и
открытыми вопросами. Отдельно перечисли callbacks без Allure contract,
непроверенные browser boundaries и flaky masking.

### plan

Выдай mapping сценариев в layer/files, данные и boundaries, TDD-порядок,
реальные команды, Allure taxonomy, assumptions, excluded scope и residual risk.

### implementation

Передай изменённые behavior contracts и файлы, RED/GREEN evidence, labels,
выполненные команды с exit status и оставшиеся ограничения.

### diagnosis

Передай reproduction, artifacts, подтверждённый или вероятный root cause с
confidence, исключённые гипотезы и следующий минимальный experiment. Fix держи
отдельно до разрешения.

## Verification и Definition of Done

Перед готовностью выполни самый узкий доказательный тест, релевантный suite,
существующие static/type/build gates и реальный browser run для browser
contract. Для Allure отдельно докажи source compliance и labels в emitted
result. Запиши command, cwd, exit status и краткий результат каждой проверки.

Работа завершена, когда:

- каждый in-scope criterion/risk имеет автоматизированное evidence или явно
  переданный residual risk;
- каждый runnable callback содержит awaited `allure.labels` с четырьмя labels;
- использованы обязательные runner specialist skills;
- тесты проходят отдельно, в произвольном порядке и с project parallelism;
- новые failures отделены от pre-existing, а pending/manual не названы pass;
- не заявлены непроверенные browser outcome, Allure report или ускорение suite.
