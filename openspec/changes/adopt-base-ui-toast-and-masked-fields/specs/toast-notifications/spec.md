## ADDED Requirements

### Requirement: Base UI toast public API

The core package SHALL expose a Base UI-backed toast module at `@repo/core/toast` containing a shared global manager, `Toaster`, the composable toast parts, `createToastManager`, and `useToastManager`.

#### Scenario: Toast created outside the React tree

- **WHEN** application code calls `toast.add` with a title and description
- **THEN** the globally mounted `Toaster` renders that notification in its viewport

#### Scenario: Custom toast composition

- **WHEN** a consumer assembles the exported provider, portal, viewport, root, content, title, description, action, and close parts
- **THEN** the parts preserve the Base UI behavior and forward their supported props

### Requirement: Notification lifecycle and status

The toast API SHALL support add, update, close, and promise lifecycle operations and SHALL visually distinguish the `success`, `info`, `warning`, `error`, and `loading` status types without relying on color alone.

#### Scenario: Existing notification is updated

- **WHEN** application code updates a toast by its returned identifier
- **THEN** the rendered notification changes in place without creating a duplicate

#### Scenario: Promise notification settles

- **WHEN** a promise registered through `toast.promise` resolves or rejects
- **THEN** its loading notification transitions to the configured success or error content

#### Scenario: Status notification is rendered

- **WHEN** a notification has a supported status type
- **THEN** the notification includes the corresponding decorative status icon and readable title or description

### Requirement: Accessible interaction and stacking

The Toaster SHALL preserve Base UI's keyboard-focus, announcement, stacking, timeout, action, close, and swipe-dismiss semantics while providing an accessible label for icon-only dismissal.

#### Scenario: User dismisses a notification

- **WHEN** the user activates the close button or completes a supported swipe-dismiss gesture
- **THEN** the notification closes through the Base UI manager lifecycle

#### Scenario: User invokes a toast action

- **WHEN** the user activates the action rendered from `actionProps`
- **THEN** the configured callback runs while the action remains keyboard accessible

#### Scenario: Several notifications are queued

- **WHEN** more than one notification is active
- **THEN** they render as a managed stack inside one global viewport

### Requirement: Sonner removal

The application and core workspace MUST NOT retain runtime, test, or public-API dependencies on Sonner after the Base UI toast migration.

#### Scenario: Legacy dependency audit

- **WHEN** source, manifests, lockfile, and Vitest configuration are audited after migration
- **THEN** no active Sonner import, dependency, mock, alias, or optimize-dependency entry remains
