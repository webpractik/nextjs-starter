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

## 📝 Docs:

-   [ENV переменные](docs/env.md)
-   [Базовая настройка](docs/settings.md)
-   [Работа с API](https://kb.w6p.ru/s/d777074e-dc22-4c8f-836f-683e6b6559c6)
-   [Стандарт React & TS](https://kb.w6p.ru/s/wp-ts-react-standart)
-   [Error boundaries](https://kb.w6p.ru/s/805fa567-7fbb-468f-95e5-c223783e96f2)
-   [Настройка Sentry](https://kb.w6p.ru/doc/sentry-RLE1b9FXT7)
-   [Дизайн токены](https://kb.w6p.ru/s/55e92ed7-4336-4c0e-a48e-a91b4a3d30ef)

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
-   [lodash](https://lodash.com/docs)
-   [react-use](https://github.com/streamich/react-use#readme)
-   [isomorphic-dompurify](https://www.npmjs.com/package/isomorphic-dompurify)
-   [nanoid](https://www.npmjs.com/package/nanoid)
-   [clsx](https://www.npmjs.com/package/clsx)
