# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Next.js 16 + React 19 + TypeScript 6 monorepo starter with Tailwind CSS 4, enterprise monitoring (Sentry + OTEL), and strict type safety. Requires Node ^24, bun ^1.3.

## Commands

```bash
# Development
bun run dev              # Dev server with Turbopack
bun run storybook        # Storybook at port 6006

# Building
bun run build            # Production build (standalone output)
bun run analyze          # Build with Rsdoctor bundle analysis

# Code Quality
bun run tsc              # TypeScript type checking
bun run lint             # ESLint
bun run lint-fix         # ESLint with auto-fix
bun run unit-test        # Vitest single run
bun run e2e-test         # Playwright E2E tests

# Testing - single files
bunx vitest run path/to/file.test.tsx       # Single unit test
bunx playwright test src/tests/e2e/foo.ts   # Single E2E test

# Testing - modes
bun run unit-test-watch  # Vitest watch mode
bun run unit-coverage    # Coverage report

# API Generation (run from packages/api)
cd packages/api && bun run generate   # Bundle OpenAPI spec + generate TypeScript client

# Code Analysis
bun run knip             # Detect unused code (strict mode)

# Git
bun cz                   # Commitizen interactive commit (conventional commits)
```

## Architecture

### Monorepo Packages (bun workspaces)

```
packages/
├── core/           # @repo/core - UI component library (@base-ui/react, shadcn, Sonner, RHF)
├── api/            # @repo/api - Kubb codegen from OpenAPI → fetch clients, Zod schemas, React Query hooks, TS types
├── logger/         # @repo/logger - Logging (Adze)
├── metrics/        # @repo/metrics - Prometheus metrics (prom-client)
├── design-tokens/  # @repo/design-tokens - Style Dictionary → CSS variables
└── ts-config/      # @repo/ts-config - Shared TypeScript base config
```

### Application Structure

```
app/                    # Next.js App Router
├── api/               # API routes (health, metrics, ready)
└── (public)/          # Public route group

src/
├── components/        # Shared components
├── constants/         # Environment helpers (isDev, isProd, isBrowser)
├── env/              # Zod-validated env vars (client.ts, server.ts) via @t3-oss/env-nextjs
├── hooks/            # Custom React hooks
├── proxy/            # BFF proxy pipeline (chain.ts, inject-headers.ts, request-logging.ts)
├── styles/           # Tailwind globals and CSS theme variables (HSL-based)
├── tests/e2e/        # Playwright E2E tests
├── types/            # Global type declarations
└── utils/            # Utilities (cn, get-query-client, get-url, wait)
```

### Path Aliases

- `~/*` → project root
- `@/*` → `app/` directory
- `#/*` → `src/` directory

### Key Patterns

**Component Variants**: Use Class Variance Authority (CVA) for component styling variants.

**API Proxy (BFF)**: Root `proxy.ts` + composable pipeline (`src/proxy/chain.ts`). В dev клиент идёт через Next.js rewrite (`/bff-api` → `BACK_INTERNAL_URL`), в prod — напрямую по `NEXT_PUBLIC_BACK_URL`. Сервер всегда использует `BACK_INTERNAL_URL`. Подробнее: [`docs/bff-proxy.md`](docs/bff-proxy.md).

**Environment Variables**: Always validated with Zod schemas in `src/env/`. Client vars use `NEXT_PUBLIC_` prefix. Import as `import { environment } from '#/env/client'` or `'#/env/server'`.

**Imports**: Use `@repo/*` package imports, not relative paths to packages. ESLint enforces this via `no-restricted-imports`.

**API Codegen**: OpenAPI specs in `packages/api/openapi/` are bundled via Redocly into `bundled.yaml`, then Kubb generates types (`codegen/models/`), fetch clients (`codegen/`, using custom `fetch.client.ts`), Zod validators (`codegen/zod/`), and React Query hooks (`codegen/hooks/`), grouped by OpenAPI tag.

**Monitoring**: Server instrumentation registers Vercel OTEL + Sentry (conditional on DSN). Client instrumentation initializes Sentry with session replay. Both use env-based environment tagging (`{APP_ENV}-server`/`{APP_ENV}-client`).

## Code Style

- **TypeScript**: Strictest rules — `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `erasableSyntaxOnly`, `noUnusedLocals/Parameters`
- **ESLint**: `@antfu/eslint-config` flat config — tab indentation, single quotes, JSX enabled, CSS/HTML/JSON/Markdown formatters, better-tailwindcss plugin, jsx-a11y, Next.js rules, custom multiline-classname rule
- **Prettier**: Configured via `eslint-plugin-format` (no standalone config file)
- **Git hooks**: Lefthook runs lint-staged on pre-commit (`tsc` + `lint` on staged `.ts(x)` files), Commitizen on prepare-commit-msg

## Testing

- **Vitest**: Browser mode with Playwright/Chromium provider. Uses `@testing-library/react` + `vitest`. Aliases resolved via `vite-tsconfig-paths`.
- **Playwright E2E**: Chromium, Firefox, WebKit. Port configurable via `FRONT_PORT` (default 3000). Auto-starts dev server locally, prod server in CI. 2 retries in CI.
- **Storybook**: Stories co-located in `app/` and `packages/core/`. Framework: `@storybook/nextjs` with experimental RSC support. Addons: designs, docs, links.

## Next.js Config Highlights

- `output: 'standalone'` for Docker deployments
- React Compiler enabled (`reactCompiler: true`)
- Component caching enabled (`cacheComponents: true`)
- Typed routes enabled (`typedRoutes: true`)
- Turbopack for dev
- `optimizePackageImports`: `react-use`, `lodash-es`, `lucide-react`
- Production headers: CSP, HSTS, Permissions-Policy, streaming support (`X-Accel-Buffering: no`)
- Source maps uploaded to Sentry then deleted (prod only, conditional on `NEXT_PUBLIC_SENTRY_DSN`)
