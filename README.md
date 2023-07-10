# NextJS Starter

Шаблон для быстрого создания проектов на Next.js 13.4+

## 🚀 Как развернуть проект

```
npx create-next-app -e https://github.com/webpractik/nextjs-starter
```

## 🪄 Features:
- Typescript
- Sass
- Mobx
- ESLint
- Stylelint
- Prettier
- Husky
- Commitizen
- Vitest
- Lint-staged
- Absolute Imports
- Storybook
- Sentry
- Bundle analyzer
- React Query
- API Codegen
- Figma tokens
- Security headers
- Generate components
- Coupling & cohesion graph

## 🎯 Deploy
- **NODEJS:** ```^18```
- **NPM:** ```^9```
- **Port:** ```3000```
- **Healthcheck:** ```/api/health```

## 🎈 CI / CD:
- `npm pkg delete scripts.prepare`
- `npm ci --silent`
- `npm run build`
- `npm run prod`

## 📝 Docs:
- [ENV переменные](docs/env.md)
- [Базовая настройка](docs/settings.md)
- [Структура проекта](https://kb.w6p.ru/doc/struktura-proekta-FmXknSyhJq)
- [Работа с API](https://kb.w6p.ru/doc/rabota-s-backend-api-TL0jXnQM9S)
- [Стандарт React & TS](https://kb.w6p.ru/doc/ts-react-DH9L2VPJ3T)
- [Error boundaries](https://kb.w6p.ru/doc/error-boundaries-RvX6tYG5dM)
- [React-query](https://kb.w6p.ru/doc/queries-xxCAi8Fex1)
- [Настройка Sentry](https://kb.w6p.ru/doc/sentry-RLE1b9FXT7)
- [Настройка прокси сервера](https://kb.w6p.ru/doc/kastomnyj-server-kOLtgu8DJG)
- [Дизайн токены](https://kb.w6p.ru/doc/dizajn-tokeny-fFz0aZ6F76)

## 📜 NPM Scripts:
- Установка модулей:  ```npm ci``` 
- Запуск билда: ```npm run build```
- Запуск dev сборки: ```npm run dev```
- Запуск прод сборки: ```npm run prod``` 
- Анализ билда: ```npm run analyze```
- Запуск storybook: ```npm run storybook```
- Билд storybook: ```npm run build-storybook```
- Запуск тестов ```npm run test```
- Покрытие тестов ```npm run coverage```
- Покрытие типов ```npm run type-coverage```
- Билд токенов: ```npm run build-tokens```
- Автогенерация API: ```npm run api-codegen```
- Проверка TS: ```npm run type-check```
- Проверка eslint: ```npm run lint```
- Проверка стилей: ```npm run stylelint```
- Проверка prettier: ```npm run format``` 
- Проверка всего в параллельном режиме: ```npm run check-all```
- Создать компонент ```npm run gen -- <название комопнента>```
- Построить граф зависимостей ```npm run cruiser```

## 📦 Packages:
- [axios](https://axios-http.com/ru/docs/intro)
- [lodash](https://lodash.com/docs)
- [react-use](https://github.com/streamich/react-use#readme)
- [dompurify](https://www.npmjs.com/package/dompurify)
- [modern-normalize](https://www.npmjs.com/package/modern-normalize)
- [nanoid](https://www.npmjs.com/package/nanoid)
- [clsx](https://www.npmjs.com/package/clsx)
