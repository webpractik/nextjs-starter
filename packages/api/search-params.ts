function appendSearchParam(searchParams: URLSearchParams, key: string, value: unknown) {
    if (value === undefined) {
        return
    }

    if (Array.isArray(value)) {
        for (const item of value) {
            appendSearchParam(searchParams, key, item)
        }

        return
    }

    searchParams.append(key, value === null ? 'null' : String(value))
}

export function serializeSearchParams(params: object) {
    const searchParams = new URLSearchParams()

    for (const [key, value] of Object.entries(params as Record<string, unknown>)) {
        appendSearchParam(searchParams, key, value)
    }

    return searchParams.toString()
}
