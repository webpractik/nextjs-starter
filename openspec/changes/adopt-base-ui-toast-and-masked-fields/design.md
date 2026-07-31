## Context

`nextjs-starter` is a Next.js 16/React 19 npm-workspace monorepo whose reusable UI lives in `packages/core`. The core package already uses `@base-ui/react@1.6.0` and shadcn's `base-vega` conventions, but its global notifications still come from `sonner@2.0.7`. The application mounts that wrapper once in `app/layout.tsx`, while Vitest aliases Sonner to a custom browser-test mock.

The completed `migrate-forms-to-tanstack-react-form` change introduced a single `createFormHook` factory, a shared accessible `FieldShell`, and a set of field-bound controls. Date and phone inputs now belong in that registry rather than in a second form abstraction.

The implementation is grounded in the current primary and registry sources:

- Base UI Toast manager, provider, viewport, lifecycle, actions, promises, stacking, swipe, and keyboard behavior: https://base-ui.com/react/components/toast
- Current shadcn `@shadcn/toast` and `@shadcn/attachment` registry output inspected through `npx shadcn@latest view`.
- Attachment anatomy, state, size, orientation, grouping, and accessibility: https://ui.shadcn.com/docs/components/base/attachment
- Shared `shimmer` and `scroll-fade` utilities: https://ui.shadcn.com/docs/changelog/2026-06-chat-components
- Maskito's React controlled-input guidance: https://maskito.dev/frameworks/react/
- Maskito date mask and conversion model: https://maskito.dev/kit/date/
- Maskito phone generator and metadata choices: https://maskito.dev/addons/phone/

There is a documentation inconsistency: the older shadcn Toast component page still recommends Sonner, while the live `@shadcn/toast` registry now contains a Base UI implementation. Because the user explicitly requires Base UI and removal of Sonner, Base UI's primary documentation defines behavior and the live registry defines the local shadcn-style wrapper.

## Goals / Non-Goals

**Goals:**

- Replace Sonner completely with a composable Base UI toast module and one global manager.
- Add the current shadcn Attachment component family without changing its documented anatomy or lifecycle model.
- Add accessible, controlled `DateField` and `PhoneField` adapters to the existing TanStack Form factory using Maskito's React integration.
- Keep masked form values as display strings, matching Maskito's native value model and the user-approved contract.
- Provide colocated real-browser component tests and Storybook stories for Toast, Attachment, DateField, and PhoneField.
- Keep dependency versions exact and remove every active Sonner runtime/test integration.

**Non-Goals:**

- Preserve the callable Sonner API or add a compatibility re-export at `@repo/core/sonner`.
- Add a calendar popover/date picker, country selector, phone validation library wrapper, or automatic `Date`/E.164 conversion.
- Build a generic public `MaskedField`; only the two requested domain-neutral presets are added.
- Add attachment upload, persistence, progress calculation, or file-selection behavior; Attachment presents caller-owned state.
- Fix the existing unrelated `packages/core/components.json` alias/path drift or migrate other components.

## Decisions

### 1. Follow Base UI behavior and adapt the current shadcn Toast registry

Create `packages/core/toast/toast.tsx`, its barrel, tests, and stories. The module will wrap `@base-ui/react/toast` and export `Toaster`, the provider/portal/viewport/root/content/title/description/action/close parts, one shared `toast` manager, `createToastManager`, and `useToastManager`. `ToastList` remains private because it is the default renderer owned by `Toaster`.

The wrapper will preserve the current `base-vega` registry structure and styles, replacing the registry-only icon placeholder with direct Lucide icons. Supported status icons are decorative; screen-reader announcements come from each toast's title/description as required by Base UI. `ToastClose` supplies an accessible default label, and `ToastAction` renders the existing core `Button` through Base UI's `render` composition.

`app/layout.tsx` will change only its import to `@repo/core/toast` and continue mounting one `Toaster`. Consumers migrate from calls such as `toast.success(message)` to Base UI manager calls such as `toast.add({ type: 'success', title: message })`; promise, update, and close behavior comes directly from the manager.

Alternative considered: keep Sonner behind a renamed wrapper. Rejected because it would not satisfy the requested dependency removal or Base UI semantics. Another alternative was a narrow `notify()` facade; rejected because it would hide documented manager features and make composition less flexible.

