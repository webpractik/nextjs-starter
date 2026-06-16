import type { TagModel } from './types'

import { describe, expect, it } from 'vitest'

import { renderIndexFile } from './render-index-file'

function m(fileName: string, varPrefix: string): TagModel {
    return {
        tagName: varPrefix,
        singularName: varPrefix,
        fileName,
        varPrefix,
        singularPrefix: varPrefix,
        pathParams: [],
    }
}

describe('renderIndexFile', () => {
    it('сортирует по fileName и создаёт namespace-экспорты', async () => {
        const source = renderIndexFile([
            m('products', 'products'),
            m('orders', 'orders'),
            m('user-profiles', 'userProfiles'),
        ])
        await expect(source).toMatchFileSnapshot('__snapshots__/index.ts.snap')
    })

    it('пустой вход → только warning header', () => {
        const source = renderIndexFile([])
        expect(source).toBe(
            '// ВНИМАНИЕ: файл сгенерирован kubb-plugin-cache-tags. Не редактируйте вручную.\n',
        )
    })
})
