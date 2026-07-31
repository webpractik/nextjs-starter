## Context

`nextjs-starter` is a Next.js 16/React 19 npm-workspace monorepo. Reusable UI lives in `packages/core`, but the previously published `packages/core/form` implementation was deleted and only the root and core declarations for `react-hook-form` and `@hookform/resolvers` remain. There are currently no live RHF consumers to convert in the application source.

The reference implementation at `/home/user/projects/tanplate/src/components/form` establishes the desired architecture: one `createFormHook` instance, context-bound field components, a form-aware submit button, shared value/error/event helpers, and a development-only TanStack Form devtools plugin. It cannot be copied verbatim because `tanplate` uses namespaced UI primitives, while `@repo/core` exposes shadcn-style named components and currently has no slider primitive.

TanStack's current React guidance presents `createFormHookContexts` plus `createFormHook` as the scalable way to bind an application's UI library to forms, supports Zod directly through Standard Schema, and hosts Form Devtools through `TanStackDevtools`:

- https://tanstack.com/form/latest/docs/framework/react/quick-start
- https://tanstack.com/form/latest/docs/framework/react/guides/form-composition
- https://tanstack.com/form/latest/docs/framework/react/guides/validation
- https://tanstack.com/form/latest/docs/framework/react/guides/devtools

## Goals / Non-Goals

**Goals:**

- Restore a reusable, strictly typed form layer at `@repo/core/form` using TanStack Form rather than RHF.
- Match the useful behavior and public field set of the `tanplate` implementation while adapting it to this repository's Base UI/shadcn primitives and conventions.
- Keep a single shared form/field context so consumers can use `AppField`, `AppForm`, `withForm`, `withFieldGroup`, and extensions without context mismatches.
- Make labels, descriptions, validation errors, touched/dirty state, and submission state accessible and testable.
- Support existing Zod 4 schemas directly, without a resolver dependency.
- Provide Form Devtools in development without statically importing the devtools packages from the production application path.
- Remove all RHF dependencies, exports, imports, and stale architecture documentation.

**Non-Goals:**

- Preserve a compatibility wrapper for `FormProvider`, `Controller`, or the previous shadcn RHF helper names.
- Add a schema-driven form generator, multi-step wizard, array-field abstraction, or server-action adapter.
- Introduce `@tanstack/react-form-nextjs`; this change covers client form composition and is compatible with ordinary Next.js client components.
- Migrate application forms, because the current application has no live RHF form consumers.
- Add Query or Router devtools plugins; only the host required for the requested Form plugin is in scope.

## Decisions

### 1. Own the reusable form layer in `@repo/core`

Create `packages/core/form` with `form-context.ts`, `form.tsx`, `fields/`, `submit-button/`, colocated tests, and barrel exports. `@tanstack/react-form` belongs in `packages/core` runtime dependencies because that workspace owns all runtime imports. The root application will own `@tanstack/react-devtools` and `@tanstack/react-form-devtools` as development dependencies because the host is mounted once at the application boundary.

The initial exact versions follow the repository's pinning policy and current compatible releases: `@tanstack/react-form@1.33.2`, `@tanstack/react-devtools@0.10.9`, and `@tanstack/react-form-devtools@0.2.31`. Implementation SHALL re-check registry compatibility before updating the lockfile if the proposal is applied later.

Alternative considered: place the form code under `src/components/form`, matching `tanplate` literally. Rejected because it would split reusable UI behavior between the application and the existing `@repo/core` package.

### 2. Use one `createFormHook` factory and expose the official composition API

`form-context.ts` will create and export `fieldContext`, `formContext`, `useFieldContext`, and `useFormContext`. `form.tsx` will register all field components plus `SubmitButton` in one `createFormHook` call and export `useAppForm`, `extendForm`, `withForm`, `withFieldGroup`, and `useTypedAppFormContext`; `formOptions` will be re-exported from TanStack Form.

Consumers will render a native `<form>` and route its submit event to `form.handleSubmit()`, as in the official quick start and the `tanplate` reference. No replacement component named `Form` will hide DOM submission behavior. `withForm` is the preferred typed context consumer; `useTypedAppFormContext` remains exported for the cases covered by the factory API, consistent with the API warning to prefer `withForm` where possible: https://tanstack.com/form/latest/docs/framework/react/reference/functions/createFormHook

Alternative considered: use raw `useForm` and `form.Field` in every consumer. Rejected because it repeats control bindings, weakens consistency, and does not deliver the requested reusable component layer.

### 3. Adapt behavior, not primitive source code

Implement the same eight bound fields as `tanplate`, but use this repository's named primitives and event contracts:

- `Input`/`Textarea` use native `onChange` and `onBlur` events.
- `Checkbox`/`Switch` use controlled `checked` plus `onCheckedChange`.
- `Select`/`RadioGroup` use controlled `value` plus `onValueChange` and mark composite interaction as touched at close/selection.
- `SliderField` uses a new Base UI slider primitive in `packages/core/slider`, supports scalar and range values, and marks the field touched on commit.
- `NumberField` owns explicit string-to-value parsing and formatting, including a configurable empty value.

Form-bound props omit `name`, controlled value/default-value props, and the primary change callback so consumers cannot create two sources of truth. Supported secondary callbacks such as `onBlur`, `onOpenChange`, and `onValueCommitted` run before form metadata is updated.

Alternative considered: expose only a generic `Field` render prop. Rejected because it would not provide the low-boilerplate, consistent field set requested from the reference implementation. Another alternative was to omit `SliderField`; rejected because parity would then be incomplete and Base UI already supplies the required accessible primitive.

