## NextJS Starter

Стартовый шаблон для быстрого создания проектов на Next.js

## 🚀 Как развернуть проект

```
npx create-next-app -e https://github.com/webpractik/nextjs-starter
```

## Документация
- [Базовая настройка](docs/settings.md)
- [Структура проекта](docs/project-structure.md)
- [Работа с backend API](docs/api.md)
- [Настройка Sentry](docs/sentry.md)
- [Настройка кастомного прокси сервера](docs/custom-proxy.md)
- [Дизайн токены](docs/design-tokens.md)

## CI / CD
- **NODEJS >= 18, NPM >= 8**
- **Порт 3000**
- **Healthcheck**: /api/healthcheck

## NPM Scripts
- Установка модулей:  ```npm ci``` 
- Запуск билда: ```npm run build```
- Запуск dev сборки: ```npm run dev```
- Запуск прод сборки: ```npm run prod``` 
- Режим proxy (dev): ```npm run proxy:dev```
- Режим proxy (prod): ```npm run proxy:prod```
- Анализ билда: ```npm run analyze```
- Запуск storybook: ```npm run storybook```
- Билд storybook: ```npm run build-storybook```
- Билд токенов: ```npm run build-tokens```
- Автогенерация API: ```npm run api-codegen```
- Проверка TS: ```npm run type-check```
- Проверка eslint: ```npm run lint```
- Проверка prettier: ```npm run format``` 
- Проверка всего в параллельном режиме: ```npm run check-all```

### ENV переменные
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
```

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
