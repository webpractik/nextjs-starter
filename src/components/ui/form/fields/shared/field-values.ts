export function fieldValueAsString(value: unknown) {
    if (value === null || value === undefined) {
        return ''
    }

    if (typeof value === 'string' || typeof value === 'number') {
        return String(value)
    }

    return ''
}

export function defaultNumberFormat(value: unknown) {
    if (typeof value === 'number' && Number.isNaN(value)) {
        return ''
    }

    return fieldValueAsString(value)
}

export const defaultNumberParse: (_value: string) => number = Number

export function asSliderValue(value: unknown): number | readonly number[] {
    if (typeof value === 'number') {
        return value
    }

    if (Array.isArray(value) && value.every((item) => typeof item === 'number')) {
        return value
    }

    return 0
}

export function defaultSliderValueLabel(value: number | readonly number[]) {
    return Array.isArray(value) ? value.join(' - ') : String(value)
}
