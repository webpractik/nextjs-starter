## ADDED Requirements

### Requirement: Typed application form composition

The system SHALL expose a single TanStack Form composition layer from `@repo/core/form`, created with `createFormHookContexts` and `createFormHook`. The public API SHALL include `useAppForm`, `extendForm`, `withForm`, `withFieldGroup`, `useTypedAppFormContext`, `fieldContext`, `formContext`, `useFieldContext`, `useFormContext`, and `formOptions`.

#### Scenario: Consumer creates a typed form

- **WHEN** a consumer calls `useAppForm` with typed default values and a submit handler
- **THEN** the returned form exposes `AppField`, `AppForm`, the registered field components, and the registered form components while preserving the inferred form value type

#### Scenario: Consumer composes a reusable form section

- **WHEN** a consumer imports `withForm`, `withFieldGroup`, or `extendForm` from `@repo/core/form`
- **THEN** the consumer can compose or extend the shared form layer without creating a second incompatible context

### Requirement: Form-bound field component set

The system SHALL provide `TextField`, `NumberField`, `TextareaField`, `CheckboxField`, `SwitchField`, `SelectField`, `RadioGroupField`, and `SliderField` as field-context-bound components. Each component SHALL render the matching `@repo/core` UI control as a controlled input and SHALL update the current TanStack field value through the control's native value event.

#### Scenario: Textual values update form state

- **WHEN** a user edits a text input or textarea rendered through its form-bound component
- **THEN** the corresponding TanStack field value contains the current string and the rendered control reflects external form state changes

#### Scenario: Number values are normalized

- **WHEN** a user edits a number field
- **THEN** non-empty input is parsed to a number by default, empty input uses the configured `emptyValue`, and custom `parse` and `format` functions are honored

#### Scenario: Choice controls update form state

- **WHEN** a user changes a checkbox, switch, select, or radio-group field
- **THEN** the corresponding boolean or option value is stored in the TanStack field and the UI reflects that value

#### Scenario: Slider supports scalar and range values

- **WHEN** a form field contains a numeric scalar or numeric range and is rendered with `SliderField`
- **THEN** the slider renders the matching thumb state, updates the field on value changes, and can render a configurable value label

### Requirement: Field metadata, feedback, and accessibility

Every form-bound field SHALL render a label, optional description, and normalized validation feedback through the existing `@repo/core/field` primitives. It SHALL expose invalid, touched, and dirty metadata as field state, preserve supported consumer blur/commit callbacks, and maintain accessible relationships between labels, controls, descriptions, and errors.

#### Scenario: Validation errors are displayed

- **WHEN** a field contains string, `Error`, message-object, primitive, or nested-array validation errors
- **THEN** all non-empty user-facing messages are normalized and rendered in an alert associated with the invalid control

#### Scenario: Blur metadata is preserved

- **WHEN** a user blurs a text, number, textarea, checkbox, or switch control
- **THEN** any consumer-provided blur handler runs and the TanStack field is marked as touched

#### Scenario: Composite control commits interaction

- **WHEN** a select closes, a radio option is chosen, or a slider value is committed
- **THEN** the TanStack field is marked as touched without discarding the corresponding consumer callback

### Requirement: Form-aware submit button

The system SHALL provide a `SubmitButton` form component that always submits the nearest `AppForm`, subscribes only to `canSubmit` and `isSubmitting`, defaults to disabling until the form can submit, and remains disabled during submission or when explicitly disabled by the consumer.

#### Scenario: Invalid form cannot submit by default

- **WHEN** `canSubmit` is false and `disableUntilValid` is not overridden
- **THEN** `SubmitButton` is disabled and has HTML type `submit`

#### Scenario: Submission is in progress

- **WHEN** `isSubmitting` is true
- **THEN** `SubmitButton` remains disabled regardless of `disableUntilValid`

#### Scenario: Consumer allows pre-validation submission

- **WHEN** `disableUntilValid` is false, `isSubmitting` is false, and the consumer has not set `disabled`
- **THEN** `SubmitButton` is enabled even if `canSubmit` is false

### Requirement: Native Standard Schema validation

The form layer SHALL accept Zod and other Standard Schema validators directly through TanStack Form and SHALL NOT require a resolver adapter.

#### Scenario: Zod validator rejects a value

- **WHEN** a consumer supplies a Zod schema to a TanStack form or field validator and the current value violates that schema
- **THEN** TanStack Form propagates the validation issue to the affected field feedback and submission state without `@hookform/resolvers`

### Requirement: Development-only form devtools

The application SHALL register `formDevtoolsPlugin()` with a `TanStackDevtools` host during development. The devtools implementation SHALL live behind a client-only development boundary and SHALL NOT be statically imported or rendered by the production application path.

#### Scenario: Developer inspects a form

- **WHEN** the application runs in development and a TanStack form is mounted
- **THEN** the TanStack Devtools UI includes the Form plugin and can inspect the form instance and its fields

#### Scenario: Production build excludes devtools entry imports

- **WHEN** the application is built for production
- **THEN** the production root path contains no static import of `@tanstack/react-devtools` or `@tanstack/react-form-devtools` and does not render the devtools host

### Requirement: Legacy React Hook Form removal

The root application and `@repo/core` manifests SHALL remove `react-hook-form` and `@hookform/resolvers`, and `@repo/core/form` SHALL NOT export the legacy `FormProvider`, `Controller`, `FormField`, `FormItem`, `FormControl`, or `useFormField` API.

#### Scenario: Dependency and source audit

- **WHEN** the migration is complete
- **THEN** dependency manifests and non-archived application source contain no React Hook Form or resolver imports, while the TanStack form and devtools packages are declared in the appropriate runtime or development dependency scope

#### Scenario: Consumer adopts the replacement API

- **WHEN** a consumer migrates a legacy form
- **THEN** it uses `useAppForm`, `form.AppField`, the registered bound fields, and `form.AppForm` instead of the removed React Hook Form helpers
