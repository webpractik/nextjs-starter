import type { AnyFieldApi } from '@tanstack/react-form'

export function fieldErrorMessages(field: AnyFieldApi) {
    return field.state.meta.errors.flatMap(formatError)
}

function formatError(error: unknown): string[] {
    if (error === null || error === undefined || error === '') {
        return []
    }

    if (Array.isArray(error)) {
        return error.flatMap(formatError)
    }

    if (typeof error === 'string') {
        return [error]
    }

    if (typeof error === 'number' || typeof error === 'boolean') {
        return [String(error)]
    }

    if (error instanceof Error) {
        return error.message ? [error.message] : []
    }

    if (typeof error === 'object' && 'message' in error) {
        const message = error.message

        if (typeof message === 'string' && message) {
            return [message]
        }
    }

    return []
}
