import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { build } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { pluginCacheTags } from './index'

const fixturePath = path.resolve(__dirname, '__fixtures__/petstore.yaml')

let outputRoot: string

beforeEach(async () => {
    outputRoot = await mkdtemp(path.join(tmpdir(), 'kubb-cache-tags-'))
})

afterEach(async () => {
    await rm(outputRoot, { recursive: true, force: true })
})

async function runKubb() {
    await build({
        config: {
            root: outputRoot,
            input: { path: fixturePath },
            output: { path: '.', clean: true },
            plugins: [
                pluginOas({ output: { path: 'swagger' }, validate: false }),
                pluginCacheTags({ output: { path: './tags' } }),
            ],
        },
    })
}

describe('pluginCacheTags (integration)', () => {
    it('генерирует файл на тег + barrel', async () => {
        await runKubb()

        const products = await readFile(path.join(outputRoot, 'tags/products.ts'), 'utf-8')
        expect(products).toContain(`export const productsTag = 'products' as const`)
        expect(products).toContain(`export function productTag(`)
        expect(products).toContain(`export async function revalidateProducts()`)
        expect(products).toContain(`export async function revalidateProduct(`)

        const orders = await readFile(path.join(outputRoot, 'tags/orders.ts'), 'utf-8')
        expect(orders).toContain(`export const ordersTag = 'orders' as const`)
        expect(orders).toContain(`{ orderId: number }`)

        const index = await readFile(path.join(outputRoot, 'tags/index.ts'), 'utf-8')
        expect(index).toContain(`export * as orders from './orders'`)
        expect(index).toContain(`export * as products from './products'`)
    })

    it('идемпотентен при повторном запуске', async () => {
        await runKubb()
        const first = await readFile(path.join(outputRoot, 'tags/products.ts'), 'utf-8')
        await runKubb()
        const second = await readFile(path.join(outputRoot, 'tags/products.ts'), 'utf-8')
        expect(second).toBe(first)
    })
})
