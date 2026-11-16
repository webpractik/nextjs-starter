# Next.js Starter

Шаблон веб-приложения на Next.js 16 App Router, React 19, TypeScript 7 и Tailwind CSS 4.
В проекте есть компоненты Base UI, типизированные формы, API-клиент из OpenAPI 3.2,
моки, Sentry, OpenTelemetry, метрики, Vitest, Playwright и Storybook.

## Быстрый старт

Нужны Node.js 26.13.1+ в ветке 26.x и npm 11.x. Создайте проект на основе шаблона:

```bash
npx create-next-app@latest my-app --example https://github.com/webpractik/nextjs-starter --use-npm --skip-install
cd my-app
npm ci
test -e .env || cp .env.example .env
npx lefthook install
npm run dev
```

Откройте [localhost:3000](http://localhost:3000).
Если репозиторий уже склонирован, начните с `npm ci` в его корне.
Существующий `.env` сверьте с `.env.example`. Next.js проверяет переменные до компиляции.
Для работы SDK без бэкенда задайте `MOCK_MODE=true` и `NEXT_PUBLIC_MOCK_MODE=true`.
Petstore в контракте показывает структуру API. Самого бэкенда в проекте нет.

Адрес API на сервере задаёт `BACK_INTERNAL_URL`. Браузер при разработке отправляет запросы
через `NEXT_PUBLIC_BFF_PATH`, по умолчанию `/bff-api`. В production он использует
`NEXT_PUBLIC_BACK_URL`.
Перед развёртыванием замените локальные значения и заглушки Sentry по
[справочнику окружения](openwiki/operations/environment.md). `.env` не коммитьте.

## Основные команды

| Команда                       | Назначение                                                                               |
| ----------------------------- | ---------------------------------------------------------------------------------------- |
| `npm run dev`                 | Разработка с Turbopack                                                                   |
| `npm run build`               | Production-сборка с `output: 'standalone'`                                               |
| `npm run verify:fast`         | Структура файлов, границы импортов, форматирование, lint и TypeScript                    |
| `npm run test`                | Все проекты Vitest. По отдельности их запускают `test:unit` и `test:component`           |
| `npm run test:e2e`            | Playwright со своим сервером разработки. Порт `3108`, переопределение через `FRONT_PORT` |
| `npm run test:e2e:production` | Свежая standalone-сборка, E2E и проверка предзагрузки ссылок                             |
| `npm run verify`              | `verify:fast`, Knip, JSCPD, Vitest и E2E с сервером разработки                           |
| `npm run storybook`           | Storybook на [localhost:6006](http://localhost:6006)                                     |
| `npm run api:gen`             | Проверка OpenAPI и генерация SDK, схем, моков и функций кеширования                      |

Перед первым запуском браузерных тестов установите Chromium командой
`npx playwright install chromium`. На Linux для установки системных зависимостей используйте
`npx playwright install --with-deps chromium`.
Для локального запуска production-сборки:

```bash
npm run build
node --env-file=.env tools/start-standalone.mjs
```

## Роутинг

| URL                     | Файл и назначение                                                              |
| ----------------------- | ------------------------------------------------------------------------------ |
| `/`                     | Главная страница, `app/(public)/(home)/page.tsx`                               |
| `/api/health`           | Проверка работы приложения, `app/api/health/route.ts`                          |
| `/api/ready`            | Readiness без проверки внешних зависимостей, `app/api/ready/route.ts`          |
| `/api/metrics`          | Метрики Prometheus, `app/api/metrics/route.ts`                                 |
| `/robots.txt`           | Правила индексации, `app/robots.ts`. Сейчас индексация запрещена               |
| `/sitemap.xml`          | Главная из `NEXT_PUBLIC_FRONT_URL`, `app/sitemap.ts`                           |
| `/manifest.webmanifest` | Веб-манифест, `app/manifest.ts`                                                |
| `/favicon.ico`          | Иконка сайта, `app/favicon.ico`                                                |
| `/bff-api/:path*`       | В разработке `next.config.ts` проксирует запросы на `BACK_INTERNAL_URL/:path*` |

Группы `(public)` и `(home)` не входят в URL. Общий layout находится в `app/layout.tsx`.
Для загрузки используйте `loading.tsx`, для ошибок `error.tsx` и `global-error.tsx`,
для 404 `not-found.tsx`.

Новую страницу добавляйте в `app/<путь>/page.tsx`.
HTTP-обработчик добавляйте в `app/<путь>/route.ts`.
Локальный UI храните в `_components/` рядом с маршрутом.
Для внутренних переходов используйте `ForesightLink` из
`#/components/utilities/foresight-link`. Для внешних ссылок используйте `<a>`.
Typed routes проверяют пути при компиляции.

## Структура и правила

| Путь                                          | Содержимое                                            |
| --------------------------------------------- | ----------------------------------------------------- |
| `app/`                                        | Маршруты, layouts, страницы и HTTP-обработчики        |
| `src/components/`                             | Общие UI-компоненты, формы, провайдеры и утилиты      |
| `src/api/`                                    | OpenAPI-контракт, транспорт, генератор и SDK          |
| `src/env/`, `src/mock-mode/`                  | Типизированное окружение и режим моков                |
| `src/proxy/`, `src/observability/`            | Цепочка proxy, логи, метрики и телеметрия             |
| `tests/unit/`, `tests/component/`, `stories/` | Тесты и stories с зеркальным путём исходника от корня |
| `src/tests/`                                  | Общая тестовая инфраструктура, fixtures, mocks и E2E  |

Алиас `@/*` указывает на `app/`, `#/*` на `src/`, `~/*` на корень проекта.
Начинайте сценарий рядом с маршрутом. Переносите бизнес-логику в `src/modules/`,
когда её используют минимум два маршрута.
Общий UI импортируйте через `#/components/ui/<component>`, формы создавайте через `useAppForm`.
API используйте через `#/api` и публичные точки входа. `src/api/codegen/` вручную не меняйте.

Для компонентов в `src/components/` обязательны тест и story. Для `app/**/_components/`
обязателен только тест, stories для `app/` запрещены. Unit-тесты храните в `tests/unit/`,
компонентные тесты в `tests/component/`, а stories только в `stories/src/components/`.
Размещение контролирует `npm run check:structure`, входящий в `verify:fast` и pre-commit.
Используйте Tailwind и существующие токены. CSS Modules допустимы только в `src/styles/`.

## Документация

- [Правила работы](AGENTS.md) · [Архитектурный контракт](ARCHITECTURE.md)
- [Карта компонентов](COMPONENTS.md) · [Дизайн и токены](DESIGN.md)
- [Быстрый старт и навигация по OpenWiki](openwiki/quickstart.md)
- [API и генерация](openwiki/development/api-codegen.md) · [Моки](openwiki/development/mock-mode.md)
- [Тестирование](openwiki/testing/testing.md) · [Развёртывание](openwiki/operations/deployment.md)