### 2. Remove Sonner as one atomic migration

Delete `packages/core/sonner` and `src/tests/mocks/sonner.ts`, remove the dependency from `packages/core/package.json`, remove Vitest's alias/setup/optimizer entries, and update active documentation that names Sonner. No compatibility directory or deprecated forwarding export will remain.

The migration is intentionally breaking but low-risk inside this repository because the only active application consumer is the root layout and the only other active consumers are the old stories/test setup. Archived OpenSpec artifacts are historical records and are excluded from the cleanup audit.

Alternative considered: leave a temporary `@repo/core/sonner` re-export. Rejected because the user explicitly requested removal and no active application call sites need a staged transition.

### 3. Adopt Attachment as source-owned shadcn composition

Create `packages/core/attachment/attachment.tsx`, a barrel, a component test, and stories based on the live `@shadcn/attachment` `base-vega` registry item. Keep the documented public parts and CVA variants. `AttachmentTrigger` will use Base UI `useRender` plus `mergeProps`, default to a non-submitting button, and allow `render` composition without an extra wrapper. `AttachmentAction` will reuse the existing `Button` and its `icon-xs` size.

The implementation will retain `data-slot`, `data-state`, `data-size`, and `data-orientation` attributes so styling, tests, and consumer extensions share a stable surface. Stories will show file and image media, lifecycle states, sizes, orientations, actions, triggers, and a grouped overflow row. Error stories will include textual failure detail, and all icon-only actions/triggers will have accessible names.

The registry relies on `shimmer`, `scroll-fade-x`, and hidden-scrollbar utilities. The live Attachment registry snapshot currently emits `scrollbar-none`, while `shadcn@4.16.1/tailwind.css` actually exports `no-scrollbar`; the local adaptation will use the available official `no-scrollbar` utility and retain the rest of the registry classes. Add the exact current `shadcn` release as a root development dependency and import `shadcn/tailwind.css` from the existing global Tailwind entrypoint, following the documented shadcn installation model. This avoids inventing partial local copies and keeps the shared utilities updateable; the CSS is compiled during the build and is not a runtime server dependency.

Alternative considered: hand-copy only three utility definitions. Rejected because that would fork shared upstream behavior and omit related fixes. Running `shadcn eject` was also rejected because it would inline a much larger stylesheet into an already customized global file and is documented as irreversible.

### 4. Keep Maskito dependencies with the core form owner

Add exact compatible releases of `@maskito/core`, `@maskito/react`, `@maskito/kit`, `@maskito/phone`, and `libphonenumber-js` to `@repo/core` runtime dependencies. At planning time the current mutually aligned Maskito release is `5.3.1`, and the current phone metadata package release is `1.13.10`; implementation will re-check these exact versions before changing the lockfile.

`@maskito/react` supplies `useMaskito`, `@maskito/kit` supplies the date preset, and `@maskito/phone` supplies the phone generator. `PhoneField` will statically import the `libphonenumber-js/min/metadata` set, which Maskito documents as the smallest all-country option. Consumers may override metadata through the typed phone configuration when stronger validation data is required.

Alternative considered: place Maskito dependencies at the root only. Rejected because `packages/core` owns every runtime import and must declare its direct dependencies. A hand-written regular-expression mask was rejected because it would not preserve paste, deletion, autofill, mobile keyboard, and international phone behavior supplied by Maskito.

### 5. Add two focused string-valued TanStack Form adapters

Create colocated `date-field` and `phone-field` folders under `packages/core/form/fields`, export their component prop/configuration types, and register both in the existing `fieldComponents` object.

Both controls will:

- reuse `FieldShell`, `fieldValueAsString`, and `handleFieldBlur`;
- render the existing core `Input` and attach the callback ref returned by `useMaskito`;
- own `name`, `value`, `defaultValue`, `onChange`, and `onInput` so there is one source of truth;
- update TanStack Form from native `onInput`, following Maskito's documented controlled-input guidance;
- keep consumer `onBlur` behavior composed before `field.handleBlur()`;
- expose disabled and validation metadata through the shared shell;
- memoize generated Maskito options from named configuration values rather than creating inline options inside `useMaskito`.

