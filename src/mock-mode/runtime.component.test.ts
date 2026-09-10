import { afterEach, describe, expect, it } from 'vitest'

import { getBrowserMockScenario, isBrowserRuntimeMockModeEnabled } from './runtime'

async function clearMockCookies() {
    await cookieStore.delete({ name: 'mock-mode', path: '/' })
    await cookieStore.delete({ name: 'mock-scenario', path: '/' })
}

afterEach(async () => {
    await clearMockCookies()
})

describe('браузерный runtime-режим моков', () => {
    it('включается по cookie mock-mode и читает выбранный сценарий', async () => {
        await cookieStore.set({ name: 'mock-mode', path: '/', sameSite: 'lax', value: 'true' })
        await cookieStore.set({
            name: 'mock-scenario',
            path: '/',
            sameSite: 'lax',
            value: 'default',
        })

        expect(isBrowserRuntimeMockModeEnabled()).toBe(true)
        expect(getBrowserMockScenario()).toBe('default')
    })
})
