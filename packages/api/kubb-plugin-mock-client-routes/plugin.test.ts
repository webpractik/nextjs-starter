import type { MockClientRouteDefinition } from './plugin'

import { describe, expect, it } from 'vitest'

import { renderMockClientRoutes } from './plugin'

describe('pluginMockClientRoutes', () => {
    it('renders a mock route table from OpenAPI operations', () => {
        const routes: MockClientRouteDefinition[] = [
            {
                method: 'get',
                path: '/pet/findByStatus',
                operationId: 'findPetsByStatus',
                status: 200,
                tag: 'pet',
            },
            {
                method: 'post',
                path: '/store/order',
                operationId: 'placeOrder',
                status: 201,
                tag: 'store',
            },
            {
                method: 'get',
                path: '/pet/{petId}',
                operationId: 'getPetById',
                status: 200,
                tag: 'pet',
            },
        ]

        const source = renderMockClientRoutes(routes, {
            mocksImportPath: './mocks',
            mockClientImportPath: '../mock-client',
        })

        expect(source).toContain(
            "import { createFindPetsByStatusQueryResponse } from './mocks/petService/createFindPetsByStatus'",
        )
        expect(source).toContain(
            "import { createPlaceOrderMutationResponse } from './mocks/storeService/createPlaceOrder'",
        )
        expect(source).toContain(
            "{ method: 'POST', pattern: /^\\/store\\/order$/, status: 201, create: createPlaceOrderMutationResponse }",
        )
        expect(source).toContain(
            "{ method: 'GET', pattern: /^\\/pet\\/[^/]+$/, create: createGetPetByIdQueryResponse }",
        )
    })
})
