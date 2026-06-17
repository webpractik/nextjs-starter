import type { RequestConfig, ResponseConfig } from './fetch.client'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type FetchMock = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
type MockResponseMock<TData> = (
    config: Partial<RequestConfig>,
    scenario?: string,
) => Promise<ResponseConfig<TData>>

function jsonResponse(data: unknown, status = 200, statusText = 'OK') {
    return new Response(JSON.stringify(data), {
        status,
        statusText,
        headers: { 'content-type': 'application/json' },
    })
}

function mockMockResponse<TData>(data: TData) {
    const getMockResponse = vi.fn<MockResponseMock<TData>>(async () => ({
        data,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'x-mock-mode': 'true' }),
    }))

    vi.doMock('./mock-client', () => ({ getMockResponse }))

    return getMockResponse
}

describe('fetch client mock mode', () => {
    beforeEach(() => {
        vi.resetModules()
        vi.stubEnv('APP_ENV', 'LOCAL')
        vi.stubEnv('APP_NAME', 'nextjs-starter')
        vi.stubEnv('BACK_INTERNAL_URL', 'https://internal.example.test')
        vi.stubEnv('CI', 'false')
        vi.stubEnv('FRONT_HOST', 'localhost')
        vi.stubEnv('PORT', '3000')
        vi.stubEnv('HTTP_AUTH_LOGIN', 'test')
        vi.stubEnv('HTTP_AUTH_PASS', 'test')
        vi.stubEnv('MOCK_MODE', 'false')
        vi.stubEnv('SENTRY_AUTH_TOKEN', 'test-token')
        vi.stubEnv('SENTRY_DSN', 'https://public@example.test/1')
        vi.stubEnv('SENTRY_ORG', 'test')
        vi.stubEnv('SENTRY_URL', 'https://sentry.example.test')
        vi.stubEnv('NEXT_PUBLIC_APP_ENV', 'LOCAL')
        vi.stubEnv('NEXT_PUBLIC_BFF_PATH', '/bff-api')
        vi.stubEnv('NEXT_PUBLIC_FRONT_URL', 'https://frontend.example.test')
        vi.stubEnv('NEXT_PUBLIC_BACK_URL', 'https://backend.example.test')
        vi.stubEnv('NEXT_PUBLIC_MOCK_MODE', 'false')
        vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', 'https://public@example.test/1')
        vi.stubEnv('NEXT_RUNTIME', '')
    })

    afterEach(() => {
        vi.unstubAllEnvs()
        vi.unstubAllGlobals()
        vi.resetModules()
    })

    it('returns mock data without a network request when MOCK_MODE=true', async () => {
        vi.stubEnv('MOCK_MODE', 'true')
        mockMockResponse([{ id: 1, name: 'Rex' }])
        const fetchMock = vi.fn<FetchMock>().mockRejectedValue(new Error('fetch should not run'))
        vi.stubGlobal('fetch', fetchMock)

        const { default: request } = await import('./fetch.client')
        const result = await request<Array<{ id: number; name: string }>>({
            url: '/pet/findByStatus',
            method: 'GET',
        })

        expect(result.data).toEqual([{ id: 1, name: 'Rex' }])
        expect(fetchMock).not.toHaveBeenCalled()
    })

    it('passes a valid mock-scenario cookie to mock-client only in mock mode', async () => {
        vi.doMock('./mock-scenarios', () => ({
            isBaseMockScenarioName: (value: string | null | undefined) => value === 'default',
        }))
        const getMockResponse = mockMockResponse([{ id: 2, name: 'Cookie scenario pet' }])
        const fetchMock = vi.fn<FetchMock>().mockRejectedValue(new Error('fetch should not run'))
        vi.stubGlobal('fetch', fetchMock)

        const { default: request } = await import('./fetch.client')
        await request<Array<{ id: number; name: string }>>({
            url: '/pet/findByStatus',
            headers: {
                cookie: 'mock-mode=true; mock-scenario=default',
            },
        })

        expect(getMockResponse).toHaveBeenCalledWith(
            expect.objectContaining({ url: '/pet/findByStatus' }),
            'default',
        )
        expect(fetchMock).not.toHaveBeenCalled()
    })

    it('ignores mock-scenario cookie without mock mode and sends a backend request', async () => {
        const fetchMock = vi.fn<FetchMock>().mockResolvedValue(jsonResponse({ ok: true }))
        vi.stubGlobal('fetch', fetchMock)

        const { default: request } = await import('./fetch.client')
        const result = await request<{ ok: boolean }>({
            url: '/pet/findByStatus',
            headers: {
                cookie: 'mock-scenario=default',
            },
        })

        expect(result.data).toEqual({ ok: true })
        expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    it('serializes array query params as repeated keys', async () => {
        const fetchMock = vi.fn<FetchMock>().mockResolvedValue(jsonResponse({ ok: true }))
        vi.stubGlobal('fetch', fetchMock)

        const { default: request } = await import('./fetch.client')
        await request({
            url: '/pet/findByTags',
            params: {
                tags: ['friendly', 'trained'],
            },
        })

        expect(fetchMock.mock.calls[0]?.[0]).toContain('/pet/findByTags?tags=friendly&tags=trained')
    })
})
