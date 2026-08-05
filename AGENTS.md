# AGENTS.md

## Область действия и источники истины

- Этот файл действует для всего репозитория. Если в подпапке появится более локальный
  `AGENTS.md`, его правила имеют приоритет для файлов внутри этой подпапки.
- Перед изменениями прочитайте конфиги и документацию области задачи. Исполняемый конфиг и
  фактический код приоритетнее `README.md` и описательных документов, если они расходятся.
- Не исправляйте попутно чужие или уже существующие изменения рабочего дерева. Ограничивайте diff
  задачей пользователя.
- Идентификаторы и код пишутся на английском. В документации, комментариях и пользовательском
  тексте сохраняйте язык окружающего файла; основная проектная документация сейчас на русском.

## Критическое текущее состояние

### Пакетный менеджер

- Единственный пакетный менеджер — npm под Node.js 24. Не добавляйте Bun, pnpm или Yarn команды.
- `bun.lock` и `bunfig.toml` удалены при миграции; не восстанавливайте их.
- `package-lock.json` обязателен для воспроизводимых `npm ci` в Docker и GitLab CI. Обновляйте его
  вместе с `package.json` и workspace manifests.
- Docker, GitLab CI, Lefthook и `@repo/api` используют npm. Не добавляйте отдельный способ
  установки или запуска для одного из этих контуров.
- `.npmrc` включает `save-exact`, `engine-strict` и `legacy-peer-deps`; не меняйте эти установки без
  отдельного решения.

### Зафиксированные ограничения

- В `next.config.ts` включены `cacheComponents: true` и `cacheHandlers.default`: обычный
  `'use cache'` использует Valkey между репликами. Это не настраивает singular `cacheHandler`,
  `'use cache: private'`, `'use cache: remote'` или именованные handlers. Во время production
  build handler не обращается к Valkey. Private cache остаётся экспериментальной возможностью и
  не должна становиться production default без отдельной оценки.
- React Compiler включается только в production через `reactCompiler: isProd`, а не во всех
  режимах.
- Канонический контракт использует OpenAPI 3.2. Redocly bundle передаётся Hey API без понижения и
  скрытой 3.1-копии; доказательство совместимости — полный `gen`, generated typecheck и root
  `tsc`.
- `@hey-api/openapi-ts@0.99.0` пока не запускается с project TypeScript 7.0.2. Только codegen
  process направляет импорт `typescript` на alias `typescript-codegen@6.0.3`; удаляйте shim лишь
  после успешного native TypeScript 7 probe и полного parity suite.
- Контейнерный контур задан в `Dockerfile`, `.dockerignore`, `compose*.yaml` и `Makefile`: dev
  использует target `development`, production — non-root standalone runner, обе схемы запускают
  две реплики с общим эфемерным Valkey. Builder получает `SENTRY_AUTH_TOKEN` через BuildKit secret,
  но базовый Compose пока также передаёт token в runtime environment. Не объявляйте контур
  production-ready только по нормализации config: актуальные проверки и оставшиеся риски
  зафиксированы в `docs/deployment.md`.

## Проект и runtime

- Это ESM-монорепозиторий на npm workspaces: Next.js 16 App Router, React 19, TypeScript 7,
  Tailwind CSS 4.
- Корневое приложение собирается в Next.js standalone output и рассчитано на Node.js 24.
- Основные инфраструктурные библиотеки: TanStack Query, Zod, nuqs, Sentry, OpenTelemetry, Adze,
  Prometheus `prom-client` и Valkey client `iovalkey`.
- UI-примитивы основаны на Base UI и shadcn-подходе; не подменяйте их Radix-компонентами без
  явного требования.
- Для прямых dependencies сохраняйте exact versions согласно `.npmrc`; диапазоны оставляйте там,
  где они выражают контракт `peerDependencies`.

## Карта репозитория

- `app/` — Next.js routing layer: страницы, layouts, route handlers, metadata, loading/error states
  и локальные компоненты маршрутов.
- `src/modules/` — доменная логика, общая для нескольких маршрутов. Директория создаётся по мере
  появления реальных модулей, а не заранее.
- `src/components/` — переиспользуемые составные UI-компоненты и инфраструктурные providers.
- `src/constants/`, `src/hooks/`, `src/types/`, `src/utils/` — shared-слой без привязки к отдельному
  бизнес-модулю. Новые shared-каталоги создавайте только вместе с реальным кодом.
