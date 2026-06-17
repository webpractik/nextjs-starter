import type { MockRoute } from './mock-client'

import { afterEach, describe, expect, it, vi } from 'vitest'

describe('mock-client', () => {
    afterEach(() => {
        vi.resetModules()
    })

    it('returns a generated mock response for the first matching route', async () => {
        const mockRoutes = [
            {
                method: 'GET',
                pattern: /^\/pet\/findByStatus$/,
                create: () => [{ id: 1, name: 'Rex' }],
            },
        ] satisfies MockRoute[]

        vi.doMock('./codegen/mock-client-routes', () => ({ mockRoutes }))

        const { getMockResponse } = await import('./mock-client')
        const response = await getMockResponse<Array<{ id: number; name: string }>>({
            method: 'GET',
            url: '/pet/findByStatus?status=available',
        })

        expect(response).toMatchObject({
            data: [{ id: 1, name: 'Rex' }],
            status: 200,
            statusText: 'OK',
        })
        expect(response.headers.get('x-mock-mode')).toBe('true')
    })

    it('allows a named scenario to override generated routes', async () => {
        vi.doMock('./codegen/mock-client-routes', () => ({ mockRoutes: [] }))
        vi.doMock('./mock-scenarios', () => ({
            getMockScenarioRoute: () => ({
                method: 'GET',
                pattern: /^\/pet\/findByStatus$/,
                status: 202,
                create: () => [{ id: 2, name: 'Scenario pet' }],
            }),
        }))

        const { getMockResponse } = await import('./mock-client')
        const response = await getMockResponse<Array<{ id: number; name: string }>>(
            {
                method: 'GET',
                url: '/pet/findByStatus',
            },
            'default',
        )

        expect(response).toMatchObject({
            data: [{ id: 2, name: 'Scenario pet' }],
            status: 202,
            statusText: 'Accepted',
        })
    })
})
