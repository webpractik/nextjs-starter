import type { Config } from './client'
import type { MockRequestConfig } from './mock-client'

import { isDev } from '#/constants/env'
import {
    getBrowserMockScenario,
    getRequestMockScenario,
    isBrowserRuntimeMockModeEnabled,
    isRequestMockModeEnabled,
} from '#/mock-mode/runtime'

import { clientEnvironment } from '../../src/env/client'
import { serverEnvironment } from '../../src/env/server'

interface ApiBaseUrls {
    browserDevelopment: string
    browserProduction: string
    server: string
}

interface SelectApiBaseUrlOptions {
    browser: boolean
    development: boolean
    urls: ApiBaseUrls
}

export function selectApiBaseUrl({ browser, development, urls }: SelectApiBaseUrlOptions) {
    if (!browser) {
        return urls.server
    }
    return development ? urls.browserDevelopment : urls.browserProduction
}

function getApiBaseUrl() {
    if (globalThis.window === undefined) {
        return serverEnvironment.BACK_INTERNAL_URL
    }
    return isDev ? clientEnvironment.NEXT_PUBLIC_BFF_PATH : clientEnvironment.NEXT_PUBLIC_BACK_URL
}

function isEnvironmentFlagEnabled(value: boolean | string | undefined) {
    return value === true || value === 'true'
}

async function isMockModeEnabled(headers: Headers) {
    if (globalThis.window === undefined) {
        if (
            isEnvironmentFlagEnabled(process.env.MOCK_MODE) ||
            isEnvironmentFlagEnabled(serverEnvironment.MOCK_MODE) ||
            isRequestMockModeEnabled(headers)
        ) {
            return true
        }

        if (process.env.NEXT_RUNTIME !== 'nodejs' && process.env.NEXT_RUNTIME !== 'edge') {
            return false
        }

        try {
            const { headers: getHeaders } = await import('next/headers')
            return isRequestMockModeEnabled(await getHeaders())
        } catch {
            return false
        }
    }

    return (
        isEnvironmentFlagEnabled(process.env.NEXT_PUBLIC_MOCK_MODE ?? process.env.MOCK_MODE) ||
        isEnvironmentFlagEnabled(clientEnvironment.NEXT_PUBLIC_MOCK_MODE) ||
        isRequestMockModeEnabled(headers) ||
        isBrowserRuntimeMockModeEnabled()
    )
}

async function getRawMockScenario(headers: Headers) {
    const requestScenario = getRequestMockScenario(headers)

    if (requestScenario != null) {
        return requestScenario
    }

    if (globalThis.window === undefined) {
        if (process.env.NEXT_RUNTIME !== 'nodejs' && process.env.NEXT_RUNTIME !== 'edge') {
            return
        }

        try {
            const { headers: getHeaders } = await import('next/headers')
            return getRequestMockScenario(await getHeaders())
        } catch {
            return
        }
    }

    return getBrowserMockScenario()
}

async function getMockScenario(headers: Headers) {
    const rawScenario = await getRawMockScenario(headers)

    if (rawScenario == null) {
        return
    }

    const { isBaseMockScenarioName } = await import('./mock-scenarios')
    return isBaseMockScenarioName(rawScenario) ? rawScenario : undefined
}

function mergeRequestHeaders(input: RequestInfo | URL, init?: RequestInit) {
    const headers = new Headers(input instanceof Request ? input.headers : undefined)

    for (const [key, value] of new Headers(init?.headers)) {
        headers.set(key, value)
    }
    return headers
}

function createMockRequestConfig(
    input: RequestInfo | URL,
    init: RequestInit | undefined,
    headers: Headers,
): MockRequestConfig {
    const rawUrl = input instanceof Request ? input.url : String(input)
    const url = new URL(rawUrl, 'http://localhost')
    const basePath = new URL(getApiBaseUrl(), 'http://localhost').pathname.replace(/\/$/, '')

    if (basePath !== '' && (url.pathname === basePath || url.pathname.startsWith(`${basePath}/`))) {
        url.pathname = url.pathname.slice(basePath.length) || '/'
    }

    return {
        headers,
        method: init?.method ?? (input instanceof Request ? input.method : undefined),
        url: url.href,
    }
}

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit) {
    const headers = mergeRequestHeaders(input, init)

    if (await isMockModeEnabled(headers)) {
        const { getMockResponse } = await import('./mock-client')
        return getMockResponse(
            createMockRequestConfig(input, init, headers),
            await getMockScenario(headers),
        )
    }

    return globalThis.fetch(input, init)
}

export const createClientConfig = (override: Config = {}): Config => ({
    ...override,
    baseUrl: getApiBaseUrl(),
    credentials: override?.credentials ?? 'include',
    fetch: override?.fetch ?? apiFetch,
})
