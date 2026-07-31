## 1. Dependency and Source Baseline

- [ ] 1.1 Re-check the current compatible exact releases and peer requirements for `@maskito/core`, `@maskito/react`, `@maskito/kit`, `@maskito/phone`, `libphonenumber-js`, and `shadcn`, then add them to the owning workspace/root manifests and update `package-lock.json` with npm.
- [ ] 1.2 Re-run the current shadcn registry views for `@shadcn/toast` and `@shadcn/attachment`, compare them with the design snapshots, and record any behavior-affecting upstream difference before implementation.
- [ ] 1.3 Import `shadcn/tailwind.css` from the existing global Tailwind entrypoint and prove that the required `shimmer`, `scroll-fade-x`, and hidden-scrollbar utilities compile without replacing the project's theme.

## 2. Base UI Toast Migration

- [ ] 2.1 Add a failing real-browser component test for an isolated Base UI toast manager covering add/render, title and description, supported status icon, update-in-place, action, close, and promise settlement.
- [ ] 2.2 Implement and export `packages/core/toast` with the global manager, `Toaster`, composable provider/portal/viewport/root/content/title/description/action/close parts, status icons, and Base UI prop forwarding, then make the focused test pass.
- [ ] 2.3 Add colocated Toast stories for default and status notifications, description, action, promise lifecycle, persistent timeout, and stacking using the new manager API.
- [ ] 2.4 Switch `app/layout.tsx` to `@repo/core/toast`, remove `packages/core/sonner`, the Sonner test mock/setup/aliases/optimizer entries, and the `sonner` dependency, then verify no active application or test path imports it.

## 3. Attachment Component

- [ ] 3.1 Add a failing real-browser Attachment component test covering public slots, file/image media, lifecycle/state/size/orientation data attributes, default trigger button type, custom `render` composition, independent accessible actions, and grouped overflow semantics.
- [ ] 3.2 Implement and export `packages/core/attachment` from the current Base Vega registry source, adapted to the local `cn`, `Button`, Lucide, Base UI `useRender`, and strict TypeScript conventions, then make the focused test pass.
- [ ] 3.3 Add colocated Attachment stories for file and image previews, all lifecycle states, sizes, orientations, accessible actions/triggers, and a horizontally overflowing group with realistic metadata and textual error detail.

## 4. Masked TanStack Form Fields

- [ ] 4.1 Add failing real-browser tests for `DateField` covering default `DD.MM.YYYY` typing/paste formatting, masked-string form state, external controlled updates, configured date constraints/locale behavior, blur callback ordering, validation associations, and disabled metadata.
- [ ] 4.2 Implement and export `DateField` with `@maskito/react`, the current `@maskito/kit` date preset, native `onInput`, memoized typed `dateOptions`, shared field shell behavior, and numeric text-input defaults, then make its focused tests pass.
- [ ] 4.3 Add failing real-browser tests for `PhoneField` covering strict Russian international formatting, masked-string form state, external controlled updates, alternate country/format configuration, blur/touched behavior, validation associations, and disabled metadata.
- [ ] 4.4 Implement and export `PhoneField` with `@maskito/react`, `@maskito/phone`, statically imported minimum metadata, native `onInput`, memoized typed `phoneOptions`, shared field shell behavior, and telephone input defaults, then make its focused tests pass.
- [ ] 4.5 Register both masked fields in the existing `createFormHook` factory and extend the public form integration test to prove `field.DateField`/`field.PhoneField`, inferred form values, validation, and submission through `useAppForm`.
- [ ] 4.6 Add colocated DateField and PhoneField stories for default, configured, validation, and disabled states, and extend the complete Form showcase with both registered controls.

## 5. Documentation and Contract Audit

- [ ] 5.1 Update active architecture/usage documentation to describe Base UI Toast manager calls, Attachment composition, masked-string DateField/PhoneField values, Russian defaults, and explicit consumer-side canonical conversion/validation.
- [ ] 5.2 Audit non-archived source, stories, tests, manifests, lockfile, and configuration for `sonner`, `@repo/core/sonner`, missing Toast/Attachment exports, and missing DateField/PhoneField registration; remove only stale references in scope.
- [ ] 5.3 Review all new icon-only controls, labels, descriptions, errors, disabled states, status cues, and trigger composition against the component accessibility requirements.

## 6. Final Verification

- [ ] 6.1 Format only changed files with Oxfmt, run the focused Toast, Attachment, and masked-field browser tests, then run `npm run test:unit` and `npm run test:component` without skipped tests.
- [ ] 6.2 Run `npm run tsc`, `npm run lint`, and `npm run knip`, resolving regressions introduced by this change and separately identifying any unchanged baseline findings.
- [ ] 6.3 Run `npm run build-storybook` and `npm run build`, verify the production output has no reachable Sonner module, and report any environment-only blocker with its exact failing stage.
- [ ] 6.4 Review the final diff for unrelated edits and accidental generated artifacts, confirm every spec scenario is implemented or tested, and run `openspec validate adopt-base-ui-toast-and-masked-fields --type change --strict --no-interactive`.
