## ADDED Requirements

### Requirement: Canonical code-quality commands

Корневой npm manifest SHALL предоставлять `verify:fast` как быстрый code-quality gate и `verify`
как полный code-quality gate. `verify:fast` SHALL запускать format check, lint и TypeScript
typecheck; `verify` SHALL дополнительно запускать проверки unused code и code duplication. Любая
ошибка вложенной команды MUST завершать соответствующий gate с ненулевым exit code.

#### Scenario: Быстрая проверка проходит

- **WHEN** разработчик запускает `npm run verify:fast` в корректно отформатированном, типизированном
  и lint-clean рабочем дереве
- **THEN** format check, lint и TypeScript typecheck завершаются успешно без запуска Knip, JSCPD,
  Vitest, Playwright E2E или Next.js build

#### Scenario: Полная code-quality проверка проходит

- **WHEN** разработчик или CI запускает `npm run verify`
- **THEN** выполняется весь `verify:fast`, после него Knip и JSCPD, а итоговый exit code отражает
  результат всех выполненных проверок

#### Scenario: Вложенная проверка завершается ошибкой

- **WHEN** любая команда, входящая в `verify:fast` или `verify`, возвращает ненулевой exit code
- **THEN** соответствующая npm-команда также завершается с ненулевым exit code и последующие
  проверки в последовательности не запускаются

### Requirement: Reproducible verification dependencies

Все binaries, вызываемые `verify:fast` и `verify`, MUST разрешаться из exact dependencies,
зафиксированных в `package-lock.json`, и verification MUST NOT загружать незакреплённые пакеты во
время выполнения.

#### Scenario: Чистая установка готова к полной проверке

- **WHEN** окружение выполняет `npm ci` по закоммиченному `package-lock.json`, а затем
  `npm run verify`
- **THEN** все code-quality binaries доступны локально без интерактивного подтверждения или
  разрешения версии из сети во время verification run

### Requirement: CI quality and test topology

GitLab CI SHALL объявлять последовательные stages `codequality`, `test` и `deploy`. Stage
`codequality` SHALL содержать job, вызывающий `npm run verify`, а stage `test` SHALL содержать job,
вызывающий `npm run test`. Оба jobs MUST использовать Node.js 24, `npm ci` и cache key, связанный с
`package-lock.json`.

#### Scenario: Code-quality gate останавливает pipeline

- **WHEN** `npm run verify` завершается ошибкой в job stage `codequality`
- **THEN** pipeline завершается ошибкой до запуска stage `test` и `deploy`

#### Scenario: Vitest gate запускается после code quality

- **WHEN** job stage `codequality` завершился успешно
- **THEN** job stage `test` выполняет `npm run test` и передаёт его exit code GitLab CI

#### Scenario: Deploy остаётся последним extension point

- **WHEN** jobs stages `codequality` и `test` завершились успешно и deploy job настроен
- **THEN** GitLab запускает его в stage `deploy` без неявной зависимости от `.next` build artifacts

### Requirement: CI excludes production build and standalone E2E

Новый CI graph MUST NOT объявлять stage или job `build`, создавать `.next` artifacts, запускать
Next.js build/server либо вызывать `npm run test:e2e` или `playwright test`. Test job SHALL запускать
все projects, выбранные текущей командой `vitest run`, включая настроенный Vitest component
project; использование его browser provider не считается отдельным Playwright E2E run.

#### Scenario: Pipeline выполняет только verification gates

- **WHEN** GitLab создаёт pipeline по корневому CI config
- **THEN** до опционального deploy доступны только stages `codequality` и `test`, а graph не
  содержит прежние `typecheck` и `build` jobs

#### Scenario: Test job не поднимает приложение

- **WHEN** CI выполняет test job
- **THEN** job запускает Vitest без `next build`, `next dev`, `next start` и без Playwright E2E
  runner

#### Scenario: Vitest component tests остаются включены

- **WHEN** `npm run test` выбирает Vitest projects `unit` и `component`
- **THEN** CI предоставляет Chromium prerequisites для Vitest browser provider и выполняет оба
  projects через Vitest

### Requirement: Pre-commit uses the fast contract

Lefthook pre-commit SHALL автоматически форматировать подходящие staged-файлы с повторным
добавлением исправлений в index, а затем SHALL вызвать `npm run verify:fast` как единственный
code-quality verification entry point. Pre-commit MUST NOT запускать Knip, JSCPD, Vitest,
Playwright E2E или Next.js build.

#### Scenario: Отформатированные изменения проходят commit gate

- **WHEN** staged-файлы могут быть исправлены Oxfmt и итоговое рабочее дерево проходит
  `npm run verify:fast`
- **THEN** Lefthook добавляет formatter fixes в index и разрешает commit

#### Scenario: Быстрая проверка блокирует commit

- **WHEN** `npm run verify:fast` возвращает ненулевой exit code во время pre-commit
- **THEN** Lefthook блокирует commit и показывает вывод провалившейся вложенной проверки
