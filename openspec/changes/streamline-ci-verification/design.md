## Context

Репозиторий использует npm workspaces и Node.js 24. Сейчас `.gitlab-ci.yml` объявляет stages
`build` и `deploy`, а `.gitlab/build.yaml` содержит два jobs: отдельный `typecheck` и production
`build` с `.next` artifacts. Ни Oxlint/Oxfmt, ни Knip/JSCPD, ни Vitest в CI не запускаются.

В `lefthook.yml` lint и format запускаются для staged-файлов, после чего отдельный job выполняет
полный `tsc`. Эти команды описаны непосредственно в hook и не образуют переиспользуемого
контракта. Корневой `package.json` уже предоставляет отдельные scripts `fmt:check`, `lint`, `tsc`,
`knip`, `jscpd` и `test`, но не предоставляет полного и быстрого code-quality entry point.

`npm run test` запускает Vitest projects `unit` и `component`. Component project управляется
Vitest, но использует существующий `@vitest/browser-playwright` provider для headless Chromium.
Отдельный `npm run test:e2e` запускает Playwright test runner и поднимает Next.js-приложение; этот
контур в новый CI не входит.

## Goals / Non-Goals

**Goals:**

- Создать стабильные npm entry points для полного и быстрого code-quality набора.
- Сделать npm scripts источником истины для CI и pre-commit вместо дублирования отдельных команд.
- Заменить CI build/typecheck topology на последовательные `codequality` и `test` gates.
- Запускать все существующие Vitest projects без production build и без standalone Playwright E2E.
- Сохранить Node.js 24, npm, lockfile-based cache и автоматическое форматирование staged-файлов.

**Non-Goals:**

- Удалять или менять локальные `build`, `test:e2e`, Playwright config либо E2E tests.
- Заменять `@vitest/browser-playwright` другим Vitest browser provider.
- Добавлять coverage threshold, новые test suites или менять Vitest reporters.
- Реализовывать deployment: `.gitlab/deploy.yaml` остаётся существующей точкой расширения.
- Менять application runtime, Docker build или `.env` contract.

## Decisions

### 1. Разделить полный и быстрый code-quality contracts

В корневом `package.json` будут определены scripts:

- `verify:fast`: последовательно запускает `fmt:check`, `lint` и `tsc`;
- `verify`: сначала запускает `verify:fast`, затем `knip` и `jscpd`.

Команды выполняются последовательно через `&&`, чтобы первая ошибка немедленно завершала gate с
ненулевым exit code и сохраняла читаемый вывод. `verify` намеренно означает полный code-quality
gate, а Vitest остаётся отдельным `test` gate: это позволяет CI отображать статические ошибки и
ошибки тестов в разных stages без повторного запуска одних и тех же проверок.

`jscpd` будет добавлен как exact root devDependency, а одноимённый script будет использовать
локальный binary. Сейчас `npx jscpd` может загрузить незафиксированную версию во время CI, что
нарушает воспроизводимость `npm ci`.

Альтернативы: включить `npm run test` в `verify` или запустить все проверки параллельно. Первая
дублировала бы Vitest между `codequality` и `test` stages, вторая усложнила бы диагностику и могла
бы создать конкуренцию за CPU/память на runner.

### 2. Использовать отдельный CI job для каждого gate

`.gitlab-ci.yml` объявит stages в порядке `codequality`, `test`, `deploy` и будет включать новый
verification config вместо `.gitlab/build.yaml`. В verification config будут два jobs с общей
скрытой Node.js 24/npm template:

- `codequality` выполняет `npm run verify` в stage `codequality`;
- `test` выполняет `npm run test` в stage `test`.

Оба jobs выполняют `npm ci --cache .npm --prefer-offline` и используют cache key от
`package-lock.json`. Production `build`, копирование `.env.example`, `.gitlab/env.sh`, `.next`
cache и `.next` artifacts удаляются вместе со старым build config, потому что новые gates не
компилируют и не запускают Next.js.

Один verification include с общей hidden template выбран вместо двух почти одинаковых файлов,
чтобы не дублировать image/cache/install contract. Альтернатива с одним job `npm run verify && npm
run test` отвергнута: она не создаёт требуемые независимые stages и ухудшает видимость причины
падения pipeline.

### 3. Считать Vitest единственным test runner в новом CI

