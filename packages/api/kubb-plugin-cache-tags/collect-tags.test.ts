import type { OpenAPIV3_1 } from '@kubb/oas'

import { describe, expect, it } from 'vitest'

import { collectTags } from './collect-tags'

function doc(paths: OpenAPIV3_1.PathsObject): OpenAPIV3_1.Document {
    return {
        openapi: '3.1.0',
        info: { title: 'test', version: '1.0.0' },
        paths,
    }
}

describe('collectTags', () => {
    it('возвращает пустую Map для спеки без путей', () => {
        const result = collectTags(doc({}))
        expect(result.size).toBe(0)
    })

    it('пропускает операцию без tags', () => {
        const result = collectTags(
            doc({
                '/anon': { get: { responses: { 200: { description: 'ok' } } } },
            }),
        )
        expect(result.size).toBe(0)
    })

    it('собирает тег без path-параметров (только коллекция)', () => {
        const result = collectTags(
            doc({
                '/products': {
                    get: { tags: ['products'], responses: { 200: { description: 'ok' } } },
                },
            }),
        )
        const model = result.get('products')
        expect(model).toBeDefined()
        expect(model!.tagName).toBe('products')
        expect(model!.singularName).toBe('product')
        expect(model!.varPrefix).toBe('products')
        expect(model!.singularPrefix).toBe('product')
        expect(model!.fileName).toBe('products')
        expect(model!.pathParams).toEqual([])
    })

    it('извлекает один path-параметр со schema type string', () => {
        const result = collectTags(
            doc({
                '/products/{productId}': {
                    get: {
                        tags: ['products'],
                        parameters: [
                            {
                                name: 'productId',
                                in: 'path',
                                required: true,
                                schema: { type: 'string' },
                            },
                        ],
                        responses: { 200: { description: 'ok' } },
                    },
                },
            }),
        )
        const model = result.get('products')!
        expect(model.pathParams).toEqual([{ name: 'productId', schemaType: 'string' }])
    })

    it('integer/number schema type → number', () => {
        const result = collectTags(
            doc({
                '/products/{productId}': {
                    get: {
                        tags: ['products'],
                        parameters: [
                            {
                                name: 'productId',
                                in: 'path',
                                required: true,
                                schema: { type: 'integer' },
                            },
                        ],
                        responses: { 200: { description: 'ok' } },
                    },
                },
            }),
        )
        expect(result.get('products')!.pathParams[0]!.schemaType).toBe('number')
    })

    it('параметр без schema → string | number', () => {
        const result = collectTags(
            doc({
                '/products/{productId}': {
                    get: {
                        tags: ['products'],
                        parameters: [{ name: 'productId', in: 'path', required: true }],
                        responses: { 200: { description: 'ok' } },
                    },
                },
            }),
        )
        expect(result.get('products')!.pathParams[0]!.schemaType).toBe('string | number')
    })

    it('дедуплицирует одинаковые параметры с одинаковым типом', () => {
        const path = {
            tags: ['products'],
            parameters: [
                {
                    name: 'productId',
                    in: 'path' as const,
                    required: true,
                    schema: { type: 'string' as const },
                },
            ],
            responses: { 200: { description: 'ok' } },
        }
        const result = collectTags(
            doc({
                '/products/{productId}': { get: path, put: path },
            }),
        )
        expect(result.get('products')!.pathParams).toHaveLength(1)
    })

    it('сливает параметры одного имени с разными типами в union', () => {
        const result = collectTags(
            doc({
                '/a/{productId}': {
                    get: {
                        tags: ['products'],
                        parameters: [
                            {
                                name: 'productId',
                                in: 'path',
                                required: true,
                                schema: { type: 'string' },
                            },
                        ],
                        responses: { 200: { description: 'ok' } },
                    },
                },
                '/b/{productId}': {
                    get: {
                        tags: ['products'],
                        parameters: [
                            {
                                name: 'productId',
                                in: 'path',
                                required: true,
                                schema: { type: 'integer' },
                            },
                        ],
                        responses: { 200: { description: 'ok' } },
                    },
                },
            }),
        )
        expect(result.get('products')!.pathParams[0]!.schemaType).toBe('string | number')
    })

    it('собирает несколько уникальных параметров в одном теге', () => {
        const result = collectTags(
            doc({
                '/products/{productId}/variants/{variantId}': {
                    get: {
                        tags: ['products'],
                        parameters: [
                            {
                                name: 'productId',
                                in: 'path',
                                required: true,
                                schema: { type: 'string' },
                            },
                            {
                                name: 'variantId',
                                in: 'path',
                                required: true,
                                schema: { type: 'string' },
                            },
                        ],
                        responses: { 200: { description: 'ok' } },
                    },
                },
            }),
        )
        const params = result.get('products')!.pathParams
        expect(params.map((p) => p.name).sort()).toEqual(['productId', 'variantId'])
    })

    it('операция с несколькими tags попадает во все соответствующие модели', () => {
        const result = collectTags(
            doc({
                '/bundles/{bundleId}': {
                    get: {
                        tags: ['products', 'orders'],
                        parameters: [
                            {
                                name: 'bundleId',
                                in: 'path',
                                required: true,
                                schema: { type: 'string' },
                            },
                        ],
                        responses: { 200: { description: 'ok' } },
                    },
                },
            }),
        )
        expect(result.get('products')!.pathParams[0]!.name).toBe('bundleId')
        expect(result.get('orders')!.pathParams[0]!.name).toBe('bundleId')
    })

    it('учитывает path-level parameters', () => {
        const result = collectTags(
            doc({
                '/products/{productId}': {
                    parameters: [
                        {
                            name: 'productId',
                            in: 'path',
                            required: true,
                            schema: { type: 'integer' },
                        },
                    ],
                    get: {
                        tags: ['products'],
                        responses: { 200: { description: 'ok' } },
                    },
                },
            }),
        )
        expect(result.get('products')!.pathParams[0]!.schemaType).toBe('number')
    })

    it('неизменяемое singular (feed) → suffix Item', () => {
        const result = collectTags(
            doc({
                '/feed/{itemId}': {
                    get: {
                        tags: ['feed'],
                        parameters: [
                            {
                                name: 'itemId',
                                in: 'path',
                                required: true,
                                schema: { type: 'string' },
                            },
                        ],
                        responses: { 200: { description: 'ok' } },
                    },
                },
            }),
        )
        const model = result.get('feed')!
        expect(model.singularName).toBe('feed')
        expect(model.singularPrefix).toBe('feedItem')
    })

    it('kebab-case тег нормализуется в camelCase/fileName', () => {
        const result = collectTags(
            doc({
                '/user-profiles': {
                    get: { tags: ['user-profiles'], responses: { 200: { description: 'ok' } } },
                },
            }),
        )
        const model = result.get('user-profiles')!
        expect(model.varPrefix).toBe('userProfiles')
        expect(model.fileName).toBe('user-profiles')
        expect(model.singularPrefix).toBe('userProfile')
    })
})
