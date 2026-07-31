import type { AnyFieldApi } from '@tanstack/react-form'

export function handleFieldBlur<TEvent>(
    field: AnyFieldApi,
    onBlur: ((_event: TEvent) => void) | undefined,
    event: TEvent,
) {
    onBlur?.(event)
    field.handleBlur()
}
