## Why

The starter still declares React Hook Form and its resolver package, while its reusable form layer has been removed and can no longer provide a consistent, type-safe form API. Rebuilding that layer on TanStack Form aligns the starter with the maintained implementation in `tanplate` and adds first-class form state inspection during development.

## What Changes

- **BREAKING**: Replace the React Hook Form integration and legacy `FormProvider`/`Controller`-style API with an `@tanstack/react-form` application form hook created through `createFormHook`.
- Add reusable, typed field adapters for text, number, textarea, checkbox, switch, select, radio-group, and slider controls, plus a form-aware submit button and shared error/value/event handling.
- Add the missing slider UI primitive required by the equivalent `tanplate` field set.
- Export the TanStack form contexts, `useAppForm`, composition helpers, `formOptions`, field components, submit button, and their public prop types from `@repo/core/form`.
- Remove `react-hook-form` and `@hookform/resolvers`; use TanStack Form's native Standard Schema support for existing Zod schemas.
- Add `@tanstack/react-form-devtools` with its `@tanstack/react-devtools` host and mount the form plugin only in development, without a static production import.
- Cover form bindings, validation/error rendering, submission state, field value conversion, accessibility, and production devtools exclusion with unit and browser-component tests.

## Capabilities

### New Capabilities

- `typed-form-components`: A reusable TanStack Form composition layer for `@repo/core`, including typed field controls, submission behavior, validation feedback, and development-only form devtools.

### Modified Capabilities

None.

## Impact

- Affected code: `packages/core/form`, `packages/core/slider`, core component exports, the application provider/layout used for development tooling, and associated Vitest browser/unit tests.
- Dependencies: add `@tanstack/react-form`, `@tanstack/react-form-devtools`, and `@tanstack/react-devtools`; remove `react-hook-form` and `@hookform/resolvers` from root and workspace manifests.
- Public API: consumers of the old RHF form helpers must migrate to `useAppForm`, `form.AppField`, field-bound controls, and `form.AppForm`.
- Runtime: form devtools are development-only and must not be statically imported into the production application path.
