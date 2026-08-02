import { afterEach, describe, expect, it } from 'vitest'

import { getBrowserMockScenario, isBrowserRuntimeMockModeEnabled } from './runtime'

function clearMockCookies() {
    document.cookie = 'mock-mode=; Path=/; Max-Age=0; SameSite=Lax'
    document.cookie = 'mock-scenario=; Path=/; Max-Age=0; SameSite=Lax'
}

afterEach(() => {
    clearMockCookies()
})

describe('браузерный runtime-режим моков', () => {
    it('включается по cookie mock-mode и читает выбранный сценарий', () => {
        document.cookie = 'mock-mode=true; Path=/; SameSite=Lax'
        document.cookie = 'mock-scenario=default; Path=/; SameSite=Lax'

        expect(isBrowserRuntimeMockModeEnabled()).toBe(true)
        expect(getBrowserMockScenario()).toBe('default')
    })
})
