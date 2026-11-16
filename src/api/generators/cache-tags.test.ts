import { describe, expect, it } from 'vitest'

import { collectCacheTags, renderCacheTagIndex, renderCacheTagModule } from './cache-tags'
import { parseContractDocument } from './contract'

function contract(paths: Record<string, unknown>) {
    return parseContractDocument({ openapi: '3.2.0', paths })
}

describe('генератор cache tags', () => {
    it('сохраняет имена коллекций и ресурсов, объединяет типы и добавляет fallback для неизменяемого слова', () => {
        const models = collectCacheTags(
            contract({
                '/products/{productId}': {
                    get: {
                        operationId: 'getProduct',
                        summary: 'Get product',
                        tags: ['products'],
                        parameters: [{ in: 'path', name: 'productId', schema: { type: 'string' } }],
                        responses: { 200: { description: 'ok' } },
                    },
                },
                '/legacy-products/{productId}': {
                    get: {
                        operationId: 'getLegacyProduct',
                        summary: 'Get legacy product',
                        tags: ['products'],
                        parameters: [
                            { in: 'path', name: 'productId', schema: { type: 'integer' } },
                        ],
                        responses: { 200: { description: 'ok' } },
                    },
                },
                '/feed/{itemId}': {
                    get: {
                        operationId: 'getFeedItem',
                        summary: 'Get feed item',
                        tags: ['feed'],
                        parameters: [{ in: 'path', name: 'itemId', schema: { type: 'string' } }],
                        responses: { 200: { description: 'ok' } },
                    },
                },
            }),
        )

        expect(models.get('products')).toMatchObject({
            fileName: 'products',
            singularPrefix: 'product',
            varPrefix: 'products',
            pathParameters: [{ name: 'productId', schemaType: 'string | number' }],
        })
        expect(models.get('feed')?.singularPrefix).toBe('feedItem')
    })

    it('генерирует стабильные значения тегов, update helpers и отсортированные namespace-экспорты', () => {
        const models = collectCacheTags(
            contract({
                '/products/{productId}': {
                    get: {
                        operationId: 'getProduct',
                        summary: 'Get product',
                        tags: ['products'],
                        parameters: [{ in: 'path', name: 'productId', schema: { type: 'string' } }],
                        responses: { 200: { description: 'ok' } },
                    },
                },
                '/orders/{orderId}': {
                    get: {
                        operationId: 'getOrder',
                        summary: 'Get order',
                        tags: ['orders'],
                        parameters: [{ in: 'path', name: 'orderId', schema: { type: 'integer' } }],
                        responses: { 200: { description: 'ok' } },
                    },
                },
            }),
        )

        const products = renderCacheTagModule(models.get('products')!)
        expect(products).toContain("export const productsTag = 'products' as const")
        expect(products).toContain('export function productTag(')
        expect(products).toContain('updateTag(productTag(params))')
        expect(products).toContain("import 'server-only'")
        expect(renderCacheTagIndex([...models.values()])).toContain(
            "export * as orders from './orders'\nexport * as products from './products'",
        )
    })
})
