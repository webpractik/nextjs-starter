import { describe, expect, it } from 'vitest'

import { apiBaseUrlSchema, bffPathSchema } from './schemas'

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
