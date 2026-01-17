# Repository Guidelines

## Project Structure & Module Organization

- `app/`: Next.js App Router entrypoints, layouts, route handlers, and metadata files.
- `src/components/`, `src/hooks/`, `src/utils/`, `src/types/`: shared UI, hooks, helpers, and types.
- `src/styles/` and `src/fonts/`: global styles and font assets.
- `src/tests/e2e/`: Playwright end-to-end tests.
- `public/`: static assets served at the site root.
- `packages/`: workspace packages (api, core, design-tokens, logger, metrics, ts-config).

## Build, Test, and Development Commands

- `npm run dev`: start Next.js in dev mode with Turbopack.
- `npm run build`: production build.
- `npm run prod`: start the built app.
- `npm run check:ts`: TypeScript typecheck only.
- `npm run check:lint` / `npm run check:lint-fix`: lint (and fix) with ESLint.
- `npm run check:format`: format with Prettier (Tailwind plugin enabled).
- `npm run check:test`: run Vitest once.
- `npm run test:watch`: watch mode for unit tests.
- `npm run check:e2e`: run Playwright tests in `src/tests/e2e`.
- `npm run storybook` / `npm run build-storybook`: Storybook dev/build.

## Coding Style & Naming Conventions

- TypeScript-first codebase; keep types explicit where they aid readability.
- Formatting is enforced by Prettier (`tabWidth: 4`, `singleQuote: true`, `printWidth: 100`).
- ESLint is required for linting; run `npm run check:lint` before pushing.
- Test files use `*.test.tsx` (e.g., `src/components/.../component.test.tsx`).

## Testing Guidelines

- Unit tests use Vitest; place them near the component or utility under test.
- E2E tests use Playwright in `src/tests/e2e`.
- Use `npm run test:coverage` when coverage is requested.

## Commit & Pull Request Guidelines

- Commit messages follow Conventional Commits (e.g., `feat(styles): add tokens`).
- Commitizen is wired via Lefthook; use `npx cz` or a normal commit to trigger prompts.
- Pre-commit runs lint-staged; expect formatting and lint fixes to run on staged files.
- PRs should include a clear summary, test results, and screenshots for UI changes.

## Configuration Tips

- Use `.env` for local config; copy from `.env.example` when starting fresh.
- Node/NPM versions are defined in `package.json` (`node ^24`, `npm ^11`).