### 4. Centralize field shell, value conversion, and error normalization

Shared helpers will be isolated under `fields/shared`:

- `field-values.ts` converts unknown field state safely for text, number, and slider controls.
- `field-events.ts` composes consumer callbacks with `field.handleBlur()`.
- `field-errors.ts` flattens supported TanStack/Standard Schema error shapes into displayable strings.
- `field-shell.tsx` renders `Field`, `FieldLabel`, `FieldDescription`, and `FieldError` from `@repo/core/field`.

Because the starter's field primitives do not automatically wire label and message IDs, the shared shell will generate stable IDs and provide the adapter with `id`, `aria-describedby`, and `aria-invalid` through a render-prop/control-props contract. It will expose `data-invalid`, `data-touched`, and `data-dirty` on the field container and render all normalized errors through a single associated alert region.

Alternative considered: copy `tanplate`'s `Field.Root` calls. Rejected because that API does not exist in `@repo/core`; relying on implicit association would regress accessibility.

### 5. Use Standard Schema directly for validation

Consumers pass Zod schemas or validator functions directly to TanStack Form's `validators`. No resolver adapter or transformed-value compatibility layer will be introduced. The existing Zod 4 version implements Standard Schema and is supported by the documented TanStack validation path: https://tanstack.com/form/latest/docs/framework/react/guides/validation

Alternative considered: retain `@hookform/resolvers` during transition. Rejected because it is specific to RHF and there are no live consumers requiring a staged migration.

### 6. Subscribe narrowly to form submission state

`SubmitButton` will use `form.Subscribe` with a selector for only `[state.canSubmit, state.isSubmitting]`. It will always set `type="submit"`, combine explicit `disabled`, submitting state, and the default `disableUntilValid=true` policy, and otherwise pass through `Button` props.

Alternative considered: read the entire form state from context on every render. Rejected because it causes unrelated form updates to re-render the button and ignores TanStack Form's granular subscription model.

### 7. Isolate Form Devtools behind a development-only client boundary

Create a small client wrapper under `src/components/providers` that chooses a lazy/dynamic devtools implementation only when `isDev` is true. The implementation module alone imports `TanStackDevtools` and `formDevtoolsPlugin`; `app/layout.tsx` imports only the safe wrapper and renders it once near the root provider tree. In production the wrapper returns `null`, and compile-time `NODE_ENV` elimination prevents the implementation from entering the active production path.

The plugin setup follows the official host contract (`plugins={[formDevtoolsPlugin()]}`): https://tanstack.com/form/latest/docs/framework/react/guides/devtools

Alternative considered: statically import the devtools packages in `app/layout.tsx` and conditionally render them. Rejected because static imports can retain development tooling in production chunks. A standalone custom inspector was also rejected because the supported plugin already provides the requested capability.

### 8. Verify contracts at helper, component, and production-boundary levels

Unit tests will cover error flattening, value normalization, callback order, and the production devtools import guard. Vitest browser-component tests will exercise all eight controls through `useAppForm`, direct Zod validation, accessible labels/errors, submit disabling, and submitted values. Type checking will verify inference and public prop types. The final verification sequence is `npm run test:unit`, `npm run test:component`, `npm run tsc`, `npm run lint`, `npm run knip`, and `npm run build`.

Alternative considered: rely only on stories or snapshots. Rejected because the critical behavior is event/state integration and production isolation, which require interaction and build checks.

## Risks / Trade-offs

- **Breaking public API for legacy form consumers** → Do not provide a misleading compatibility shim; document the native `<form>`/`useAppForm` migration pattern and make the replacement exports explicit.
- **Base UI event signatures differ from the `tanplate` wrappers** → Derive props from the actual local primitives and cover every adapter with browser interaction tests.
- **Strict TypeScript generics can become slow or leak `any`** → Keep the factory in one module, use TanStack's context APIs as documented, export named prop types, and make `npm run tsc` a gate.
- **Labels or errors can become disconnected from composite controls** → Centralize stable IDs and ARIA props in the shared shell and assert accessible roles/names/descriptions in browser tests.
- **Devtools packages are independently versioned and still evolving** → Pin exact compatible versions, isolate them to one module, and verify both development rendering and production build exclusion.
- **Production bundling may retain a lazy devtools chunk despite a runtime guard** → Use a compile-time `isDev` branch, keep package imports out of the root wrapper, inspect the production build output, and fail the source/bundle guard test if imports remain reachable.
- **Removing resolver behavior can expose assumptions about transformed schema values** → Document that validation reports errors but submission values remain TanStack form values; require explicit parsing in `NumberField` or submission logic.

## Migration Plan

1. Update workspace manifests with pinned TanStack dependencies and remove RHF/resolver declarations; update the npm lockfile without touching unrelated user changes.
2. Add and test the Base UI slider primitive required by `SliderField`.
3. Add the shared form contexts/factory, helpers, field adapters, submit button, public exports, and component/unit tests.
4. Add the development-only Form Devtools wrapper and plugin implementation, then mount the safe wrapper in the root layout.
5. Remove stale RHF references from `CLAUDE.md`/README documentation and audit non-archived source with `rg`.
6. Run the full verification sequence and inspect the production output for reachable devtools package code.

No persisted data or server contract changes are involved. Rollback consists of reverting this change's dependency, component, provider, and documentation commits together; the previous repository state contains no active form consumers requiring data migration.

## Open Questions

None. The implementation can proceed with the package boundaries, public component set, dependency placement, and development-only devtools policy defined above.
