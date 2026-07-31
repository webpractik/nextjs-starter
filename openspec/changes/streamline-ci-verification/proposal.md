## Why

Текущий GitLab CI проверяет только TypeScript и собирает production bundle, но не запускает
остальные code-quality проверки и Vitest. При этом CI и Lefthook вручную дублируют отдельные
команды, поэтому локальные и серверные quality gates легко расходятся.

## What Changes

- Добавить корневые npm-команды `verify` для полного локального прогона code quality, Vitest и
  Playwright E2E, а также `verify:fast` для быстрого набора format/lint/typecheck проверок.
- Перевести GitLab CI со stage `build` на последовательные stages `codequality` и `test`, сохранив
  существующую точку расширения `deploy`.
- Запускать в `codequality` команду `npm run verify:fast`, а в `test` — все настроенные
  Vitest-проекты через `npm run test`.
- Исключить из CI standalone Playwright E2E (`npm run test:e2e` / `playwright test`), запуск
  Next.js-сервера и зависимость тестового stage от production build.
- Перевести pre-commit проверки Lefthook на `npm run verify:fast`, сохранив автоматическое
  форматирование staged-файлов.
- **BREAKING (CI)**: удалить production build job, его `.next` artifacts и прежний typecheck job;
  CI больше не предоставляет собранный standalone bundle последующим jobs.

## Capabilities

### New Capabilities

- `repository-verification`: Единый контракт npm-команд для полного локального прогона и быстрой
  статической проверки, используемой GitLab CI и pre-commit hooks, плюс отдельный Vitest gate в
  CI.

### Modified Capabilities

None.

## Impact

- Affected configuration: `package.json`, `lefthook.yml`, `.gitlab-ci.yml` и файлы jobs в
  `.gitlab/`.
- CI topology: stages `codequality` и `test` заменяют `build`; `deploy` остаётся после них.
- Tooling: npm/Node.js 24 остаются единственным способом установки и запуска; Playwright E2E
  включается в локальный `verify`, но не входит в новый CI pipeline; Next.js build остаётся
  отдельной локальной командой.
- Runtime application code, public packages, API contracts и production behavior не меняются.
