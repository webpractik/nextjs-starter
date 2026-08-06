import { access, mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { generateCacheTags } from './cache-tags'
import { readContractBundle } from './contract'

const fixturePath = fileURLToPath(new URL('./__fixtures__/cache-tags.yaml', import.meta.url))

let temporaryRoot: string
let outputDirectory: string

beforeEach(async () => {
    temporaryRoot = await mkdtemp(path.join(tmpdir(), 'hey-api-cache-tags-'))
    outputDirectory = path.join(temporaryRoot, 'output', 'cache-tags')
})

afterEach(async () => {
    await rm(temporaryRoot, { force: true, recursive: true })
})

async function runGenerator() {
    await generateCacheTags(await readContractBundle(fixturePath), outputDirectory)
}

describe('интеграция генератора cache tags', () => {
    it('генерирует отдельный файл для каждого тега и общий barrel', async () => {
        await runGenerator()

        const products = await readFile(path.join(outputDirectory, 'products.ts'), 'utf8')
        expect(products).toContain("export const productsTag = 'products' as const")
        expect(products).toContain('export function productTag(')
        expect(products).toContain('export async function revalidateProducts()')
        expect(products).toContain('export async function revalidateProduct(')

        const orders = await readFile(path.join(outputDirectory, 'orders.ts'), 'utf8')
        expect(orders).toContain("export const ordersTag = 'orders' as const")
        expect(orders).toContain('{ orderId: number }')

        const index = await readFile(path.join(outputDirectory, 'index.ts'), 'utf8')
        expect(index).toContain("export * as orders from './orders'")
        expect(index).toContain("export * as products from './products'")
    })

    it('повторный запуск генерирует байт-в-байт те же файлы', async () => {
        await runGenerator()
        const first = await readFile(path.join(outputDirectory, 'products.ts'), 'utf8')
        await runGenerator()
        const second = await readFile(path.join(outputDirectory, 'products.ts'), 'utf8')

        expect(second).toBe(first)
    })

    it('не создаёт артефакты за пределами заданного output root', async () => {
        await runGenerator()

        await expect(access(path.join(temporaryRoot, 'cache-tags'))).rejects.toMatchObject({
            code: 'ENOENT',
        })
    })
})
