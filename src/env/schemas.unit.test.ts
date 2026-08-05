import { describe, expect, it } from 'vitest'

import { apiBaseUrlSchema, bffPathSchema, cacheNamespaceSchema, valkeyUrlSchema } from './schemas'

describe('контракты URL переменных окружения', () => {
    it.each(['http://localhost:8080', 'https://backend.example.test/api'])(
        'принимает базовый URL API %s без завершающего слеша, query и hash',
        (value) => {
            expect(apiBaseUrlSchema.safeParse(value).success).toBe(true)
        },
    )

    it.each([
        'http://localhost:8080/',
        'https://backend.example.test/api/',
        'https://backend.example.test?tenant=demo',
        'https://backend.example.test?',
        'https://backend.example.test#api',
        'https://backend.example.test#',
    ])('отклоняет неоднозначный базовый URL API %s', (value) => {
        expect(apiBaseUrlSchema.safeParse(value).success).toBe(false)
    })

    it.each(['/bff-api', '/api/v1'])('принимает абсолютный BFF-путь %s', (value) => {
        expect(bffPathSchema.safeParse(value).success).toBe(true)
    })

    it.each(['bff-api', '/', '//bff-api', '/bff-api/', '/bff-api?tenant=demo'])(
        'отклоняет неоднозначный BFF-путь %s',
        (value) => {
            expect(bffPathSchema.safeParse(value).success).toBe(false)
        },
    )
})

describe('контракты Valkey cache', () => {
    it.each(['redis://localhost:6379', 'rediss://cache.example.test:6380/2'])(
        'принимает Valkey URL %s',
        (value) => {
            expect(valkeyUrlSchema.safeParse(value).success).toBe(true)
        },
    )

    it.each(['http://localhost:6379', 'valkey://localhost:6379', 'not-a-url'])(
        'отклоняет Valkey URL %s',
        (value) => {
            expect(valkeyUrlSchema.safeParse(value).success).toBe(false)
        },
    )

    it.each(['nextjs-starter:local:v1', 'release_2026.08.02-v1'])(
        'принимает namespace %s',
        (value) => {
            expect(cacheNamespaceSchema.safeParse(value).success).toBe(true)
        },
    )

    it.each(['', 'contains spaces', 'contains/slash', 'x'.repeat(101)])(
        'отклоняет namespace %s',
        (value) => {
            expect(cacheNamespaceSchema.safeParse(value).success).toBe(false)
        },
    )
})
