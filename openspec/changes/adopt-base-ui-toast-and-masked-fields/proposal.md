## Why

The core package still relies on Sonner even though the repository's UI foundation is Base UI, and it lacks reusable attachment and masked date/phone controls. Aligning feedback, file presentation, and common formatted inputs with the current Base UI/shadcn stack gives application code one consistent, accessible component API.

## What Changes

- **BREAKING**: Replace `@repo/core/sonner` with a Base UI-backed `@repo/core/toast` API and remove the Sonner dependency, test mock, Vitest aliases, and legacy exports without a compatibility shim.
- Add a composable `Attachment` component family with upload/processing/error/done states, supported sizes and orientations, grouped scrolling, accessible actions, and the required official shadcn Tailwind utilities.
- Add TanStack Form-bound `DateField` and `PhoneField` controls implemented with `@maskito/react`, storing their displayed masked values as strings and exposing focused configuration for date locale/range and phone-country behavior.
- Register and export both masked fields through the existing `useAppForm` field factory.
- Add colocated Storybook stories and real-browser component tests for Toast, Attachment, DateField, and PhoneField, including accessibility and controlled-state behavior.

## Capabilities

### New Capabilities

- `toast-notifications`: Base UI toast management, rendering, status, action, dismissal, and global application mounting.
- `attachment-ui`: Composable attachment presentation for files and images across lifecycle states and grouped layouts.
- `masked-form-fields`: TanStack Form-bound date and phone inputs using Maskito with controlled masked-string values and accessible field feedback.

### Modified Capabilities

None.

## Impact

- Affected code: `packages/core/toast`, `packages/core/attachment`, `packages/core/form/fields`, form factory exports, root layout, global Tailwind CSS, Vitest configuration/setup, and component stories/tests.
- Removed code: `packages/core/sonner` and `src/tests/mocks/sonner.ts`.
- Dependencies: remove `sonner`; add exact compatible releases of `@maskito/core`, `@maskito/react`, `@maskito/kit`, `@maskito/phone`, and the phone metadata dependency required by the selected Maskito integration.
- Public API: toast consumers migrate from the callable Sonner API to `toast.add(...)` and related Base UI manager methods; form consumers gain `field.DateField` and `field.PhoneField`.
- Runtime: the application continues to mount one global `Toaster`, now backed by Base UI rather than Sonner.