- `src/env/` — типизированные и валидируемые переменные окружения.
- `src/cache/` — server-only обработчик общего Cache Components storage в Valkey.
- `src/mock-mode/` — выбор generated API mocks и сценария во время выполнения.
- `src/proxy/` и корневой `proxy.ts` — pipeline Next.js proxy/BFF и служебные request headers.
- `src/observability/` и `instrumentation*.ts` — логирование, метрики, Sentry и OTEL.
- `src/tests/` — общая тестовая инфраструктура и Playwright E2E.
- `packages/core/` (`@repo/core`) — дизайн-система и UI-примитивы.
- `packages/api/` (`@repo/api`) — OpenAPI-контракт, Redocly/Hey API pipeline и публичные facets для
  SDK, client, Query, Zod, Faker, mocks и cache tags.
- `docs/README.md` — индекс документации и её статусов.
- `docs/architecture.md` — подробная модель слоёв и размещения кода.
- `docs/bff-proxy.md` — выбор API base URL в server/dev/prod.
- `docs/api-codegen.md` — правила OpenAPI и генерации клиента.
- `docs/cache-and-streaming.md` — действующие правила Cache Components и streaming.
- `docs/docker-compose.md`, `docs/self-hosting.md`, `docs/deployment.md` — локальный контейнерный
  контур, несколько реплик и выпуск.
- `docs/environment.md`, `docs/mock-mode.md`, `docs/observability.md`,
  `docs/testing-guidelines.md` — профильные operational references.

## Архитектурные границы

Зависимости направлены сверху вниз:

| Слой           | Разрешённые зависимости                      |
| -------------- | -------------------------------------------- |
| `app/`         | `src/modules/`, shared `src/*`, `packages/*` |
| `src/modules/` | shared `src/*`, `packages/*`                 |
| shared `src/*` | `packages/*`                                 |
| `packages/*`   | только другие `packages/*`                   |

- `packages/api/client-config.ts` — известное исключение: файл импортирует root-level `src/env`,
  `src/constants` и `src/mock-mode`. Не повторяйте и не расширяйте это направление зависимостей;
  план развязки описан в `docs/architecture.md`.
- Модуль в `src/modules/<name>` не импортирует другой модуль напрямую. Взаимодействие организуйте
  через композицию в route/layout, shared event bus или dependency injection/provider.
- Эти границы пока не полностью контролируются Oxlint. Проверяйте их вручную при review.
- Бизнес-логика одного маршрута остаётся рядом с ним в `app/.../_components/`. Модуль создаётся,
  когда логика действительно нужна минимум двум маршрутам.
- Общий код начинайте в самой узкой области и поднимайте только после появления второго
  потребителя: компонент → маршрут → модуль → shared.
- `index.ts` модуля или компонента — его публичный API. Не импортируйте внутренние файлы через
  deep import вне этой области без причины.
- Не создавайте пустые `types.ts`, `variants.ts`, `hooks/` или `utils/` «на будущее».

## Server/Client границы React

- Базовый принцип: Server Components по умолчанию, Client Components только на интерактивных
  листьях.
- Добавляйте `'use client'` только при state/effects/event handlers/browser API или client-only
  библиотеке. Не расширяйте client boundary на страницу или layout без необходимости.
- `packages/core/` содержит интерактивные client-примитивы; React Query hooks и providers также
  client-only.
- Fetch-клиенты, типы и Zod-схемы `@repo/api` должны оставаться universal, если конкретный API не
  требует server-only контекста.
- `src/env/server.ts` — server-only. Никогда не импортируйте его в Client Component.
- Для явно ограниченных файлов используйте суффиксы `.server.ts` и `.client.ts`; universal-файлы
  оставляйте без суффикса.

## Размещение и именование компонентов

- Route-local компоненты размещайте в единственной private-директории сегмента
  `app/.../_components/`. Общие для сегмента schemas/constants/utils размещайте рядом с route.
- Переиспользуемые UI-примитивы — `packages/core`; составные shared-компоненты —
  `src/components`; доменные компоненты — `src/modules/<module>`.
- Файлы и директории компонентов называются kebab-case, React-экспорты — PascalCase.
- Типовая папка компонента может содержать реализацию, `*.test.tsx`, `*.stories.tsx`, `variants.ts`,
  `types.ts`, локальные `hooks/`, `utils/` и `index.ts`, но только если эти файлы нужны.
- Инфраструктурные providers без знания бизнес-сущностей находятся в
  `src/components/providers`; providers с доменными типами принадлежат соответствующему модулю.

## Импорты и TypeScript

