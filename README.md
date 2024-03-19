# NextJS Starter

Шаблон для быстрого создания проектов на Next.js 14+

## 🚀 Как развернуть проект

```
bunx create-next-app -e https://github.com/webpractik/nextjs-starter --use-npm
```

### Копирование стандартных env переменных (зависят от проекта)

```
cp .env_example .env
```

## 🪄 Features:

-   Typescript
-   Tailwind
-   Zustand
-   ESLint
-   Prettier
-   Husky
-   Commitizen
-   Vitest
-   Lint-staged
-   Absolute Imports
-   Storybook
-   Sentry
-   Bundle analyzer
-   React Query
-   Kubb API Codegen 
-   Figma tokens
-   Env validation

## 🎯 Deploy

-   **NODEJS:** `^20`
-   **NPM:** `^10`
-   **Port:** `3000`
-   **Healthcheck:** `/api/health`

## 🎈 CI / CD:

-   `npm pkg delete scripts.prepare`
-   `npm ci --silent`
-   `npm run build`
-   `npm run prod`

## 📜 NPM Scripts:

| Script                      | Description                          |
|-----------------------------|--------------------------------------|
| `bun install / npm ci`      | Установка модулей                    |
| `bun run build`             | Запуск билда                         |
| `bun run dev`               | Запуск dev сборки                    |
| `bun run prod`              | Запуск прод сборки                   |
| `bun run analyze`           | Анализ билда                         |
| `bun run storybook`         | Запуск storybook                     |
| `bun run build-storybook`   | Билд storybook                       |
| `bun run test`              | Запуск тестов                        |
| `bun run test-run`          | Запуск тестов                        |
| `bun run coverage`          | Покрытие тестов                      |
| `bun run type-coverage`     | Покрытие типизацией                  |
| `bun run build-tokens`      | Билд фигма токенов                   |
| `bun run api-codegen`       | Автогенерация API                    |
| `bun run check:ts`          | Проверка TS                          |
| `bun run check:lint`        | Проверка eslint                      |
| `bun run check:format`      | Форматирование prettier              |
| `bun run check:all`         | Проверка всего в параллельном режиме |
| `bun run gen -- <название>` | Создание реакт компонента            |
| `bun run cruiser`           | Построить граф зависимостей          |
| `bun run clean`             | Очистка сборки                       |

## 📦 Packages:

-   [zod](https://zod.dev/)
-   [axios](https://axios-http.com/ru/docs/intro)
-   [@t3-oss/env-nextjs](https://env.t3.gg/docs/nextjs)
-   [lodash-es](https://lodash.com/docs)
-   [react-use](https://github.com/streamich/react-use#readme)
-   [isomorphic-dompurify](https://www.npmjs.com/package/isomorphic-dompurify)
-   [nanoid](https://www.npmjs.com/package/nanoid)
-   [clsx](https://www.npmjs.com/package/clsx)


## ENV переменные

Глобальные переменные:

```
FRONT_HOST - хост в локальной сети kubernetes
FRONT_PORT - порт
BACK_INTERNAL_URL - полный путь для обращения к backend приложению (http://back:80)

HTTP_AUTH_LOGIN=demo
HTTP_AUTH_PASS=demo
```

Переменные, которые должны быть доступны на момент сборки:

```
NEXT_PUBLIC_MOCKS_ENABLED=false - режим моков
NEXT_PUBLIC_APP_ENV - LOCAL | WORK | RC | PROD
NEXT_PUBLIC_FRONT_URL - публичный урл front приложения
NEXT_PUBLIC_BACK_URL - публичный урл back приложения (опционален)
NEXT_PUBLIC_SENTRY_DSN - DSN для доступа к Sentry
NEXT_PUBLIC_FRONT_PROXY - точка входа в BFF слой для проксирования запросов
```

