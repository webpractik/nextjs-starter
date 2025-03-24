# NextJS Starter

A robust boilerplate for quickly building web applications with Next.js.

## 🪄 Features:

- Next 15+ (app router, server components)
- React 19
- Typescript
- Tailwind
- ESLint
- Prettier
- Husky
- Commitizen (git-cz)
- Vitest
- Playwright
- Lint-staged
- Storybook
- Sentry
- Bundle analyzer
- React Query
- Kubb API Codegen
- Figma tokens
- Env validation

## 🚀 Get started

1. Install the project using `npx create-next-app -e https://github.com/webpractik/nextjs-starter --use-npm`
2. Copy environment variables to .env (`cp .env.example .env`) and configure them.
3. Start the development server with `npm run dev`

## 🎯 Deploy

- **Node:** `^22`
- **Npm:** `^10`
- **App Port:** `3000`
- **Healthcheck:** `/api/health`
- **Ready:** `/api/ready`
- **Prometheus Metrics:** `/api/metrics`

## Run production mode:

- `npm ci`
- `npm run build`
- `npm run prod`

## 📦 Additional utilities:

- [nanoid](https://www.npmjs.com/package/nanoid) - Generate unique IDs
- [lodash-es](https://lodash.com/docs) - Utility library
- [react-use](https://github.com/streamich/react-use#readme) - Collection of hooks for React
- [isomorphic-dompurify](https://www.npmjs.com/package/isomorphic-dompurify) - DOM sanitization library
- [clsx](https://www.npmjs.com/package/clsx) - Utility for constructing CSS class names