- Используйте алиасы: `~/*` для корня, `@/*` для `app/`, `#/*` для `src/`.
- Пакеты импортируются через `@repo/core` и `@repo/api`, а не через
  `~/packages/...` или длинные относительные пути.
- Отделяйте type-only imports через `import type`; это требуется `verbatimModuleSyntax` и
  линтером.
- TypeScript работает в строгом режиме с `noUncheckedIndexedAccess`, `noImplicitReturns`,
  `noUnusedLocals`, `noUnusedParameters` и `erasableSyntaxOnly`.
- Не заглушайте ошибки `any`, `@ts-ignore` или широкими type assertions. Сначала уточните модель
  данных и сузьте тип.
- Из-за `erasableSyntaxOnly` предпочитайте unions и `as const`-объекты конструкциям TypeScript,
  которые генерируют runtime-код, например `enum`.
- Для object shapes используйте `interface`, когда правило линтера не требует иного; `type`
  оставляйте для unions, mapped/conditional types и generated code.

## Форматирование и lint

- Единственный formatter — Oxfmt: 4 пробела, single quotes, без semicolon, ширина 100.
- Oxfmt сортирует импорты, scripts в `package.json` и Tailwind-классы в `cva`/`cn`. Не боритесь с
  его результатом ручной перестановкой.
- Форматируйте только изменённые файлы через `npx oxfmt <paths>`; `npm run fmt` форматирует весь
  репозиторий и может затронуть чужую работу.
- Oxlint запрещает неизвестные, конфликтующие и дублирующиеся Tailwind classes, проверяет a11y,
  React/RSC, Next.js, import order и неиспользуемый код.
- `console.log` запрещён. Для приложения используйте `#/observability/logger`; `console.warn` и
  `console.error` разрешены только там, где logger неприменим.
- Для вариантов компонентов используйте CVA, а для объединения classes — существующий `cn`.
- Не отключайте lint-правила на весь файл. Если локальное отключение неизбежно, делайте его узким
  и объясняйте конкретную причину.

## Next.js и конфигурация приложения

- Используется App Router и typed routes. Не добавляйте Pages Router.
- `next.config.ts` импортирует валидированные env и создаёт BFF rewrite; build/dev могут падать до
  компиляции при отсутствующих переменных. Для локального запуска сначала создайте `.env` из
  `.env.example`.
- Cache Components включены через `cacheComponents: true`; `cacheHandlers.default` направляет
  обычный `'use cache'` в `src/cache/valkey-handler.mjs`. Не считайте это настройкой private,
  remote или именованного cache scope. Перед использованием `use cache`, `cacheLife`, `cacheTag`,
  `updateTag` или `revalidateTag` сверяйтесь с `docs/cache-and-streaming.md` и актуальной
  документацией Next.js.
- `output: 'standalone'` необходим текущей контейнерной схеме; не выключайте его без изменения
  deploy pipeline.
- Static image imports отключены, SVG разрешены через image config. Учитывайте это при выборе
  между `next/image`, URL и импортом asset.
- Security headers и `X-Accel-Buffering: no` включаются вне development. Не ослабляйте CSP/HSTS
  попутно ради локального workaround.
- Root layout имеет `lang="ru"`, Nuqs adapter, Query provider и Toaster. Новые глобальные providers
  добавляйте только при действительно глобальном scope.

## Переменные окружения и BFF

- Новую server env переменную добавляйте в `src/env/server.ts` и `.env.example`.
- Новую browser-visible переменную добавляйте в `src/env/client.ts`, `.env.example` и используйте
  префикс `NEXT_PUBLIC_`.
- В приложении потребляйте env через `serverEnvironment`/`clientEnvironment`. Прямой
  `process.env` оставляйте только для framework bootstrap и уже существующих build/runtime checks.
- Никогда не переносите server secrets в client schema и не коммитьте `.env`.
- `VALKEY_URL` и `VALKEY_CACHE_NAMESPACE` обязательны. URL может использовать `redis:` или
  `rediss:`; credentials остаются только на server. Версионируйте namespace при несовместимом
  изменении формата, чтобы старые записи не читались новым release.
- `CACHE_PROBE_ENABLED` по умолчанию выключен. Probe разрешён только при `CI=true`, не в `PROD` и
  с `CACHE_PROBE_TOKEN` длиной не меньше 32 символов; не включайте его как production endpoint.
