import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { readContractBundle } from './contract'
import { collectMockRoutes, renderMockRoutes } from './mock-routes'

const fixturePath = fileURLToPath(new URL('./__fixtures__/contract.yaml', import.meta.url))

const factories = new Set([
    'fakeSearchPetsResponse200',
    'fakeFindPetsByStatusResponse200',
    'fakeCreatePetResponse201',
    'fakeGetPetByIdResponse200',
])

describe('генератор мок-маршрутов', () => {
    it('связывает Faker-фабрики, оставляет 204 без фабрики и ставит статические маршруты раньше динамических', async () => {
        const routes = collectMockRoutes(await readContractBundle(fixturePath), factories)

        expect(routes.map((route) => route.operationId)).toEqual([
            'searchPets',
            'findPetsByStatus',
            'createPet',
            'getPetById',
            'deletePet',
        ])
        expect(routes[0]).toMatchObject({
            method: 'get',
            path: '/pets/search',
            status: 200,
            tag: 'pets',
            factoryName: 'fakeSearchPetsResponse200',
        })
        expect(routes.at(-1)).toMatchObject({
            method: 'delete',
            status: 204,
            factoryName: undefined,
        })

        const source = renderMockRoutes(routes)
        expect(source).toContain('pattern: /^\\/pets\\/[^/]+$/')
        expect(source).toContain("method: 'DELETE'")
        expect(source).not.toContain('fakeDeletePetResponse204')
    })

    it('останавливает генерацию, если для ответа с телом нет Faker-фабрики', async () => {
        const contract = await readContractBundle(fixturePath)

        expect(() => collectMockRoutes(contract, new Set())).toThrow('fakeSearchPetsResponse200')
    })
})
