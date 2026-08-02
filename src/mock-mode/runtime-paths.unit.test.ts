import { afterEach, describe, expect, it, vi } from 'vitest'

const configuredPagePaths = ['/catalog', /^\/preview(?:\/|$)/]
const configuredExcludedPagePaths = ['/catalog/private']

async function loadConfiguredRuntime() {
    vi.doMock('./config', () => ({
        mockModeExcludedPagePaths: configuredExcludedPagePaths,
        mockModePagePaths: configuredPagePaths,
    }))

    return import('./runtime')
}

afterEach(() => {
    vi.doUnmock('./config')
    vi.resetModules()
})

describe('активация мок-режима по настроенным путям', () => {
    it('включает мок-режим для точного строкового пути и его вложенных страниц', async () => {
        const { isMockModePagePath } = await loadConfiguredRuntime()

        expect(isMockModePagePath('/catalog')).toBe(true)
        expect(isMockModePagePath('/catalog/')).toBe(true)
        expect(isMockModePagePath('/catalog/pets/42')).toBe(true)
        expect(isMockModePagePath('/catalogue')).toBe(false)
    })

    it('отключает мок-режим для исключённого пути и всех его вложенных страниц', async () => {
        const { isMockModePagePath } = await loadConfiguredRuntime()

        expect(isMockModePagePath('/catalog/private')).toBe(false)
        expect(isMockModePagePath('/catalog/private/pet/42')).toBe(false)
    })

    it('включает мок-режим по регулярному выражению и URL из служебного заголовка', async () => {
        const { isMockModePagePath, isRequestMockModeEnabled } = await loadConfiguredRuntime()

        expect(isMockModePagePath('/preview/pet/42')).toBe(true)
        expect(
            isRequestMockModeEnabled({
                'x-url': 'https://frontend.example.test/preview/pet/42?mode=compact',
            }),
        ).toBe(true)
    })
})
