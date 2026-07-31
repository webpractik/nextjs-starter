# NextJS Starter

A robust boilerplate for quickly building web applications with Next.js.

## Get started

1. Create the project using `npx create-next-app@latest -e https://github.com/webpractik/nextjs-starter`
2. Copy environment variables to .env (`cp .env.example .env`) and configure them.
3. Sync git hooks: `npx lefthook install`
4. Start the development server with `npm run dev`

## Features

- Next.js 16 (App Router, Server Components, React Compiler, Component Caching)
- React 19
- TypeScript 7 (erasable syntax, strict mode)
- Tailwind CSS 4 + tw-animate-css
- Oxlint 1 + Oxfmt
- Lefthook + Commitizen
- Vitest 4 (browser mode, Playwright provider)
- Playwright E2E (Chromium, Firefox, WebKit)
- Storybook 10
- Sentry 10 + Vercel OTEL
- Next.js bundle analysis
- Nuqs (URL state management)
- Kubb API Codegen (fetch clients, Zod validators, React Query hooks)
- TanStack Form (typed fields, direct Zod validation, development devtools)
- Design tokens (Style Dictionary → CSS variables)
- Env validation (Zod 4 + @t3-oss/env-nextjs)
- Knip (unused code detection)
- @base-ui/react + shadcn component library

## Forms

Reusable forms are exposed from `@repo/core/form` through one typed `useAppForm` factory. It
registers `TextField`, `TextareaField`, `NumberField`, `CheckboxField`, `SwitchField`,
`SelectField`, `RadioGroupField`, `SliderField`, and `SubmitButton`.

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

TanStack Form Devtools and its Form plugin are mounted only in development. The production and
test application paths render no devtools host and do not statically import the devtools packages.

## Requirements

- **Node.js:** `^24`
- **npm:** Included with Node.js

## Deploy

- **App Port:** `3000`
- **Healthcheck:** `/api/health`
- **Ready:** `/api/ready`
- **Prometheus Metrics:** `/api/metrics`

## Run production mode

- `npm install`
- `npm run build`
- `npm run prod`

## Additional utilities

- [nanoid](https://www.npmjs.com/package/nanoid) - Generate unique IDs
- [lodash-es](https://lodash.com/docs) - Utility library
- [react-use](https://github.com/streamich/react-use#readme) - Collection of hooks for React
- [dayjs](https://day.js.org/) - Date manipulation library
- [framer-motion](https://motion.dev/) - Animation library
- [isomorphic-dompurify](https://www.npmjs.com/package/isomorphic-dompurify) - DOM sanitization library
- [clsx](https://www.npmjs.com/package/clsx) + [tailwind-merge](https://www.npmjs.com/package/tailwind-merge) - CSS class name utilities
- [tsafe](https://www.npmjs.com/package/tsafe) + [type-fest](https://www.npmjs.com/package/type-fest) - TypeScript utility types
