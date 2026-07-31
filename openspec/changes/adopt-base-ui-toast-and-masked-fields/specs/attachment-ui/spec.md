## ADDED Requirements

### Requirement: Composable attachment anatomy

The core package SHALL expose `Attachment`, `AttachmentMedia`, `AttachmentContent`, `AttachmentTitle`, `AttachmentDescription`, `AttachmentActions`, `AttachmentAction`, `AttachmentTrigger`, and `AttachmentGroup` from `@repo/core/attachment`.

#### Scenario: File attachment composition

- **WHEN** a consumer composes an attachment with icon media, title, description, and actions
- **THEN** each part renders in its documented slot and the attachment remains constrained to its available width

#### Scenario: Image attachment composition

- **WHEN** `AttachmentMedia` uses the image variant with an image child
- **THEN** the preview fills the media surface and reflects the attachment lifecycle styling

### Requirement: Attachment variants and lifecycle state

The attachment root SHALL support `idle`, `uploading`, `processing`, `error`, and `done` states, `default`, `sm`, and `xs` sizes, and horizontal and vertical orientations through explicit data attributes and documented variants.

#### Scenario: In-progress attachment

- **WHEN** an attachment is uploading or processing
- **THEN** its title uses the shared shimmer utility to communicate activity

#### Scenario: Failed attachment

- **WHEN** an attachment is in the error state
- **THEN** its error treatment is visible and the consumer can provide a textual failure reason in the description

#### Scenario: Attachment layout variants

- **WHEN** a consumer changes size or orientation
- **THEN** media, content, and actions adopt the corresponding documented layout without changing the component anatomy

### Requirement: Attachment actions and trigger

Attachment actions SHALL remain separately interactive above an optional full-card trigger, and icon-only actions or triggers MUST have an accessible name supplied by the consumer.

#### Scenario: Full-card trigger uses its default element

- **WHEN** `AttachmentTrigger` is rendered without a custom `render` element
- **THEN** it renders a non-submitting button overlay while attachment actions remain independently clickable

#### Scenario: Full-card trigger uses custom composition

- **WHEN** a consumer supplies Base UI-style `render` composition to `AttachmentTrigger`
- **THEN** the custom element receives the trigger behavior and merged props without an extra wrapper

### Requirement: Grouped attachment navigation

`AttachmentGroup` SHALL lay out multiple attachments in a horizontally scrollable, snap-aligned row with hidden scrollbars and scroll-edge affordances.

#### Scenario: Multiple attachments overflow

- **WHEN** attachments exceed the group's available width
- **THEN** the user can scroll horizontally through snap-aligned attachments with keyboard and pointer-compatible browser behavior
