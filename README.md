# NextJS Starter

A robust boilerplate for quickly building web applications with Next.js.

## Get started

1. Install the project using `bunx create-next-app -e https://github.com/webpractik/nextjs-starter`
2. Copy environment variables to .env (`cp .env.example .env`) and configure them.
3. Sync git hooks: `npx lefthook install`
4. Start the development server with `bun run dev`

## Features

- Next.js 16 (App Router, Server Components, React Compiler, Component Caching)
- React 19
- TypeScript 6 (erasable syntax, strict mode)
- Tailwind CSS 4 + tw-animate-css
- ESLint 10 (flat config, @antfu/eslint-config) + jsx-a11y
- Prettier (via eslint-plugin-format)
- Lefthook + Commitizen + lint-staged
- Vitest 4 (browser mode, Playwright provider)
- Playwright E2E (Chromium, Firefox, WebKit)
- Storybook 10
- Sentry 10 + Vercel OTEL
- Rsdoctor (bundle analysis)
- Nuqs (URL state management)
- Kubb API Codegen (fetch clients, Zod validators, React Query hooks)
- Design tokens (Style Dictionary → CSS variables)
- Env validation (Zod 4 + @t3-oss/env-nextjs)
- Knip (unused code detection)
- @base-ui/react + shadcn component library

## Requirements

- **Node.js:** `^24`
- **Bun:** `^1.3`

## Deploy

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
- [dayjs](https://day.js.org/) - Date manipulation library
- [framer-motion](https://motion.dev/) - Animation library
- [isomorphic-dompurify](https://www.npmjs.com/package/isomorphic-dompurify) - DOM sanitization library
- [clsx](https://www.npmjs.com/package/clsx) + [tailwind-merge](https://www.npmjs.com/package/tailwind-merge) - CSS class name utilities
- [tsafe](https://www.npmjs.com/package/tsafe) + [type-fest](https://www.npmjs.com/package/type-fest) - TypeScript utility types
