## NextJS Starter

Стартовый шаблон для быстрого создания проектов на Next.js

## 🚀 Как развернуть проект

```
npx create-next-app -e https://github.com/webpractik/nextjs-starter
```

## CI / CD
- **NODEJS:** ```>= 18```
- **NPM:** ```>= 8```
- **Port:** ```3000```
- **Healthcheck:** ```/api/health```

## Документация
- [ENV переменные](docs/env.md)
- [Базовая настройка](docs/settings.md)
- [Структура проекта](docs/project-structure.md)
- [Работа с API](docs/api.md)
- [Стандарт React & TS](docs/react-typescript.md)
- [Error boundaries](docs/boundaries.md)
- [Mocks](docs/mocks.md)
- [React-query](docs/queries.md)
- [Настройка Sentry](docs/sentry.md)
- [Настройка кастомного прокси сервера](docs/custom-proxy.md)
- [Дизайн токены](docs/figma-tokens.md)

## NPM Scripts
- Установка модулей:  ```npm ci``` 
- Запуск билда: ```npm run build```
- Запуск dev сборки: ```npm run dev```
- Запуск прод сборки: ```npm run prod``` 
- Анализ билда: ```npm run analyze```
- Запуск storybook: ```npm run storybook```
- Билд storybook: ```npm run build-storybook```
- Билд токенов: ```npm run build-tokens```
- Автогенерация API: ```npm run api-codegen```
- Проверка TS: ```npm run type-check```
- Проверка eslint: ```npm run lint```
- Проверка prettier: ```npm run format``` 
- Проверка всего в параллельном режиме: ```npm run check-all```

## Features
- Typescript
- Sass
- Mobx
- ESLint
- Prettier
- Husky
- Commitizen
- Lint-staged
- Absolute Imports
- Proxy server
- Storybook
- Sentry
- Bundle analyzer
- React Query
- API Codegen
- Mock Service Worker
- Figma tokens
- Security headers

## Packages
- [axios](https://axios-http.com/ru/docs/intro)
- [lodash](https://lodash.com/docs)
- [react-use](https://github.com/streamich/react-use#readme)
- [next-seo](https://www.npmjs.com/package/next-seo)
- [react-error-boundary](https://www.npmjs.com/package/react-error-boundary)
- [modern-normalize](https://www.npmjs.com/package/modern-normalize)
- [nanoid](https://www.npmjs.com/package/nanoid)
- [clsx](https://www.npmjs.com/package/clsx)
