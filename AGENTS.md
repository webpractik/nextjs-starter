# AGENTS.md

## Область действия и источники истины

- Правила действуют для всего репозитория; ближайший вложенный `AGENTS.md` имеет приоритет.
- Перед изменениями прочитайте код и конфиги области задачи. Они приоритетнее описательной
  документации. Не считайте прошлые результаты проверок доказательством текущей работоспособности.
- Начните с `git status --short`. Сохраняйте чужие изменения; diff ограничивайте задачей.
- Идентификаторы пишите на английском. Документацию, комментарии и пользовательский текст
  оформляйте на языке окружающего файла; основная документация русская.
- Документацию проекта ведите только в OpenWiki (`openwiki/`). Новые руководства и описания
  поведения размещайте в соответствующем разделе OpenWiki, обновляя навигацию и ссылки.
  Не создавайте отдельный каталог `docs/` и копии страниц вне OpenWiki. При переносе страниц
  заменяйте все ссылки на прежние пути.

## Навигация

- [Быстрый старт](openwiki/quickstart.md) — установка и запуск.
- [Архитектурный контракт](ARCHITECTURE.md) — принятые правила vertical slice и clean architecture.
- [Архитектура в OpenWiki](openwiki/architecture/overview.md) — границы и применение правил в Next.js.
- [Карта компонентов](COMPONENTS.md) — UI, формы, providers и utilities. Проверьте её перед
  добавлением компонента; обновляйте при изменении структуры `src/components/`.
