## 1. Dependencies and Migration Baseline

- [x] 1.1 Re-check the proposed TanStack package versions for mutual React 19 compatibility, then add `@tanstack/react-form` to `@repo/core` runtime dependencies and add `@tanstack/react-devtools` plus `@tanstack/react-form-devtools` to root development dependencies with exact pins.
- [x] 1.2 Remove `react-hook-form` and `@hookform/resolvers` from both root and `@repo/core` manifests, update the npm lockfile, and verify the resolved dependency graph with `npm ls @tanstack/react-form @tanstack/react-devtools @tanstack/react-form-devtools`.

## 2. Slider Primitive

- [x] 2.1 Add a browser-component test that defines accessible controlled scalar and range behavior, value display, commit callbacks, and disabled state for the new Base UI slider primitive.
- [x] 2.2 Implement and export the `packages/core/slider` primitive set following existing `@repo/core` naming, styling, and barrel conventions, then make the slider component test pass.

## 3. Shared Form Foundation

- [x] 3.1 Add unit tests for field error flattening, text/number/slider value normalization, and consumer-callback-before-`handleBlur` ordering.
- [x] 3.2 Implement `fields/shared/field-errors.ts`, `field-values.ts`, and `field-events.ts` so all helper unit tests pass under strict TypeScript settings.
- [x] 3.3 Add a browser-component test for shared field shells covering stable label/control/description/error associations, a single alert region, and `data-invalid`, `data-touched`, and `data-dirty` metadata.
- [x] 3.4 Implement the TanStack form contexts and the render-prop-based `FieldShell`/`ChoiceFieldShell` adapters over the existing `@repo/core/field` primitives, then make the shell accessibility test pass.

## 4. Form-Bound Fields

- [x] 4.1 Add browser-component tests for controlled `TextField`, `TextareaField`, and `NumberField` behavior, including external state updates, empty number values, custom parse/format functions, blur callbacks, and validation feedback.
- [x] 4.2 Implement and export `TextField`, `TextareaField`, and `NumberField` against the local `Input` and `Textarea` event APIs, then make their tests pass.
- [x] 4.3 Add browser-component tests for `CheckboxField` and `SwitchField` covering boolean state, accessible labels/descriptions, disabled state, and touched metadata.
- [x] 4.4 Implement and export `CheckboxField` and `SwitchField` against the local Base UI controls, then make their tests pass.
- [x] 4.5 Add browser-component tests for `SelectField`, `RadioGroupField`, and `SliderField` covering option/scalar/range values, composite-control touched behavior, consumer close/commit callbacks, and accessible names.
- [x] 4.6 Implement and export `SelectField`, `RadioGroupField`, and `SliderField`, including option/value-label public types, then make their tests pass.

## 5. Application Form Factory and Submission

- [x] 5.1 Add an integration browser-component test that creates a form through the public `useAppForm` API, edits every registered field type, submits inferred typed values, and verifies direct Zod Standard Schema validation.
- [x] 5.2 Add focused tests for `SubmitButton` covering `canSubmit`, `isSubmitting`, explicit `disabled`, `disableUntilValid=false`, and the mandatory `submit` type.
- [x] 5.3 Implement `SubmitButton`, register all field/form components in one `createFormHook` factory, and export the contexts, hooks, composition helpers, `formOptions`, components, and prop types from `@repo/core/form`.
- [x] 5.4 Make the public integration and submit-button tests pass, including type-level assertions that form values and `AppField` names remain inferred without introducing `any`.

## 6. Development-Only Form Devtools

- [x] 6.1 Add tests proving the safe provider wrapper renders no devtools in production/test mode, the development implementation registers `formDevtoolsPlugin()`, and the root path has no static imports of either devtools package.
- [x] 6.2 Implement the client-only development wrapper and isolated TanStack Devtools module under `src/components/providers`, then mount only the safe wrapper once in `app/layout.tsx`.
- [x] 6.3 Verify the Form plugin is available for a mounted form in development and that the provider tests pass without loading devtools packages in the production/test branch.

## 7. Documentation and Legacy Audit

- [x] 7.1 Update `CLAUDE.md` and the relevant README section to describe TanStack Form, the native `<form>` plus `useAppForm` submission pattern, registered field components, direct Zod validation, and the development-only devtools behavior.
- [x] 7.2 Audit non-archived source and manifests with `rg -n "react-hook-form|@hookform/resolvers|FormProvider|Controller"` and remove any remaining legacy implementation references without changing archived OpenSpec artifacts or unrelated documentation.

## 8. Final Verification

- [x] 8.1 Format the touched web files with `npm run fmt`, then run `npm run test:unit` and `npm run test:component` until all helper and browser contracts pass.
- [x] 8.2 Run `npm run tsc`, `npm run lint`, and `npm run knip`, resolving only issues introduced by this migration.
- [x] 8.3 Run `npm run build` in production mode and inspect the generated output to confirm the active production application path contains no reachable `@tanstack/react-devtools` or `@tanstack/react-form-devtools` module.
- [x] 8.4 Review the final diff for accidental changes, confirm all OpenSpec scenarios are covered by implementation or tests, and run `openspec validate migrate-forms-to-tanstack-react-form --type change --strict --no-interactive`.
