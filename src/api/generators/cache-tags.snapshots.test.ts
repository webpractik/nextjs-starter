import type { CacheTagModel } from './cache-tags'

import { describe, expect, it } from 'vitest'

import { renderCacheTagIndex, renderCacheTagModule } from './cache-tags'

function model(partial: Partial<CacheTagModel> = {}): CacheTagModel {
    return {
        fileName: 'products',
        pathParameters: [],
        singularPrefix: 'product',
        tagName: 'products',
        varPrefix: 'products',
        ...partial,
    }
}

describe('snapshots генератора cache tags', () => {
    it('сохраняет collection-only модуль', async () => {
        await expect(renderCacheTagModule(model())).toMatchFileSnapshot(
            '__snapshots__/collection-only.ts.snap',
        )
    })

    it('сохраняет модуль с одним path-параметром', async () => {
        await expect(
            renderCacheTagModule(
                model({ pathParameters: [{ name: 'productId', schemaType: 'string' }] }),
            ),
        ).toMatchFileSnapshot('__snapshots__/single-param.ts.snap')
    })

    it('сохраняет модуль с двумя разными path-параметрами', async () => {
        await expect(
            renderCacheTagModule(
                model({
                    pathParameters: [
                        { name: 'productId', schemaType: 'string' },
                        { name: 'variantId', schemaType: 'number' },
                    ],
                }),
            ),
        ).toMatchFileSnapshot('__snapshots__/two-params.ts.snap')
    })

    it('сохраняет Item fallback для неизменяемого singular', async () => {
        await expect(
            renderCacheTagModule(
                model({
                    fileName: 'feed',
                    pathParameters: [{ name: 'itemId', schemaType: 'string' }],
                    singularPrefix: 'feedItem',
                    tagName: 'feed',
                    varPrefix: 'feed',
                }),
            ),
        ).toMatchFileSnapshot('__snapshots__/feed-item.ts.snap')
    })

    it('сохраняет объединённый string | number тип', async () => {
        await expect(
            renderCacheTagModule(
                model({ pathParameters: [{ name: 'productId', schemaType: 'string | number' }] }),
            ),
        ).toMatchFileSnapshot('__snapshots__/union-type.ts.snap')
    })

    it('сортирует namespace exports по имени файла', async () => {
        await expect(
            renderCacheTagIndex([
                model(),
                model({ fileName: 'orders', tagName: 'orders', varPrefix: 'orders' }),
                model({
                    fileName: 'user-profiles',
                    tagName: 'user-profiles',
                    varPrefix: 'userProfiles',
                }),
            ]),
        ).toMatchFileSnapshot('__snapshots__/index.ts.snap')
    })
})
