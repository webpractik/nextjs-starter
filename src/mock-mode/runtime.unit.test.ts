import { describe, expect, it } from 'vitest'

import { getRequestMockScenario, isMockModePagePath, isRequestMockModeEnabled } from './runtime'

describe('mock-mode runtime', () => {
    it('keeps page-path mock mode disabled by default', () => {
        expect(isMockModePagePath(null)).toBe(false)
        expect(isMockModePagePath('')).toBe(false)
        expect(isMockModePagePath('/')).toBe(false)
        expect(isMockModePagePath('/catalog')).toBe(false)
    })

    it('enables mock mode from a mock-mode cookie', () => {
        expect(isRequestMockModeEnabled({ cookie: 'session=real; mock-mode=true' })).toBe(true)
    })

    it('reads scenario only from the mock-scenario cookie', () => {
        expect(
            getRequestMockScenario({
                cookie: 'mock-mode=true; mock-scenario=default',
                'x-url': 'http://localhost:3000/catalog?mock-scenario=ignored',
            }),
        ).toBe('default')

        expect(
            getRequestMockScenario({
                'x-url': 'http://localhost:3000/catalog?mock-scenario=default',
            }),
        ).toBeNull()
    })
})
