import { z } from 'zod'

const bffPathPattern = /^\/[\w.~-]+(?:\/[\w.~-]+)*$/iu

export const bffPathSchema = z.string().regex(bffPathPattern, {
    error: 'BFF path must start with `/` and must not contain a trailing slash, query, or fragment',
})

export const apiBaseUrlSchema = z
    .url()
    .refine((value) => !value.endsWith('/') && !value.includes('?') && !value.includes('#'), {
        error: 'API base URL must not contain a trailing slash, query, or fragment',
    })
