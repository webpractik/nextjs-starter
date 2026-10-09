# Миграция Kubb и обновление зависимостей

Дата проверки: 2026-10-09. Runtime: Node.js 24.19.0, npm 11.
Работа включает замену Hey API на Kubb и обновление прямых зависимостей корня,
`@repo/api` и `@repo/core` до последних стабильных npm releases на дату проверки.
`npm outdated --workspaces --include-workspace-root --json` возвращает `{}`.

## Основные версии

| Область       | Итог                                                                                               |
| ------------- | -------------------------------------------------------------------------------------------------- |
| Генерация     | Kubb/adapter-oas 5.5.6, plugin-client 5.5.4, plugin-ts 5.0.5, plugin-zod 5.4.3, plugin-faker 5.1.0 |
| Framework     | Next.js 16.4.0, React/React DOM 19.3.0, TypeScript 7.0.2                                           |
| Данные        | TanStack Query 5.104.1, Zod 4.6.5, Faker 10.6.0                                                    |
| UI            | Base UI 1.9.0, Tailwind CSS 4.3.3, Framer Motion 14.0.0, Lucide React 1.54.0                       |
| Observability | Sentry 11.6.0, OTEL api-logs/sdk-logs 0.223.0                                                      |
| Tests         | Vitest/browser/coverage 5.0.3, Playwright 1.64.0, Allure 3.13.0                                    |
| Stories/build | Storybook 10.6.1, Vite 8.3.4, plugin-react 6.1.2                                                   |
| Quality       | Oxlint 1.87.0, tsgolint 7.0.2003, Oxfmt 0.72.0, corporate preset 1.0.4                             |

Полный список exact versions находится в manifests и `package-lock.json`. Версии peer contracts
остаются диапазонами. Plugins Kubb имеют независимые release cycles. Root TypeScript 7 не
заменён внутренним TypeScript 6, который использует plugin-ts.

## Что поменялось

- Канонический OpenAPI 3.2.0 и пять Petstore operations сохранены. Redocly lint обязателен;
  Kubb AST проверяется против bundle. Полная поддержка произвольного OpenAPI 3.2 не заявляется.
- Сохраняются шесть public facets, grouped SDK options, native Fetch/Response, Next cache options,
  parsed HTTP errors, response validation, `throwOnError` и `204 → undefined`.
- SDK генерирует plugin-client поверх universal Fetch runtime. Query factories генерируются
  проектным helper: tags/base URL/parameters в keys, cancellation и offset pagination сохранены.
- Faker injection передаётся вложенным factory calls без global state; mock routes и cache tags
  по-прежнему создаются из контракта. Browser mock routing учитывает настроенный BFF base path.
- Hey API, его resolution hook, прямой TypeScript 6 workspace и старый output удалены.
- GitLab codequality перед verify:fast выполняет gen:check с полным lint/bundle/gen/tsc и сравнением
  имён/SHA-256 output. Generated code обновлён только через pipeline.
- После обновления Vitest адаптированы substring matchers и тесты с небезопасными assertions.
  Browser Allure читает контекст bundled TestRunner через alias; `@vitest/runner@4.1.11` остаётся
  явным peer Allure. Runtime labels подтверждены в emitted JSON reports.
- Для обновлённого Sentry/@vercel/otel явно установлены необходимые OTEL logs peers.
  `partialPrefetching: false` сохраняет прежнее поведение Cache Components после обновления Next.

## Свежие результаты проверки

| Проверка                         | Результат                                                                                                                    |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Чистый npm ci в отдельной копии  | Успешно, 1133 packages                                                                                                       |
| Полный gen и повторный gen:check | Успешно; все 61 файла совпадают, в основной и чистой копиях                                                                  |
| Root TypeScript 7                | Успешно, включая весь generated output                                                                                       |
| Oxlint и Oxfmt                   | Успешно для итогового дерева; исходный next-env не входит в commit                                                           |
| Vitest unit + Chromium component | 42 файла, 127 tests passed                                                                                                   |
| Vitest coverage                  | 127 tests passed, coverage reports сформированы                                                                              |
| Next.js production build         | Успешно                                                                                                                      |
| Storybook production build       | Успешно                                                                                                                      |
| Playwright Chromium E2E          | 5 tests passed на production build                                                                                           |
| Изолированный Next consumer      | Server SDK + Client Query + schemas/cache-tags работают в development и production; HTTP 200, mock Response, нет page errors |
| Sharp 0.35.5 runtime smoke       | SVG преобразован в PNG 16×12                                                                                                 |
| npm outdated для всех workspaces | `{}`                                                                                                                         |
| npm audit --omit=dev             | 0 vulnerabilities                                                                                                            |

Next consumer fixture хранится в `src/tests/fixtures/api-runtime/` и проверяется переносом в
private временную копию Next application. Постоянный demo route в основное приложение не добавлен.
В development проверен cookie mock mode с относительным BFF URL; в production используется
явный build/runtime mock flag согласно существующей production policy.

## Ограничения и незелёные дополнительные проверки

- Полный `npm audit` сохраняет 11 high findings в dev dependency graph. Общий источник —
  `braces@3.0.3` через `shadcn`/`ts-morph` и Commitizen; latest опубликованная версия ещё не имеет
  исправления. См. [upstream advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
  Runtime findings устранены exact overrides для `sharp@0.35.5` и
  `postcss-selector-parser@7.1.6`; override не заменяет обновление непосредственных зависимостей.
- `npm run knip` завершается ошибкой. Проверка исходного HEAD тем же Knip также не проходит.
  Strict mode исключает tests/stories, а существующий config отключает чтение Vitest config;
  поэтому reusable primitives и тестовые infrastructure files выдаются как unused. Новые
  consumer fixtures и TestRunner alias также требуют отдельной настройки анализа. Массовая
  очистка публичного UI/shared API в эту миграцию не включена.
- `npm run jscpd` превышает существующий порог 2%. В отчёте есть повторы в npm lockfile,
  generated factories/schemas и обязательных Allure labels. Проверка исходного HEAD тем же
  JSCPD проходила. Порог и исключения не ослаблялись; это остаётся ограничением полного verify.
- Chromium Toast test может печатать `ResizeObserver loop completed with undelivered notifications`;
  оба теста уведомлений проходят с настоящим ResizeObserver, проверки actions/updates/dismiss
  сохранены. Storybook build печатает предупреждения об обработке module-level `use client`.
- Docker image/startup и GitLab deploy в этой задаче не проверялись. Успех локальной сборки и
  consumer smoke не доказывает готовность контейнерного контура к production deployment.

Итоговые `npm run verify:fast`, tests, build, Storybook и production E2E проверены отдельно.
Полный `npm run verify` не объявляется зелёным из-за Knip и JSCPD.
