import { describe, expect, it } from 'vitest'

import { canAccessCacheProbe, isValidProbeKey } from './access'

const validAccess = {
    enabled: true,
    isCi: true,
    appEnvironment: 'LOCAL',
    configuredToken: 'a-secure-cache-probe-token-0000001',
    suppliedToken: 'a-secure-cache-probe-token-0000001',
}

describe('cache probe access', () => {
    it('requires every environment and token gate', () => {
        expect(canAccessCacheProbe(validAccess)).toBe(true)
        expect(canAccessCacheProbe({ ...validAccess, enabled: false })).toBe(false)
        expect(canAccessCacheProbe({ ...validAccess, isCi: false })).toBe(false)
        expect(canAccessCacheProbe({ ...validAccess, appEnvironment: 'PROD' })).toBe(false)
        expect(canAccessCacheProbe({ ...validAccess, suppliedToken: 'wrong' })).toBe(false)
        expect(canAccessCacheProbe({ ...validAccess, suppliedToken: null })).toBe(false)
    })

    it.each([
        ['abcdefghijklmnop', true],
        ['probe_key-1234567890', true],
        ['short', false],
        ['contains spaces 1234', false],
        ['x'.repeat(65), false],
    ])('validates the bounded probe key %s', (key, expected) => {
        expect(isValidProbeKey(key)).toBe(expected)
    })
})
