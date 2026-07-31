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
    if (value === null || value === undefined) {
        return ''
    }

    if (typeof value === 'number' && Number.isNaN(value)) {
        return ''
    }

    return String(value)
}

export function defaultNumberParse(value: string) {
    return Number(value)
}

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
