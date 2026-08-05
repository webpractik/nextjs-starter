import type { CacheEntry, ValkeyStorageClient, ValkeyTransaction } from './types.ts'

import { describe, expect, it, vi } from 'vitest'

import { createValkeyCacheHandler } from './handler.ts'
import { entryStorageKey } from './keys.ts'

interface FakeClient extends ValkeyStorageClient {
    entries: Map<string, Buffer | string>
    setTtls: number[]
    failReads: boolean
    failWrites: boolean
    failInvalidation: boolean
}

function fakeClient(): FakeClient {
    const entries = new Map<string, Buffer | string>()
    const client: FakeClient = {
        entries,
        setTtls: [],
        failReads: false,
        failWrites: false,
        failInvalidation: false,
        async getBuffer(key) {
            if (client.failReads) throw new Error('backend read failed')
            const value = entries.get(key)
            return Buffer.isBuffer(value) ? value : null
        },
        async mget(...keys) {
            if (client.failReads) throw new Error('backend read failed')
            return keys.map((key) => {
                const value = entries.get(key)
                return typeof value === 'string' ? value : null
            })
        },
        async set(key, value, _mode, ttlSeconds) {
            if (client.failWrites) throw new Error('backend write failed')
            entries.set(key, value)
            client.setTtls.push(ttlSeconds)
        },
        async del(...keys) {
            let deleted = 0
            for (const key of keys) deleted += Number(entries.delete(key))
            return deleted
        },
        multi() {
            const writes: Array<[string, string]> = []
            const transaction: ValkeyTransaction = {
                set(key, value) {
                    writes.push([key, value])
                    return transaction
                },
                async exec() {
                    if (client.failInvalidation) throw new Error('transaction failed')
                    for (const [key, value] of writes) entries.set(key, value)
                    return writes.map(() => [null, 'OK'])
                },
            }
            return transaction
        },
    }

    return client
}

function stream(text: string) {
    return new ReadableStream<Uint8Array>({
        start(controller) {
            controller.enqueue(new TextEncoder().encode(text))
            controller.close()
        },
    })
}

function cacheEntry(text: string, overrides: Partial<CacheEntry> = {}): CacheEntry {
    return {
        value: stream(text),
        tags: ['shared-tag'],
        stale: 30,
        timestamp: 1_000,
        expire: 120,
        revalidate: 60,
        ...overrides,
    }
}

async function readText(entry: CacheEntry | undefined) {
    if (!entry) return undefined

    const chunks: Uint8Array[] = []
    for await (const chunk of entry.value) chunks.push(chunk)
    return new TextDecoder().decode(Buffer.concat(chunks))
}

function createHandler(client: FakeClient, now: () => number = () => 2_000) {
    return createValkeyCacheHandler({
        client,
        namespace: 'tests:v1',
        maxEntryBytes: 1_024,
        maxTtlSeconds: 90,
        now,
    })
}

describe('valkey cache handler', () => {
    it('waits for a local pending set before reading the same key', async () => {
        const client = fakeClient()
        const handler = createHandler(client)
        let resolveEntry: ((_entry: CacheEntry) => void) | undefined
        const pendingEntry = new Promise<CacheEntry>((resolve) => {
            resolveEntry = resolve
        })

        const setPromise = handler.set('key', pendingEntry)
        const getPromise = handler.get('key', [])
        const state = vi.fn()
        void getPromise.then(state)
        await Promise.resolve()
        expect(state).not.toHaveBeenCalled()

        resolveEntry?.(cacheEntry('complete'))
        await setPromise
        await expect(readText(await getPromise)).resolves.toBe('complete')
    })

    it('caps the physical TTL without changing entry metadata', async () => {
        const client = fakeClient()
        const handler = createHandler(client)

        await handler.set('key', Promise.resolve(cacheEntry('value', { expire: 300 })))

        expect(client.setTtls).toEqual([90])
        expect((await handler.get('key', []))?.expire).toBe(300)
    })

    it('returns fresh, time-stale and expired entries with Next.js semantics', async () => {
        const client = fakeClient()
        let now = 30_000
        const handler = createHandler(client, () => now)
        await handler.set(
            'key',
            Promise.resolve(cacheEntry('value', { timestamp: 0, revalidate: 60, expire: 120 })),
        )

        expect((await handler.get('key', []))?.revalidate).toBe(60)
        now = 90_000
        expect((await handler.get('key', []))?.revalidate).toBe(60)
        now = 120_000
        expect(await handler.get('key', [])).toBeUndefined()
    })

    it('shares immediate, profiled and soft-tag invalidation state', async () => {
        const client = fakeClient()
        let now = 2_000
        const writer = createHandler(client, () => now)
        const reader = createHandler(client, () => now)
        await writer.set('explicit', Promise.resolve(cacheEntry('old', { timestamp: 1_000 })))
        await writer.updateTags(['shared-tag'])
        expect(await reader.get('explicit', [])).toBeUndefined()

        now = 5_000
        await writer.set('profiled', Promise.resolve(cacheEntry('stale', { timestamp: 4_000 })))
        await writer.updateTags(['shared-tag'], { expire: 10 })
        expect((await reader.get('profiled', []))?.revalidate).toBe(-1)
        now = 15_000
        expect(await reader.get('profiled', [])).toBeUndefined()

        now = 20_000
        await writer.set(
            'soft',
            Promise.resolve(cacheEntry('soft', { timestamp: 19_000, tags: [] })),
        )
        await writer.updateTags(['path-tag'])
        expect(await reader.get('soft', ['path-tag'])).toBeUndefined()
    })

    it('degrades read and write failures to misses while surfacing invalidation failures', async () => {
        const client = fakeClient()
        const handler = createHandler(client)
        client.failWrites = true
        await expect(
            handler.set('key', Promise.resolve(cacheEntry('value'))),
        ).resolves.toBeUndefined()

        client.failWrites = false
        await handler.set('key', Promise.resolve(cacheEntry('value')))
        client.failReads = true
        await expect(handler.get('key', [])).resolves.toBeUndefined()

        client.failReads = false
        client.failInvalidation = true
        await expect(handler.updateTags(['shared-tag'])).rejects.toThrow('transaction failed')
    })

    it('deletes corrupt values and skips oversize writes', async () => {
        const client = fakeClient()
        const handler = createValkeyCacheHandler({
            client,
            namespace: 'tests:v1',
            maxEntryBytes: 32,
            maxTtlSeconds: 90,
            now: () => 2_000,
        })
        const corruptKey = entryStorageKey('tests:v1', 'corrupt')
        client.entries.set(corruptKey, Buffer.from('invalid'))

        await expect(handler.get('corrupt', [])).resolves.toBeUndefined()
        expect(client.entries.has(corruptKey)).toBe(false)

        await expect(
            handler.set('oversize', Promise.resolve(cacheEntry('x'.repeat(100)))),
        ).resolves.toBeUndefined()
        expect(client.entries.size).toBe(0)
    })
})
