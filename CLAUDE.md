# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Next.js 16 + React 19 + TypeScript monorepo starter with Tailwind CSS, enterprise monitoring (Sentry + OTEL), and strict type safety.

## Commands

```bash
# Development
npm run dev              # Dev server with Turbopack
npm run storybook        # Storybook at port 6006

# Building
npm run build            # Production build (standalone output)
npm run analyze          # Build with Rsdoctor bundle analysis

# Code Quality
npm run check:all        # Run all checks (ts, lint, format, test)
npm run check:ts         # TypeScript type checking
npm run check:lint       # ESLint
npm run check:lint-fix   # ESLint with auto-fix
npm run check:format     # Prettier
npm run check:test       # Vitest single run
npm run check:e2e        # Playwright E2E tests

# Testing
npm run test:watch       # Vitest watch mode
npm run test:coverage    # Coverage report

# API Generation
npm run generate         # Generate API client from OpenAPI specs

# Git
npm cz                   # Commitizen interactive commit (conventional commits)
```

## Architecture

### Monorepo Packages (npm workspaces)

```
packages/
├── core/           # @repo/core - UI component library (Button, Dialog, Form, etc.)
├── api/            # @repo/api - API client generation via Kubb from OpenAPI
├── logger/         # @repo/logger - Logging utilities (Adze)
├── metrics/        # @repo/metrics - Prometheus metrics
├── design-tokens/  # @repo/design-tokens - Style Dictionary tokens
└── ts-config/      # @repo/ts-config - Shared TypeScript configs
```

### Application Structure

```
app/                    # Next.js App Router
├── api/               # API routes (health, metrics, ready endpoints)
└── (public)/          # Public route group

src/
├── components/        # Shared components (error-boundary, responsive)
├── env/              # Zod-validated environment variables (client.ts, server.ts)
├── styles/           # Tailwind globals and theme CSS variables
├── hooks/            # Custom React hooks
└── tests/e2e/        # Playwright E2E tests
```

### Path Aliases

- `~/*` → project root
- `@/*` → `app/` directory
- `#/*` → `src/` directory

### Key Patterns

**Component Variants**: Use Class Variance Authority (CVA) for component styling variants

**API Proxy**: Backend requests go through `/api/` rewrites (BFF pattern) - see `proxy.ts`

**Environment Variables**: Always validated with Zod schemas in `src/env/`

**Imports**: Use `@repo/*` package imports, not relative paths to packages

## Configuration

- **TypeScript**: Strictest rules via `@repo/ts-config/base.json`
- **ESLint**: `@antfu/eslint-config` with tab indentation, single quotes
- **Prettier**: 4-space tabs, 100 char width, Tailwind class sorting
- **Vitest**: Browser mode with Playwright provider
- **Playwright**: Chromium, Firefox, WebKit; tests in `src/tests/e2e/`

## Stack

- Next.js 16 (App Router, Server Components, React Compiler)
- React 19, TypeScript 5.9
- Tailwind CSS 4 with tw-animate-css
- React Hook Form + Zod for forms
- Sentry for error tracking, Vercel OTEL for observability
- Kubb for OpenAPI → TypeScript code generation
