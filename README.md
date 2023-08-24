# NextJS Starter

Шаблон для быстрого создания проектов на Next.js 13.4+

## 🚀 Как развернуть проект

```
npx create-next-app -e https://github.com/webpractik/nextjs-starter
```

### Копирование стандартных env переменных (зависят от проекта)

```
cp .env_example .env
```

## 🪄 Features:

-   Typescript
-   Sass
-   Mobx
-   ESLint
-   Stylelint
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
-   API Codegen
-   Figma tokens
-   Security headers
-   Generate components
-   Coupling & cohesion graph
-   Env variables validation

## 🎯 Deploy

-   **NODEJS:** `^18`
-   **NPM:** `^9`
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
-   [Структура проекта](https://kb.w6p.ru/s/086418d0-7737-473d-9e01-8b75675b2fbd)
-   [Работа с API](https://kb.w6p.ru/s/d777074e-dc22-4c8f-836f-683e6b6559c6)
-   [Стандарт React & TS](https://kb.w6p.ru/s/wp-ts-react-standart)
-   [Error boundaries](https://kb.w6p.ru/s/805fa567-7fbb-468f-95e5-c223783e96f2)
-   [React-query](https://kb.w6p.ru/doc/queries-xxCAi8Fex1)
-   [Настройка Sentry](https://kb.w6p.ru/doc/sentry-RLE1b9FXT7)
-   [Настройка прокси сервера](https://kb.w6p.ru/s/4426c5ad-9fd2-45e5-93a0-539baabbb5cd)
-   [Дизайн токены](https://kb.w6p.ru/s/55e92ed7-4336-4c0e-a48e-a91b4a3d30ef)

## 📜 NPM Scripts:

| Script                      | Description                          |
| --------------------------- | ------------------------------------ |
| `npm ci`                    | Установка модулей                    |
| `npm run build`             | Запуск билда                         |
| `npm run dev`               | Запуск dev сборки                    |
| `npm run prod`              | Запуск прод сборки                   |
| `npm run analyze`           | Анализ билда                         |
| `npm run storybook`         | Запуск storybook                     |
| `npm run build-storybook`   | Билд storybook                       |
| `npm run test`              | Запуск тестов                        |
| `npm run coverage`          | Покрытие тестов                      |
| `npm run type-coverage`     | Покрытие типизацией                  |
| `npm run build-tokens`      | Билд фигма токенов                   |
| `npm run api-codegen`       | Автогенерация API                    |
| `npm run type-check`        | Проверка TS                          |
| `npm run lint`              | Проверка eslint                      |
| `npm run stylelint`         | Проверка стилей                      |
| `npm run format`            | Форматирование prettier              |
| `npm run check-all`         | Проверка всего в параллельном режиме |
| `npm run gen -- <название>` | Создание реакт компонента            |
| `npm run cruiser`           | Построить граф зависимостей          |
| `npm run clean`             | Очистка сборки                       |

## 📦 Packages:

-   [zod](https://zod.dev/)
-   [axios](https://axios-http.com/ru/docs/intro)
-   [react-query-kit](https://github.com/liaoliao666/react-query-kit#examples)
-   [@t3-oss/env-nextjs](https://env.t3.gg/docs/nextjs)
-   [lodash](https://lodash.com/docs)
-   [react-use](https://github.com/streamich/react-use#readme)
-   [isomorphic-dompurify](https://www.npmjs.com/package/isomorphic-dompurify)
-   [modern-normalize](https://www.npmjs.com/package/modern-normalize)
-   [nanoid](https://www.npmjs.com/package/nanoid)
-   [clsx](https://www.npmjs.com/package/clsx)
