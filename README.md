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
-   [Feature Flags](https://kb.w6p.ru/doc/gitlab-feature-flags-1cyQfgOpDN/edit)


## 🎯 Deploy

-   **NODEJS:** `^20`
-   **NPM:** `^10`
-   **Port:** `3000`
-   **Healthcheck:** `/api/health`

## 🎈 CI / CD:

-   `npm ci`
-   `npm run build`
-   `npm run prod`

## 📜 NPM Scripts:

| Script                   | Description                          |
| ------------------------ | ------------------------------------ |
| `bun install / npm ci`   | Установка модулей                    |
| `bun run build`          | Запуск билда                         |
| `bun run dev`            | Запуск dev сборки                    |
| `bun run prod`           | Запуск прод сборки                   |
| `bun run analyze`        | Анализ билда                         |
| `bun run test:watch`     | Запуск тестов (watch)                |
| `bun run test:coverage`  | Покрытие тестов                      |
| `bun run type-coverage`  | Покрытие типизацией                  |
| `bun run check:ts`       | Проверка TS                          |
| `bun run check:lint`     | Проверка eslint                      |
| `bun run check:test`     | Запуск тестов                        |
| `bun run check:format`   | Форматирование prettier              |
| `bun run check:all`      | Проверка всего в параллельном режиме |
| `bun run cruiser`        | Построить граф зависимостей          |
| `bun run clean`          | Очистка сборки                       |
| `bun run dr:build:watch` | Declarative routing (watch)          |
| `bun run dr:build`       | Declarative routing                  |

## 📦 Packages:

-   [zod](https://zod.dev/)
-   [axios](https://axios-http.com/ru/docs/intro)
-   [@t3-oss/env-nextjs](https://env.t3.gg/docs/nextjs)
-   [lodash-es](https://lodash.com/docs)
-   [react-use](https://github.com/streamich/react-use#readme)
-   [isomorphic-dompurify](https://www.npmjs.com/package/isomorphic-dompurify)
-   [nanoid](https://www.npmjs.com/package/nanoid)
-   [clsx](https://www.npmjs.com/package/clsx)
-   [unleash](https://docs.getunleash.io/reference/sdks/next-js)