`DateField` defaults to Maskito's day-month-year mode with `.` separators and exposes a typed `dateOptions` override for supported format/locale, min, and max behavior. It renders a text input with numeric input mode rather than native `type="date"`, because the native control would own formatting and conflict with the requested mask.

`PhoneField` defaults to strict `RU` international formatting with minimum metadata and exposes typed `phoneOptions` overrides for country, strictness, separator, format, and metadata. It renders `type="tel"` and defaults to telephone autocomplete/input mode. It does not claim the masked string is valid; consumers continue to express validation through TanStack/Zod.

Alternative considered: store `Date` and E.164 values inside form state with implicit parsing. Rejected because Maskito's element value remains a string, incomplete intermediate input cannot always be represented canonically, and hidden conversion would make controlled updates surprising. A generic `MaskedField` plus presets was rejected for now because it adds an abstraction before a third masked control exists.

### 6. Define behavior through browser tests before implementation

Use the repository's real Chromium Vitest project and `vitest-browser-react`; do not reintroduce a toast mock. Add failing component tests first, then the minimum implementation:

- Toast: global manager rendering, title/description/status, action, close, update, and promise transitions with isolated managers per test.
- Attachment: slots/data attributes, state/size/orientation changes, default button type, custom `render`, action independence, and accessible names.
- Masked fields: typing/paste formatting, form value updates, external controlled updates, blur/touched/validation metadata, disabled state, default Russian formats, and one configuration override for each field.

Stories complement tests rather than replace them. Each new top-level component gets colocated stories with realistic content and interactive controls; the form story may also be extended so the complete registered field set is visible together.

Alternative considered: snapshots or unit tests of third-party internals. Rejected because the owned contracts are browser event ordering, accessible composition, and form integration.

## Risks / Trade-offs

- **The live shadcn registry and its older Toast docs disagree** → Use Base UI's primary API as the behavioral source, record the discrepancy, and pin implementation to the registry output inspected during this change.
- **Global toast manager state can leak between browser tests** → Create isolated managers for component tests and explicitly close/settle notifications during cleanup.
- **Maskito can recreate its controller when option objects change identity** → Build options with `useMemo`, use module-level defaults/metadata, and document typed configuration props.
- **React controlled updates can race a masking library using synthetic `onChange`** → Follow Maskito's explicit recommendation to use native `onInput` and verify typing, paste, and external updates in Chromium.
- **Masked strings may be incomplete or unsuitable for API payloads** → Keep validation and canonical conversion explicit at the consumer/schema boundary; do not imply mask completion equals validity.
- **Minimum phone metadata performs lighter validation than max metadata** → Use it only for formatting by default and allow metadata override; do not bundle validation policy into the field.
- **Adding `shadcn/tailwind.css` expands the build-time CSS dependency surface** → Pin it exactly, keep it as a root development dependency, and verify production build output and relevant utilities.
- **Removing `@repo/core/sonner` breaks external consumers** → Treat the removal as an explicit breaking change and document the manager-call migration; no in-repo consumer requires dual support.

## Migration Plan

1. Re-check and install the exact Maskito, libphonenumber, and shadcn versions; remove Sonner and update `package-lock.json` once.
2. Write failing Toast browser tests, add the Base UI toast module/stories, switch the root layout, and remove Sonner-specific test infrastructure.
3. Write failing Attachment browser tests, add the registry-adapted component/stories, and enable the official shared Tailwind utilities.
4. Write failing DateField/PhoneField browser tests, implement the adapters, register/export them, and add their stories plus the full form showcase states.
5. Update active documentation and audit non-archived source/manifests/configuration for Sonner and missing new exports.
6. Run focused RED/GREEN tests throughout, then formatting, the full Vitest suite, type checking, lint, dependency analysis, Storybook/build checks, and strict OpenSpec validation.

Rollback consists of reverting the dependency, component, layout, configuration, documentation, and lockfile edits together. There is no persisted data or server contract migration.

## Open Questions

None. The masked-string contract, Russian defaults with configurable options, official shadcn registry, complete Sonner removal, and tests/stories requirement were approved before artifact creation.
