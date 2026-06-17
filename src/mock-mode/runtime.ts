import type { MockModePagePath } from './config'

import { mockModeExcludedPagePaths, mockModePagePaths } from './config'

type HeadersInput = [string, string][] | Record<string, string> | Headers | undefined

const mockModeCookieName = 'mock-mode'
const mockScenarioCookieName = 'mock-scenario'
const trailingSlashesPattern = /\/+$/

export function isRuntimeMockFlagEnabled(value: string | null | undefined): boolean {
    return value === 'true'
}

export function getHeaderValue(headers: HeadersInput, name: string): string | null {
    if (headers == null) return null

    if (headers instanceof Headers) {
        return headers.get(name)
    }

    const normalizedName = name.toLowerCase()

    if (Array.isArray(headers)) {
        return headers.find(([key]) => key.toLowerCase() === normalizedName)?.[1] ?? null
    }

    for (const [key, value] of Object.entries(headers)) {
        if (key.toLowerCase() === normalizedName) return value
    }

    return null
}

export function getCookieValue(
    cookieHeader: string | null | undefined,
    name: string,
): string | null {
    if (cookieHeader == null || cookieHeader === '') return null

    for (const cookie of cookieHeader.split(';')) {
        const [rawName, ...rawValue] = cookie.trim().split('=')
        if (rawName === name) return decodeURIComponent(rawValue.join('='))
    }

    return null
}

export function isMockModeCookieEnabled(cookieHeader: string | null | undefined): boolean {
    return isRuntimeMockFlagEnabled(getCookieValue(cookieHeader, mockModeCookieName))
}

function normalizePath(pathname: string): string {
    const normalized = pathname.trim().replace(trailingSlashesPattern, '')

    return normalized === '' ? '/' : normalized
}

export function getPathnameFromUrl(value: string | null | undefined): string | null {
    if (value == null || value === '') return null

    try {
        return new URL(value, 'http://localhost').pathname
    } catch {
        return null
    }
}

function matchesPagePath(paths: readonly MockModePagePath[], currentPath: string): boolean {
    return paths.some((configuredPath) => {
        if (configuredPath instanceof RegExp) {
            configuredPath.lastIndex = 0

            return configuredPath.test(currentPath)
        }

        const mockPath = normalizePath(configuredPath)

        return currentPath === mockPath || currentPath.startsWith(`${mockPath}/`)
    })
}

export function isMockModePagePath(pathname: string | null | undefined): boolean {
    if (pathname == null || pathname === '') return false

    const currentPath = normalizePath(pathname)

    if (matchesPagePath(mockModeExcludedPagePaths, currentPath)) return false

    return matchesPagePath(mockModePagePaths, currentPath)
}

export function isRequestMockModeEnabled(headers: HeadersInput): boolean {
    return (
        isMockModeCookieEnabled(getHeaderValue(headers, 'cookie')) ||
        isMockModePagePath(getPathnameFromUrl(getHeaderValue(headers, 'x-url')))
    )
}

export function isBrowserRuntimeMockModeEnabled(): boolean {
    return (
        isMockModeCookieEnabled(globalThis.document?.cookie) ||
        isMockModePagePath(globalThis.window?.location.pathname)
    )
}

function getMockScenarioFromCookie(cookieHeader: string | null | undefined) {
    return getCookieValue(cookieHeader, mockScenarioCookieName)
}

export function getRequestMockScenario(headers: HeadersInput) {
    const cookieHeader = getHeaderValue(headers, 'cookie')
    return getMockScenarioFromCookie(cookieHeader)
}

export function getBrowserMockScenario() {
    return getMockScenarioFromCookie(globalThis.document?.cookie)
}
