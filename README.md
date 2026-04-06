# NextJS Starter

A robust boilerplate for quickly building web applications with Next.js.

## Features

- Next.js 16 (App Router, Server Components, React Compiler)
- React 19
- TypeScript 6
- Tailwind CSS 4
- ESLint (flat config)
- Prettier
- Lefthook
- Commitizen
- Vitest (browser mode)
- Playwright
- Lint-staged
- Storybook
- Sentry + Vercel OTEL
- Rsdoctor
- Nuqs
- Kubb API Codegen
- Design tokens (Style Dictionary)
- Env validation (Zod + @t3-oss/env)

## Get started

1. Install the project using `bunx create-next-app -e https://github.com/webpractik/nextjs-starter`
2. Copy environment variables to .env (`cp .env.example .env`) and configure them.
3. Start the development server with `bun run dev`

## Deploy

- **Bun:** `^1.3`
- **App Port:** `3000`
- **Healthcheck:** `/api/health`
- **Ready:** `/api/ready`
- **Prometheus Metrics:** `/api/metrics`

## Run production mode

- `bun install`
- `bun run build`
- `bun run prod`

## Additional utilities

- [nanoid](https://www.npmjs.com/package/nanoid) - Generate unique IDs
- [lodash-es](https://lodash.com/docs) - Utility library
- [react-use](https://github.com/streamich/react-use#readme) - Collection of hooks for React
- [isomorphic-dompurify](https://www.npmjs.com/package/isomorphic-dompurify) - DOM sanitization library
- [clsx](https://www.npmjs.com/package/clsx) - Utility for constructing CSS class names