- Выбор base URL в `packages/api/client-config.ts`:
    - server всегда использует `BACK_INTERNAL_URL`;
    - browser в development использует относительный `NEXT_PUBLIC_BFF_PATH` и Next rewrite;
    - browser в production использует `NEXT_PUBLIC_BACK_URL` напрямую.
- `NEXT_PUBLIC_BFF_PATH` и `BACK_INTERNAL_URL` обязательны для rewrite. Не хардкодьте `/bff-api`
  вне env/config.
- Корневой proxy добавляет request header `x-url`; runtime mock mode использует его для определения
  текущего route. Сохраняйте это поведение при изменении proxy chain.

## API и кодогенерация

- Исходник истины — `packages/api/openapi/openapi.yaml` и его `$ref`-файлы в `paths/` и
  `components/`; каноническая версия контракта — OpenAPI 3.2.0.
- Каждая операция должна иметь уникальный `operationId`, обязательный `summary` и корректный
  `tags`; tags входят в query keys, mock metadata и generated cache helpers.
- Порядок pipeline: Redocly bundle → `bundled.yaml` → Hey API → post-generation helpers → Oxfmt →
  generated `tsc`.
- `bundled.yaml` — игнорируемый промежуточный артефакт. `openapi/` и `codegen/` коммитятся.
- `packages/api/codegen/`, включая types, SDK, client, Query options, Zod, Faker, cache tags и mock
  routes, вручную не редактируется. Hey API запускается с `output.clean: true`, поэтому ручные
  изменения будут удалены.
- После изменения OpenAPI выполните `npm --workspace @repo/api run gen` и связанные tests.
- Публичные импорты идут только через `@repo/api`, `/client`, `/query`, `/schemas`, `/mocks` и
  `/cache-tags`; generated deep paths и внутренние aliases вроде `Pet2` не являются контрактом.
- SDK принимает `path`/`query`/`body` и по умолчанию возвращает discriminated result
  `data`/`error`/`response`; `throwOnError: true` бросает parsed typed error. Успешные ответы
  проверяются generated Zod-схемами, а `204` возвращает `data: undefined`.
- `findPetsByStatusInfiniteOptions` преобразует numeric `pageParam` в `query.offset`, сохраняя
  остальные filters и limit; Query options компонуйте с `useQuery`/`useMutation`/`useInfiniteQuery`.
- Generated Zod-схемы экспортируются через `@repo/api/schemas`; не копируйте их в `src/schemas`.
- Для тестов и Storybook используйте generated Faker factories и mock client, а не вручную
  дублированные API fixtures, если нужная фабрика уже существует.

## UI и Storybook

- Сначала переиспользуйте `@repo/core`; новый примитив добавляйте туда только если он не содержит
  бизнес-логики.
- Примитивы Base UI оборачивайте тонко, сохраняйте accessibility semantics и прокидывайте props.
- Варианты держите в отдельном `variants.ts`, когда они нетривиальны; объединяйте className через
  `cn` и CVA.
- Для reusable UI добавляйте Storybook stories рядом с компонентом. Storybook использует
  `@storybook/nextjs-vite`, autodocs и a11y addon.
- Интерактивное поведение проверяйте browser component test, а визуальные состояния — stories;
  одно не заменяет другое.
- Формы создавайте через `useAppForm` из `@repo/core/form`: нативный `<form>`,
  `event.preventDefault()`, `void form.handleSubmit()`, поля через `form.AppField`, form-компоненты
  внутри `form.AppForm`. Zod-схемы передаются напрямую в TanStack validators через Standard Schema.

## Тестирование

- `npm run test` запускает оба Vitest project и все reporters.
- Unit project использует Node environment и подбирает `*.unit.test.ts(x)`, а также
  `packages/**/*.test.ts`.
- Component project использует реальный headless Chromium через `@vitest/browser-playwright` и
  подбирает `*.component.test.ts(x)`, `app/**/*.test.tsx`, `src/**/*.test.tsx`.
- Обычный `src/**/*.test.ts` без `.unit.` не попадает ни в один project. Выбирайте имя файла
  намеренно.
- Component tests пишутся через `vitest-browser-react`, не через jsdom assumptions. Next
  navigation/image/script заменяются тестовыми aliases из `src/tests/mocks`; Base UI Toast
  проверяется реальным browser-компонентом без отдельного mock alias.
- Vitest загружает разрешённые env values сначала из process, затем из корневого `.env`; не
  дублируйте env setup в каждом test file.
