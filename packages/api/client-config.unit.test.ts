import type { MockRequestConfig } from './mock-client'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type FetchMock = (_input: RequestInfo | URL, _init?: RequestInit) => Promise<Response>
type MockResponseMock = (_config: MockRequestConfig, _scenario?: string) => Promise<Response>

interface BrowserRuntimeCase {
    development: boolean
    expectedBaseUrl: string
    runtimeName: string
}

describe('runtime-конфигурация Hey API', () => {
    beforeEach(() => {
        vi.resetModules()
        vi.stubEnv('BACK_INTERNAL_URL', 'https://internal.example.test')
        vi.stubEnv('MOCK_MODE', 'false')
        vi.stubEnv('NEXT_PUBLIC_BACK_URL', 'https://backend.example.test')
        vi.stubEnv('NEXT_PUBLIC_BFF_PATH', '/bff-api')
        vi.stubEnv('NEXT_PUBLIC_MOCK_MODE', 'false')
        vi.stubEnv('NEXT_RUNTIME', '')
    })

    afterEach(() => {
        vi.doUnmock('#/constants/env')
        vi.doUnmock('./mock-client')
        vi.unstubAllEnvs()
        vi.unstubAllGlobals()
        vi.resetModules()
    })

    it('выбирает внутренний URL на сервере, BFF в development и публичный backend в production', async () => {
        const { selectApiBaseUrl } = await import('./client-config')
        const urls = {
            browserDevelopment: '/bff-api',
            browserProduction: 'https://backend.example.test',
            server: 'https://internal.example.test',
        }

        expect(selectApiBaseUrl({ browser: false, development: false, urls })).toBe(urls.server)
        expect(selectApiBaseUrl({ browser: true, development: true, urls })).toBe(
            urls.browserDevelopment,
        )
        expect(selectApiBaseUrl({ browser: true, development: false, urls })).toBe(
            urls.browserProduction,
        )
    })

    it('по умолчанию отправляет credentials и сохраняет нативные Fetch-опции и настройки Next.js', async () => {
        const fetchMock = vi.fn<FetchMock>().mockResolvedValue(new Response(null, { status: 204 }))
        vi.stubGlobal('fetch', fetchMock)

        const { apiFetch, createClientConfig } = await import('./client-config')
        const config = createClientConfig()
        const next = { revalidate: 60, tags: ['pets'] }
        const requestInit: RequestInit = {
            cache: 'force-cache',
            next,
        }

        expect(config.credentials).toBe('include')
        expect(config.baseUrl).toBe('https://internal.example.test')
        expect(config.fetch).toBe(apiFetch)

        await apiFetch('https://internal.example.test/pets', requestInit)

        expect(fetchMock).toHaveBeenCalledWith(
            'https://internal.example.test/pets',
            expect.objectContaining({ cache: 'force-cache', next }),
        )
    })

    it('возвращает мок-ответ для текущего запроса без обращения к backend', async () => {
        const getMockResponse = vi.fn<MockResponseMock>().mockResolvedValue(
            Response.json(
                { mocked: true },
                {
                    headers: { 'content-type': 'application/json', 'x-mock-mode': 'true' },
                },
            ),
        )
        vi.doMock('./mock-client', () => ({ getMockResponse }))
        const fetchMock = vi.fn<FetchMock>().mockRejectedValue(new Error('fetch should not run'))
        vi.stubGlobal('fetch', fetchMock)

        const { apiFetch } = await import('./client-config')
        const response = await apiFetch('https://internal.example.test/pets?offset=20', {
            headers: {
                cookie: 'mock-mode=true; mock-scenario=default',
                'x-url': 'https://frontend.example.test/catalog',
            },
            method: 'GET',
        })

        await expect(response.json()).resolves.toStrictEqual({ mocked: true })
        expect(getMockResponse).toHaveBeenCalledWith(
            expect.objectContaining({
                method: 'GET',
                url: 'https://internal.example.test/pets?offset=20',
            }),
            'default',
        )
        expect(fetchMock).not.toHaveBeenCalled()
    })

    it.each<BrowserRuntimeCase>([
        {
            development: true,
            expectedBaseUrl: '/bff-api',
            runtimeName: 'development',
        },
        {
            development: false,
            expectedBaseUrl: 'https://backend.example.test',
            runtimeName: 'production',
        },
    ])('использует browser base URL в $runtimeName', async ({ development, expectedBaseUrl }) => {
        vi.doMock('#/constants/env', () => ({ isDev: development }))
        vi.stubGlobal('window', { location: { pathname: '/' } })
        const fetchMock = vi.fn<FetchMock>().mockResolvedValue(Response.json({ ok: true }))
        vi.stubGlobal('fetch', fetchMock)

        const { client } = await import('./client')
        await client.get({ url: '/pets' })

        expect(fetchMock.mock.calls[0]?.[0]).toBe(`${expectedBaseUrl}/pets`)
    })
})
