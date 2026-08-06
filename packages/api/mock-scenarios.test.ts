import { describe, expect, it } from 'vitest'

import { isBaseMockScenarioName } from './mock-scenarios'

describe('имена мок-сценариев', () => {
    it('принимает только явно настроенные имена сценариев', () => {
        expect(isBaseMockScenarioName('default')).toBe(true)
        expect(isBaseMockScenarioName('toString')).toBe(false)
        expect(isBaseMockScenarioName(undefined)).toBe(false)
    })
})
