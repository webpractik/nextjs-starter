## ADDED Requirements

### Requirement: Masked fields participate in the application form factory

The core form package SHALL register and export `DateField` and `PhoneField` through the same TanStack `createFormHook` factory as the existing field controls.

#### Scenario: Consumer uses registered masked fields

- **WHEN** a consumer renders `field.DateField` or `field.PhoneField` inside `form.AppField`
- **THEN** the control reads and updates the corresponding TanStack Form field without requiring manual context wiring

#### Scenario: Consumer imports field types directly

- **WHEN** a consumer imports the masked fields or their public prop types from `@repo/core/form`
- **THEN** all supported exports resolve without a deep import

### Requirement: Masked values remain controlled strings

Both masked fields SHALL store their displayed Maskito-formatted value as the TanStack Form string value, SHALL normalize nullish or unsupported external values to an empty display value, and SHALL use the native input event for controlled updates.

#### Scenario: User edits a masked value

- **WHEN** the user types or pastes input into a masked field
- **THEN** Maskito formats the text and the resulting displayed string becomes the field value

#### Scenario: Form state changes externally

- **WHEN** application code replaces a masked field's value with another string
- **THEN** the input reflects the external value while remaining controlled

#### Scenario: Field loses focus

- **WHEN** the control blurs
- **THEN** any consumer blur callback runs and TanStack Form touched/validation metadata is updated

### Requirement: Localized date masking

`DateField` SHALL default to a Russian day-month-year presentation (`DD.MM.YYYY`) and SHALL expose the supported Maskito date parameters needed to change locale/format, separator, and minimum or maximum date.

#### Scenario: Russian date is entered

- **WHEN** the user enters digits representing 31 December 2026 with default configuration
- **THEN** the control displays and stores `31.12.2026`

#### Scenario: Date constraints are configured

- **WHEN** a consumer supplies supported minimum, maximum, or locale-specific date parameters
- **THEN** `DateField` creates its Maskito options from those parameters and enforces the resulting input mask

### Requirement: Configurable phone masking

`PhoneField` SHALL default to a strict Russian international phone format using the minimum libphonenumber metadata set and SHALL expose supported country, strictness, separator, and international/national format parameters.

#### Scenario: Russian phone is entered

- **WHEN** the user enters a Russian phone number with default configuration
- **THEN** the control displays and stores the Maskito international formatted string

#### Scenario: Phone country configuration changes

- **WHEN** a consumer supplies another country ISO code or switches strict/format behavior
- **THEN** `PhoneField` creates its phone mask from that configuration without changing the field integration contract

### Requirement: Accessible field feedback

Both masked controls SHALL reuse the shared form field shell so labels, descriptions, validation errors, invalid state, disabled state, dirty state, and touched state remain accessible and consistent with existing fields.

#### Scenario: Masked field validation fails

- **WHEN** TanStack Form reports a validation error for a touched masked field
- **THEN** the input is marked invalid and is associated with the rendered alert text

#### Scenario: Masked field is disabled

- **WHEN** a consumer disables a masked field
- **THEN** both the native control and its field container expose the disabled state
