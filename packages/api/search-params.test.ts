import { describe, expect, it } from 'vitest'

import { serializeSearchParams } from './search-params'

describe('serializeSearchParams', () => {
    it('serializes arrays as repeated query params', () => {
        expect(
            serializeSearchParams({
                status: ['available', 'pending'],
                tags: ['friendly', 'trained'],
                empty: [],
            }),
        ).toBe('status=available&status=pending&tags=friendly&tags=trained')
    })

    it('skips undefined and serializes null as a null string', () => {
        expect(
            serializeSearchParams({
                deleted: undefined,
                owner: null,
                page: 2,
                active: false,
            }),
        ).toBe('owner=null&page=2&active=false')
    })
})
