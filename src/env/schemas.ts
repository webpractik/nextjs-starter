import { z } from 'zod'

const bffPathPattern = /^\/[\w.~-]+(?:\/[\w.~-]+)*$/iu
const cacheNamespacePattern = /^[\w.:-]+$/u

export const bffPathSchema = z.string().regex(bffPathPattern, {
    error: 'BFF path must start with `/` and must not contain a trailing slash, query, or fragment',
})

export const apiBaseUrlSchema = z
    .url()
    .refine((value) => !value.endsWith('/') && !value.includes('?') && !value.includes('#'), {
        error: 'API base URL must not contain a trailing slash, query, or fragment',
    })

export const valkeyUrlSchema = z.url().refine((value) => {
    const protocol = URL.parse(value)?.protocol

    return protocol === 'redis:' || protocol === 'rediss:'
}, 'Valkey URL must use the redis: or rediss: protocol')

export const cacheNamespaceSchema = z
    .string()
    .min(1)
    .max(100)
    .regex(cacheNamespacePattern, 'Cache namespace contains unsupported characters')
