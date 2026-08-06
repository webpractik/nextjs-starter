import type { MockRoute } from './mock-client'

import { afterEach, describe, expect, it, vi } from 'vitest'

describe('клиент сгенерированных моков', () => {
    afterEach(() => {
        vi.doUnmock('./codegen/mock-client-routes')
        vi.doUnmock('./mock-scenarios')
        vi.resetModules()
    })

    it('возвращает ответ первого подходящего маршрута и помечает его как мок', async () => {
        const mockRoutes = [
            {
                method: 'GET',
                pattern: /^\/pet\/findByStatus$/,
                create: () => [{ id: 1, name: 'Rex' }],
            },
            {
                method: 'GET',
                pattern: /^\/pet\/findByStatus$/,
                create: () => [{ id: 2, name: 'Second match' }],
            },
        ] satisfies MockRoute[]

        vi.doMock('./codegen/mock-client-routes', () => ({ mockRoutes }))

        const { getMockResponse } = await import('./mock-client')
        const response = await getMockResponse({
            method: 'GET',
            url: '/pet/findByStatus?status=available',
        })

        expect(response).toBeInstanceOf(Response)
        await expect(response.json()).resolves.toEqual([{ id: 1, name: 'Rex' }])
        expect(response.status).toBe(200)
        expect(response.statusText).toBe('OK')
        expect(response.headers.get('x-mock-mode')).toBe('true')
    })

    it('отдаёт ответ именованного сценария раньше подходящего сгенерированного маршрута', async () => {
        const mockRoutes = [
            {
                method: 'GET',
                pattern: /^\/pet\/findByStatus$/,
                status: 200,
                create: () => [{ id: 1, name: 'Generated pet' }],
            },
        ] satisfies MockRoute[]

        vi.doMock('./codegen/mock-client-routes', () => ({ mockRoutes }))
        vi.doMock('./mock-scenarios', () => ({
            getMockScenarioRoute: () => ({
                method: 'GET',
                pattern: /^\/pet\/findByStatus$/,
                status: 202,
                create: () => [{ id: 2, name: 'Scenario pet' }],
            }),
        }))

        const { getMockResponse } = await import('./mock-client')
        const response = await getMockResponse(
            {
                method: 'GET',
                url: '/pet/findByStatus',
            },
            'default',
        )

        await expect(response.json()).resolves.toEqual([{ id: 2, name: 'Scenario pet' }])
        expect(response.status).toBe(202)
        expect(response.statusText).toBe('Accepted')
    })

    it('возвращает нативный пустой Response для маршрута со статусом 204', async () => {
        const mockRoutes = [
            {
                method: 'DELETE',
                operationId: 'deletePet',
                pattern: /^\/pets\/[^/]+$/,
                status: 204,
                tag: 'pets',
            },
        ] satisfies MockRoute[]

        vi.doMock('./codegen/mock-client-routes', () => ({ mockRoutes }))

        const { getMockResponse } = await import('./mock-client')
        const response = await getMockResponse({
            method: 'DELETE',
            url: 'https://api.example.test/pets/pet_123?audit=true',
        })

        expect(response.status).toBe(204)
        expect(response.body).toBeNull()
        await expect(response.text()).resolves.toBe('')
        expect(response.headers.get('content-type')).toBeNull()
        expect(response.headers.get('x-mock-mode')).toBe('true')
    })
})
