## NextJS Starter

Стартовый шаблон для быстрого создания проектов на Next.js

## 🚀 Как развернуть проект

```
npx create-next-app -e https://github.com/webpractik/nextjs-starter
```

## Настройка
- [Общие сведения](docs/settings.md)
- [Настройка Sentry](docs/sentry.md)
- [Настройка Google Analytics](docs/gtag.md)
- [Проксирование запросов](docs/proxy.md)

## CI / CD
- **NODEJS >= 16, NPM >= 8**
- **Порт 3000**
- **Healthcheck**: /api/healthcheck
- Установка модулей:  ```npm ci --silent --ignore-scripts``` 
- Запуск билда: ```npm run build```
- Запуск dev сборки: ```npm run start:dev```
- Запуск прод сборки: ```npm run start:prod``` 
- Режим proxy (dev): ```npm run proxy:dev```
- Режим proxy (prod): ```npm run proxy:prod```

## Features
- Typescript
- Sass
- Mobx
- ESLint
- Prettier
- Husky
- Commitizen
- Lint-staged
- Абсолютные импорты
- Proxy server
- Jest
- Storybook
- Sentry
- Bundle analyzer
- Google tag manager
- API Codegen

## Packages
- axios
- lodash
- react-use
- next-seo
- react-error-boundary
- normalize.css
- nanoid
- clsx
