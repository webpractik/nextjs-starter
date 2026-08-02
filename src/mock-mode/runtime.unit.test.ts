import { afterEach, describe, expect, it, vi } from 'vitest'

import {
    getCookieValue,
    getHeaderValue,
    getPathnameFromUrl,
    getRequestMockScenario,
    isMockModePagePath,
    isRequestMockModeEnabled,
    isRuntimeMockFlagEnabled,
} from './runtime'

afterEach(() => {
    vi.unstubAllEnvs()
})

describe('runtime-режим моков', () => {
    it('не включает мок-режим по пути, пока список страниц пуст', () => {
        expect(isMockModePagePath(null)).toBe(false)
        expect(isMockModePagePath('')).toBe(false)
        expect(isMockModePagePath('/')).toBe(false)
        expect(isMockModePagePath('/catalog')).toBe(false)
    })

    it('включает мок-режим только для cookie mock-mode со значением true', () => {
        expect(isRequestMockModeEnabled({ cookie: 'session=real; mock-mode=true' })).toBe(true)
        expect(isRequestMockModeEnabled({ cookie: 'mock-mode=True' })).toBe(false)
        expect(isRequestMockModeEnabled({ cookie: 'mock-mode=1' })).toBe(false)
        expect(isRuntimeMockFlagEnabled('true')).toBe(true)
        expect(isRuntimeMockFlagEnabled('false')).toBe(false)
    })

    it('игнорирует runtime-cookie мок-режима в production', () => {
        vi.stubEnv('NODE_ENV', 'production')

        expect(isRequestMockModeEnabled({ cookie: 'mock-mode=true' })).toBe(false)
    })

    it('читает сценарий только из cookie mock-scenario, а не из query-параметра', () => {
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

    it('находит заголовок без учёта регистра во всех поддерживаемых представлениях', () => {
        expect(getHeaderValue(new Headers({ Cookie: 'from-headers' }), 'cookie')).toBe(
            'from-headers',
        )
        expect(getHeaderValue([['COOKIE', 'from-tuples']], 'cookie')).toBe('from-tuples')
        expect(getHeaderValue({ CoOkIe: 'from-object' }, 'cookie')).toBe('from-object')
        expect(getHeaderValue(undefined, 'cookie')).toBeNull()
    })

    it('декодирует значение cookie и сохраняет знаки равенства внутри него', () => {
        const cookies = 'session=token=a=b; mock-scenario=slow%20network'

        expect(getCookieValue(cookies, 'session')).toBe('token=a=b')
        expect(getCookieValue(cookies, 'mock-scenario')).toBe('slow network')
        expect(getCookieValue(cookies, 'missing')).toBeNull()
    })

    it('извлекает pathname из абсолютного и относительного URL и отклоняет неверный URL', () => {
        expect(getPathnameFromUrl('https://frontend.example.test/catalog?status=available')).toBe(
            '/catalog',
        )
        expect(getPathnameFromUrl('/preview/item?mode=compact')).toBe('/preview/item')
        expect(getPathnameFromUrl('http://[invalid')).toBeNull()
        expect(getPathnameFromUrl('')).toBeNull()
    })
})