- Playwright E2E лежат в `src/tests/e2e` и выполняются в Chromium. По умолчанию config поднимает
  `npm run dev`; `PLAYWRIGHT_SERVER_MODE=standalone` или `CI=true` переключает его на уже собранный
  `npm run prod`. Самодостаточный `npm run test:e2e:standalone` сначала создаёт свежую сборку.
- Текущий GitLab pipeline запускает Vitest, но не Playwright E2E и не production build.
- `npm run test:cache:integration` поднимает временный Valkey и проверяет handler. Команды
  `test:cache:matrix:dev` и `test:cache:matrix:prod` проверяют общий кэш и invalidation между двумя
  Compose-репликами, а `verify:cache:compose` — ограничения topology и failure cases. Эти
  Docker-проверки не входят в `npm run test` или `npm run verify`.
- Playwright использует `FRONT_PORT` с default `3000`; это отдельная переменная от server `PORT`.
- При исправлении bug сначала добавьте или обновите минимальный regression test, затем проверьте,
  что он воспроизводит проблему и проходит с исправлением.

## Наблюдаемость

- Для application logs используйте Adze logger из `#/observability/logger`, а не новый logging
  abstraction.
- Server instrumentation регистрирует Vercel OTEL и Sentry в Node runtime; client Sentry
  инициализируется только в production.
- Не логируйте credentials, cookies, authorization headers, персональные данные или полный env.
- Prometheus использует общий registry из `src/observability/metrics`; endpoint — `/api/metrics`.
  Cache handler публикует counters операций и invalidation, а также histogram длительности.
  Registry локален для процесса, поэтому в multi-replica окружении метрики собирайте с каждой
  реплики. Health и readiness endpoints — `/api/health` и `/api/ready`.

## Основные команды

```bash
# Установка и запуск
npm ci
npm run dev
npm run build
npm run prod

# Качество
npm run tsc
npm run lint
npm run lint-fix
npm run fmt:check
npm run knip
npm run jscpd
npm run verify:fast
npm run verify

# Тесты
npm run test
npm run test:unit
npm run test:component
npm run test:coverage
npm run test:cache:integration
npm run test:cache:matrix:dev
npm run test:cache:matrix:prod
npm run verify:cache:compose
npm run test:e2e
npm run test:e2e:standalone
npx vitest run src/mock-mode/runtime.unit.test.ts --project unit
npx vitest run src/components/utilities/error-boundary/error-boundary.test.tsx --project component
npx playwright test src/tests/e2e/example.spec.ts

# Storybook
npm run storybook
npm run build-storybook

# Workspace-команды
npm --workspace @repo/api run test
npm --workspace @repo/api run gen
npm --workspace @repo/api run bundle
npm --workspace @repo/api run lint:openapi
npm --workspace @repo/api run typecheck:generated

# Docker Compose
make compose-config-dev
make compose-config-prod
make compose-build-dev
make compose-build-prod
make compose-dev
make compose-prod
```

## Рабочий процесс и проверка

1. Зафиксируйте исходное состояние через `git status --short` и определите существующие чужие
   изменения.
2. Прочитайте ближайший код, tests и профильную документацию до изменения интерфейса или
   архитектуры.
3. Делайте минимальный связный diff; не форматируйте и не рефакторьте соседний код без причины.
4. Для generated code меняйте источник/генератор, затем регенерируйте; не патчите output.
5. Запустите formatter check и самые узкие релевантные tests.
6. Для TypeScript/React изменений дополнительно запустите `npm run tsc` и `npm run lint`.
7. Для route, Next.js config, env или proxy изменений выполните `npm run build`, если окружение
   позволяет. Для cache handler запустите узкие Unit tests, `test:cache:integration` и нужную cache
   matrix. Для Docker/Compose дополнительно проверьте соответствующий `make compose-config-*`,
   image build и smoke test изменённого режима.
8. Для UI проверьте component tests и, когда меняется реальное browser behavior, Playwright или
   ручной browser smoke test.
9. Перед завершением перечитайте diff, сообщите точные выполненные проверки и отдельно перечислите
   непроверенные риски или известные блокеры.

## Критерии готовности

- Изменение соответствует границам слоёв и не создаёт новый cross-module import.
- Нет ручных изменений generated API output.
- Нет случайных изменений lockfiles, артефактов tests, `.env` или соседних файлов.
- Изменённые файлы отформатированы; релевантные lint, types и tests проходят свежим запуском.
- Поведение, публичный API, env contract или архитектурное решение отражены в соответствующей
  документации.
- Итоговое сообщение не утверждает, что весь проект исправен, если был проверен только узкий scope.
