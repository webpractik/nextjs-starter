import type { TagModel } from './types'

import { describe, expect, it } from 'vitest'

import { renderTagFile } from './render-tag-file'

function model(partial: Partial<TagModel>): TagModel {
    return {
        tagName: 'products',
        singularName: 'product',
        fileName: 'products',
        varPrefix: 'products',
        singularPrefix: 'product',
        pathParams: [],
        ...partial,
    }
}

describe('renderTagFile', () => {
    it('коллекция без path-параметров', async () => {
        const source = renderTagFile(model({}))
        await expect(source).toMatchFileSnapshot('__snapshots__/collection-only.ts.snap')
    })

    it('один path-параметр', async () => {
        const source = renderTagFile(
            model({
                pathParams: [{ name: 'productId', schemaType: 'string' }],
            }),
        )
        await expect(source).toMatchFileSnapshot('__snapshots__/single-param.ts.snap')
    })

    it('два разных path-параметра', async () => {
        const source = renderTagFile(
            model({
                pathParams: [
                    { name: 'productId', schemaType: 'string' },
                    { name: 'variantId', schemaType: 'number' },
                ],
            }),
        )
        await expect(source).toMatchFileSnapshot('__snapshots__/two-params.ts.snap')
    })

    it('неизменяемое singular — суффикс Item', async () => {
        const source = renderTagFile(
            model({
                tagName: 'feed',
                singularName: 'feed',
                fileName: 'feed',
                varPrefix: 'feed',
                singularPrefix: 'feedItem',
                pathParams: [{ name: 'itemId', schemaType: 'string' }],
            }),
        )
        await expect(source).toMatchFileSnapshot('__snapshots__/feed-item.ts.snap')
    })

    it('union типов string | number', async () => {
        const source = renderTagFile(
            model({
                pathParams: [{ name: 'productId', schemaType: 'string | number' }],
            }),
        )
        await expect(source).toMatchFileSnapshot('__snapshots__/union-type.ts.snap')
    })
})
