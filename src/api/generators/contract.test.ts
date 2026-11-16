import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { parseContractDocument, readContractBundle } from './contract'

const fixturePath = fileURLToPath(new URL('__fixtures__/contract.yaml', import.meta.url))

describe('модель API-контракта', () => {
    it('читает из OpenAPI 3.2 операции, ссылки, tags, статусы и наличие тела ответа', async () => {
        const contract = await readContractBundle(fixturePath)

        expect(contract.openapi).toBe('3.2.0')
        expect(contract.operations).toHaveLength(5)
        expect(contract.operations.find((item) => item.operationId === 'getPetById')).toMatchObject(
            {
                method: 'get',
                path: '/pets/{petId}',
                pathParameters: [{ name: 'petId', schemaType: 'string' }],
                tags: ['pets'],
            },
        )
        expect(
            contract.operations.find((item) => item.operationId === 'deletePet')?.responses,
        ).toStrictEqual([{ status: 204, hasBody: false }])
        expect(
            contract.operations.find((item) => item.operationId === 'findPetsByStatus')?.responses,
        ).toStrictEqual([{ status: 200, hasBody: true }])
    })

    it('предпочитает path-параметры операции параметрам уровня пути', () => {
        const contract = parseContractDocument({
            openapi: '3.2.0',
            paths: {
                '/products/{productId}': {
                    parameters: [
                        {
                            in: 'path',
                            name: 'productId',
                            schema: { type: 'integer' },
                        },
                    ],
                    get: {
                        operationId: 'getProduct',
                        summary: 'Get product',
                        tags: ['products'],
                        parameters: [
                            {
                                in: 'path',
                                name: 'productId',
                                schema: { type: 'string' },
                            },
                        ],
                        responses: { 200: { description: 'ok' } },
                    },
                },
            },
        })

        expect(contract.operations[0]?.pathParameters).toStrictEqual([
            { name: 'productId', schemaType: 'string' },
        ])
    })

    it('отклоняет операции без стабильного operationId', () => {
        expect(() =>
            parseContractDocument({
                openapi: '3.2.0',
                paths: {
                    '/pets': {
                        get: {
                            summary: 'Find pets',
                            responses: { 200: { description: 'ok' } },
                        },
                    },
                },
            }),
        ).toThrow('operationId')
    })
})
