# Next.js Starter

A production-oriented Next.js monorepo starter with a shared component library, typed API
generation, observability, and browser-backed tests.

## Quick start

Requirements: Node.js 24 and the npm version bundled with it.

```bash
npm ci
cp .env.example .env
npx lefthook install
npm run dev
```

The application validates environment variables while loading the Next.js config. Review
[the environment reference](docs/environment.md) before replacing the safe local values in
`.env`.

`VALKEY_URL=redis://valkey:6379` is intended for the Compose network. To run the app directly on
the host, point it at a host-reachable Valkey instance.

## Docker Compose

The development and standalone production topologies run two Next.js replicas behind Traefik with
one shared ephemeral Valkey cache. See [Docker Compose](docs/docker-compose.md) for the exact
Makefile commands, environment contract, and shutdown procedure.

## Current capabilities

- Next.js 16 App Router, React 19, TypeScript 7, and Tailwind CSS 4.
- Cache Components enabled with shared Valkey storage for ordinary `'use cache'`; the React
  Compiler is enabled only for production builds.
- npm workspaces for `@repo/core` and `@repo/api`.
- Base UI/shadcn-style primitives and typed TanStack Form composition in `@repo/core`.
- OpenAPI 3.2 source contract, Redocly validation, and Kubb-generated TypeScript models, fetch
  clients, Zod schemas, React Query hooks, Faker factories, mock routes, and cache tags.
- Runtime mock mode without a live backend.
- Sentry, OpenTelemetry, Adze logging, and Prometheus metrics.
- Vitest unit and real-browser component projects, Playwright E2E, and Storybook.
- Oxfmt, Oxlint, Knip, JSCPD, Lefthook, and Commitizen.

The Petstore contract under `packages/api/openapi/` is a code-generation example. It does not add a
Petstore backend or Next.js Route Handlers. Kubb 4.39.2 also reports OpenAPI 3.2 as officially
unsupported even though this repository's direct generation and TypeScript checks pass. See
[API code generation](docs/api-codegen.md) for the exact compatibility policy.

## Forms

Reusable forms are exposed from `@repo/core/form` through one typed `useAppForm` factory. It
registers text, textarea, number, date, phone, checkbox, switch, select, radio-group, and slider
fields together with `SubmitButton`.

Use a native `<form>` element and delegate its submit event to the TanStack form instance. Zod 4
schemas implement Standard Schema and can be passed directly without a resolver:

```tsx
'use client'

import { useAppForm } from '@repo/core/form'
import { z } from 'zod'

const projectSchema = z.object({ name: z.string().min(3) })

export function ProjectForm() {
    const form = useAppForm({
        defaultValues: { name: '' },
        validators: { onChange: projectSchema },
        onSubmit: ({ value }) => {
            // Send the inferred value to the application boundary.
        },
    })

    return (
        <form
            onSubmit={(event) => {
                event.preventDefault()
                void form.handleSubmit()
            }}
        >
            <form.AppField name="name">
                {(field) => <field.TextField label="Project name" />}
            </form.AppField>
            <form.AppForm>
                <form.SubmitButton>Save project</form.SubmitButton>
            </form.AppForm>
        </form>
    )
}
```

TanStack Form Devtools are mounted only in development and are kept outside production and test
application paths.

## Verification

```bash
npm run verify:fast # formatting, lint, TypeScript
npm run test        # all Vitest projects
npm run test:e2e    # standalone Playwright E2E
npm run test:cache:integration
npm run test:cache:matrix:dev
npm run test:cache:matrix:prod
npm run verify:cache:compose
npm run verify      # full local gate
```

The full local `verify` runs `verify:fast`, Knip, JSCPD, all Vitest projects, and then standalone
Playwright E2E. Lefthook formats staged files and uses `verify:fast` for pre-commit checks.

GitLab CI runs `verify:fast` and Vitest in separate stages. It does not run standalone Playwright
E2E or create a deployable Next.js build. Deploy jobs must build or obtain their own bundle, and
project-level or remote GitLab includes must be checked separately for dependencies on the removed
`build` job and artifacts. See [testing guidelines](docs/testing-guidelines.md) and
[deployment](docs/deployment.md).

## Production endpoints

- Health: `/api/health`
- Readiness: `/api/ready`
- Prometheus metrics: `/api/metrics`

Both health and readiness currently return a constant `200`; readiness does not probe upstream
dependencies. Run a local production build with `npm run build` followed by `npm run prod`.

## Documentation

Start with the [documentation index](docs/README.md). The main operational references are:

- [Architecture](docs/architecture.md)
- [Environment variables](docs/environment.md)
- [API code generation](docs/api-codegen.md)
- [BFF proxy](docs/bff-proxy.md)
- [Mock mode](docs/mock-mode.md)
- [Cache and streaming](docs/cache-and-streaming.md)
- [Docker Compose](docs/docker-compose.md)
- [Self-hosting](docs/self-hosting.md)
- [Testing guidelines](docs/testing-guidelines.md)
- [Deployment](docs/deployment.md)