- [Дизайн интерфейса](DESIGN.md) — токены и правила оформления в формате
  [google-labs-code/design.md](https://github.com/google-labs-code/design.md). Перед созданием,
  изменением или ревью UI прочитайте его вместе с картой компонентов.
- `app/` — маршруты, layouts, metadata, loading/error и route handlers.
- `src/api/` — OpenAPI, Redocly/Kubb, transport, generated SDK и публичные facets.
- `src/components/ui/` — UI-примитивы Base UI и типизированные формы.
- `src/components/providers/` — инфраструктурные providers без бизнес-сущностей.
- `src/env/` — типизированные переменные; `src/mock-mode/` — runtime mocks.
- `src/proxy/`, `proxy.ts` — proxy/BFF; `src/observability/`, `instrumentation*.ts` — telemetry.
- `src/tests/` — общая тестовая инфраструктура и Playwright E2E.

## Runtime и зависимости

- Это ESM-приложение с единым `package.json`: Next.js App Router, React, TypeScript и Tailwind.
- Используйте только npm под Node.js 26.13.1+ в ветке 26.x и npm 11.x. Версии согласуйте с
  `package.json`, `.node-version` и Dockerfile; не добавляйте workspace manifests или другие lockfiles.
- Прямые dependencies фиксируются exact versions. Сохраняйте `save-exact`, `engine-strict` и
  `legacy-peer-deps` в `.npmrc`; обновляйте `package-lock.json` вместе с манифестом.
- Установленные библиотеки и существующие helpers предпочтительнее новой зависимости.
- Проектные skills находятся в `.agents/skills/`; устанавливайте их через `npx skills`.
  OpenSpec и каталог tasks удалены. Не восстанавливайте их без запроса.

## Архитектура и импорты

- Следуйте [ARCHITECTURE.md](ARCHITECTURE.md): vertical slice по пользовательскому сценарию,
  clean architecture внутри сценария. Это правило развития; пустые слои не создавайте.
- Зависимости направлены от `app/` к `src/modules/` и общему `src/*`. Общий код не импортирует
  маршруты и доменные модули. UI-примитивы не зависят от API, env и бизнес-сущностей.
- `src/modules/` создаётся только для логики минимум двух маршрутов. Модули не импортируют друг
  друга; взаимодействие организуется композицией route/layout или dependency injection.
- Начинайте в узкой области: компонент → маршрут → модуль → shared. Route-local UI хранится в
  единственной `app/.../_components/`; локальные schemas/constants/utils — рядом с маршрутом.
- В модуле группируйте код по сценариям. Domain и application не импортируют React, Next.js,
  TanStack Query, env или SDK; необходимые IO-порты принадлежат сценарию. Конкретные адаптеры
  передаются обычными аргументами из композиции маршрута или модуля.
- Простой экран может использовать публичный SDK или Query options напрямую. Выделяйте use case
  при появлении бизнес-правил или последовательности операций; не оборачивайте каждый SDK-вызов.
- Не создавайте пустые каталоги или файлы «на будущее». Компоненты и каталоги — kebab-case,
  React-экспорты — PascalCase.
- Алиасы: `~/*` — корень, `@/*` — `app/`, `#/*` — `src/`. UI импортируется через
  `#/components/ui/<component>`, API — через `#/api` и публичные facets.
- `index.ts`/`index.tsx` определяет публичный API. Не используйте generated deep imports и
  внутренние файлы компонентов вне их области.
- Серверные и клиентские экспорты модуля разделяйте через `server.ts` и `client.ts` по необходимости;
  общий index оставляйте универсальным. Суффикс `.server.ts` не заменяет `import 'server-only'`
  в новых адаптерах с секретами. Направление слоёв и runtime-границу проверяйте отдельно.
- `npm run check:imports` в `verify:fast` проверяет границы импортов. Чистые файлы вне
  `domain/` и `application/` начинайте с `/** @architecture domain */` или
  `/** @architecture application */`; детали и ограничения описаны в ARCHITECTURE.md.
- Type-only импорты отделяйте через `import type`. Не подавляйте ошибки через `any`,
  `@ts-ignore` или широкие assertions. Для object shapes используйте `interface`; unions,
  mapped/conditional types остаются `type`. Вместо runtime `enum` используйте unions или `as const`.

## React, UI и формы

- При изменении общих токенов или визуальных вариантов обновляйте `DESIGN.md` по исходникам
  `src/styles/globals.css`, `src/fonts/` и `src/components/ui/`. Проверяйте документ командой
  `npx --yes --package=@google/design.md@0.4.0 designmd lint DESIGN.md`.
- Server Components по умолчанию; `'use client'` только для интерактивных листьев с state,
  effects, browser API или client-only библиотекой. Не поднимайте boundary без необходимости.
- Значения из `src/env/server.ts` читайте только на сервере; в текущем файле нет маркера
  `import 'server-only'`, доступ защищает env-библиотека. Не передавайте секреты клиенту.
  SDK, типы и Zod сохраняйте universal; для ограниченных файлов используйте `.server.ts`/`.client.ts`.
- Переиспользуйте UI из карты компонентов. Base UI оборачивайте тонко, сохраняя accessibility
  semantics и props. Не заменяйте Base UI на Radix без требования.
- Варианты оформляйте через CVA, объединяйте classes существующим `cn`. Отдельный `variants.ts`
  нужен только при нетривиальных вариантах.
- Формы создавайте через `useAppForm` из `#/components/ui/form`: нативный `<form>`,
  `event.preventDefault()`, `void form.handleSubmit()`, поля через `form.AppField`, компоненты
  уровня формы внутри `form.AppForm`. Zod передаётся напрямую через Standard Schema.
- Для reusable UI из `src/components/` добавляйте stories в `stories/src/components/` с зеркальным путём; интерактивность проверяйте browser component test.
  Сохраняйте клавиатурную навигацию, фокус, accessible names и состояния disabled/invalid.

## Next.js, env и BFF

- Для внутренних переходов по умолчанию используйте `ForesightLink` из
  `#/components/utilities/foresight-link`. Прямой импорт `next/link` разрешён только внутри
  этой обёртки; правило контролирует lint. Для внешних URL используйте `<a>`.
- App Router и typed routes; Pages Router не добавляйте. Сохраняйте `output: 'standalone'`.
- `cacheComponents: true`; React Compiler включается только в production. Перед изменением cache
  directives сверяйтесь с актуальными Next.js docs. `use cache: private` остаётся экспериментом.
- Перед запуском проверьте `.env` по `.env.example`: конфиг валидирует env до компиляции.
- Новые server env добавляйте в `src/env/server.ts` и `.env.example`; browser env — в
  `src/env/client.ts` с `NEXT_PUBLIC_`. Используйте `serverEnvironment`/`clientEnvironment`.
- Не коммитьте `.env` и не выводите полный env, credentials, cookies или authorization headers.
- `src/api/client-config.ts`: server использует `BACK_INTERNAL_URL`; browser development —
  относительный `NEXT_PUBLIC_BFF_PATH`; production browser — `NEXT_PUBLIC_BACK_URL`.
- Сохраняйте `x-url` в proxy chain: runtime mock mode определяет по нему текущий маршрут.
- Не ослабляйте CSP/HSTS ради локального workaround. Глобальные providers добавляйте только при
  глобальном scope; root layout использует `lang="ru"`.

## API и генерация

- Источник истины — `src/api/openapi/openapi.yaml` и его `$ref`-файлы, OpenAPI 3.2.0.
- Каждая операция имеет уникальный `operationId`, `summary` и корректные `tags`: они участвуют
  в query keys, mock metadata и cache helpers.
- Pipeline: Redocly lint/bundle → Kubb → AST parity/post-generation → Oxfmt → root TypeScript.
  Не понижайте контракт до скрытой копии 3.1. Новые конструкции 3.2 требуют проверки генерации
  и runtime; встроенная Kubb validation отключена из-за ограничения версий валидатора.
- `src/api/codegen/` вручную не редактируется. Меняйте контракт/генератор, затем выполняйте
  `npm run api:gen` и API tests. `bundled.yaml` — игнорируемый промежуточный файл.
- Публичные facets: `#/api`, `/client`, `/query`, `/schemas`, `/mocks`, `/cache-tags`.
- SDK принимает `path`/`query`/`body`, возвращает `data`/`error`/`response`; `throwOnError: true`
  бросает parsed typed error. Успешный ответ проверяется Zod; `204` даёт `data: undefined`.
- Не дублируйте generated schemas и fixtures. Используйте Faker factories и mock client в tests
  и Storybook. Query options компонуйте с TanStack Query hooks.

## Форматирование и наблюдаемость

- Oxfmt — единственный formatter: 4 пробела, single quotes, без semicolon, ширина 100.
  Форматируйте только изменённые файлы через `npx oxfmt <paths>`.
- Oxlint наследует `@webpractik/oxlint-config`; не копируйте корпоративные правила и не отключайте
  lint на весь файл. Узкое отключение требует конкретного объяснения.
- Application logs — через `#/observability/logger`. `console.log` запрещён; `console.warn/error`
  допустимы только там, где logger неприменим.
- Prometheus использует общий registry `src/observability/metrics`; endpoints — `/api/metrics`,
  `/api/health`, `/api/ready`. Health/readiness не доказывают доступность внешних зависимостей.

## Проверки и готовность

- Для bug fix сначала добавьте минимальный regression test и подтвердите падение до исправления.
- Vitest unit работает в Node и выбирает `tests/unit/**/*.test.ts(x)`.
  Component project работает в реальном Chromium через `vitest-browser-react`; выбирает
  `tests/component/**/*.test.ts(x)`.
- Тесты рядом с исходниками запрещены. Не используйте jsdom assumptions и
  самодельные mocks там, где уже есть fixtures/aliases в `src/tests/`.
- После изменений запускайте formatter check и узкие tests. Для TS/React обязательны
  `npm run tsc` и `npm run lint`; для route/config/env/proxy — `npm run build`.
- UI проверяйте component tests; реальное browser behavior — Playwright или browser smoke.
- E2E по умолчанию запускают dev server. Для production отдельно выполните свежий build,
  затем `PLAYWRIGHT_SERVER_MODE=standalone npm run test:e2e`. `FRONT_PORT` отличается от `PORT`.
- Для Docker проверяйте image build и startup; локальная Next.js сборка не доказывает готовность
  образа. Проверяйте production build и E2E отдельным запуском.
- Основные команды: `npm ci`, `npm run dev`, `npm run build`, `npm run prod`;
  `npm run verify:fast`, `npm run test`, `npm run test:e2e`, `npm run knip`, `npm run jscpd`;
  `npm run storybook`, `npm run build-storybook`;
  `npm run api:gen`, `npm run api:gen:check`, `npm run api:test`, `npm run api:lint:openapi`.
- Перед завершением перечитайте diff, проверьте отсутствие секретов, временных артефактов и
  случайных lockfile-изменений. Обновите документацию при изменении поведения или контрактов.
- Сообщите точные выполненные проверки и оставшиеся блокеры. Не объявляйте весь проект исправным
  по результатам узкой проверки.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- OPENWIKI:START -->

## OpenWiki

This repository has a generated `openwiki/` evidence index. It is optional just-in-time context, not required startup reading.

- Do not enumerate, preload, or search wikis at task start. Use retrieval when the user asks for it, when unfamiliar architecture or dependency behavior materially affects the task, or when source inspection leaves an important uncertainty. Stop once the question is grounded.
- When those conditions apply and OpenWiki retrieval tools are available, use `openwiki_search` for just-in-time context and `openwiki_read` for the relevant complete sections. If search returns `workspace_required`, ask which listed workspace to use and retry with its ID.
- Use `openwiki_list_workspaces` or `openwiki_list_wikis` when workspace membership itself needs to be discovered.
- If the retrieval tools are unavailable, read `openwiki/quickstart.md` and follow its links to the relevant pages.
- Treat source code and tests as authoritative. A brief's unknowns and review items are verification gaps, not automatic requirements.
- Prefer the narrowest quiet validation that proves the changed behavior. Preserve complete failure output.

The scheduled OpenWiki GitHub Actions workflow refreshes the repository wiki. Do not hand-edit generated OpenWiki pages unless explicitly asked; prefer updating source code/docs and letting OpenWiki regenerate.

<!-- OPENWIKI:END -->

## Структура тестов, stories и стилей

- Unit-тесты находятся только в `tests/unit/`, компонентные только в `tests/component/`.
  После префикса путь повторяет путь исходника от корня, включая `app/` или `src/`.
  Например, `src/components/ui/button/button.tsx` соответствует
  `tests/component/src/components/ui/button/button.component.test.tsx`.
- Stories создаются только для `src/components/`, находятся в `stories/src/components/` и зеркалируют исходник. Для `app/` stories запрещены. Например,
  `stories/src/components/ui/button/button.stories.tsx`.
- Для каждого нового файла компонента `.tsx` в `src/components/` и `app/**/_components/`
  обязателен тест (unit или component) с тем же базовым именем. Story обязательна только для `src/components/`. `index.tsx` с реализацией также проверяется; чистые re-export файлы исключены. Интерактивность проверяется component test.
- `npm run check:structure` контролирует размещение, зеркальность директорий тестов,
  соответствие stories исходникам, наличие тестов и stories у компонентов и CSS Modules.
  Проверка входит в `verify:fast` и pre-commit. Исключений для существующих компонентов нет.
- Приоритет оформления — Tailwind classes и существующие tokens. CSS Modules
  (`*.module.css`, `*.module.scss`, `*.module.sass`, `*.module.less`) допустимы только
  в `src/styles/`; рядом с компонентами и маршрутами они запрещены.
- `src/tests/` содержит только общую инфраструктуру, fixtures, mocks и Playwright E2E.