CI test job вызывает только `npm run test`, то есть `vitest run` с текущими projects `unit` и
`component`. Он не вызывает `npm run test:e2e`, `playwright test`, `npm run build`, `npm run dev`
или `npm run prod`.

Фраза «без Playwright» относится к отсутствию standalone Playwright E2E run. Существующий Vitest
component project продолжает использовать `@vitest/browser-playwright` как browser provider;
исключение этого provider означало бы потерю browser-component покрытия и отдельное изменение
test architecture. Test job должен подготовить только Chromium и системные зависимости,
необходимые этому provider, через установленную lockfile-версию Playwright, но все тесты по-прежнему
запускаются командой Vitest. Путь browser cache должен быть локальным для workspace и кешироваться
от `package-lock.json`, чтобы повторные pipelines не скачивали Chromium без необходимости.

Альтернатива `npm run test:unit` отвергнута, потому что она молча исключила бы существующие
component tests. Standalone E2E остаётся доступным как явная локальная/отдельная проверка вне этого
pipeline.

### 4. Lefthook делегирует проверки в `verify:fast`

Pre-commit сохраняет отдельный staged-format job с `stage_fixed: true`, чтобы автоматически
исправленные Oxfmt файлы попадали в commit. После форматирования один verification job вызывает
`npm run verify:fast`; прямые Lefthook jobs для lint и typecheck удаляются.

`verify:fast` проверяет репозиторий целиком, а не пытается прокинуть `{staged_files}` через цепочку
npm scripts. Это гарантирует корректный TypeScript project check и один и тот же контракт при
ручном и hook-запуске. Более дорогие Knip/JSCPD и Vitest остаются за пределами pre-commit.

Альтернатива сохранить отдельные staged lint/typecheck команды отвергнута, поскольку тогда hook
снова имел бы собственную оркестрацию и мог разойтись с `verify:fast`.

### 5. Сохранить deploy stage без build artifact contract

`deploy` остаётся последним stage и `.gitlab/deploy.yaml` остаётся подключённым. Однако будущий
deploy job не должен предполагать наличие `.next/standalone` или `.next/static` artifacts: если
deployment потребует bundle, он должен явно построить или получить его в отдельном последующем
изменении.

Альтернатива удалить `deploy` целиком отвергнута, потому что пользователь запросил удаление build
stages, а не точки расширения deployment pipeline.

## Risks / Trade-offs

- Удаление `.next` artifacts может сломать внешний deploy job, не хранящийся в текущем
  `.gitlab/deploy.yaml` → отметить CI contract как breaking, проверить project-level includes и
  при необходимости откатить CI config до добавления нового artifact producer.
- Полный `verify:fast` может быть медленнее текущего staged lint → оставить Knip, JSCPD и Vitest за
  пределами hook и измерить реальное время при внедрении.
- Vitest component tests требуют Chromium, отсутствующий в базовом Node image → явно подготовить
  browser/system dependencies и кешировать browser binaries, не добавляя Playwright E2E job.
- JSCPD сейчас запускается через незакреплённый `npx` package → добавить exact devDependency и
  обновить `package-lock.json` вместе с manifest.
- GitLab YAML может быть синтаксически валиден, но скрытая template или include могут разрешиться
  иначе на runner → проверить объединённую конфигурацию GitLab CI lint, если endpoint доступен, и
  дополнительно просмотреть локально раскрытый include/job graph.

## Migration Plan

1. Добавить exact JSCPD dependency и scripts `verify:fast`/`verify`, обновив lockfile.
2. Перевести Lefthook на staged format плюс `npm run verify:fast` и локально проверить hook config.
3. Добавить verification CI config с общим Node/npm setup и jobs `codequality`/`test`.
4. Обновить root stages/includes, затем удалить `.gitlab/build.yaml` и его artifact contract.
5. Запустить `verify:fast`, `verify`, `test` и проверки конфигураций; убедиться, что команды build и
   Playwright E2E не вызываются новым CI graph.

Изменение не требует data migration. Для rollback восстанавливаются прежние `.gitlab-ci.yml` и
`.gitlab/build.yaml`, удаляются новые verification jobs/scripts и возвращается прежняя Lefthook
оркестрация; application artifacts и данные не затрагиваются.

## Open Questions

None.
