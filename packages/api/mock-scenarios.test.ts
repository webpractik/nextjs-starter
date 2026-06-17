import { describe, expect, it } from 'vitest'

import { isBaseMockScenarioName } from './mock-scenarios'

describe('mock scenarios', () => {
    it('accepts only explicitly configured scenario names', () => {
        expect(isBaseMockScenarioName('default')).toBe(true)
        expect(isBaseMockScenarioName('toString')).toBe(false)
        expect(isBaseMockScenarioName(undefined)).toBe(false)
    })
})
