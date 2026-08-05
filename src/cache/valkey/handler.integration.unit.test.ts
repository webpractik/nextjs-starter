import type { CacheEntry } from './types.ts'

import { execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'

import { Valkey } from 'iovalkey'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { createValkeyClient } from './client.ts'
import { createValkeyCacheHandler } from './handler.ts'
import { entryStorageKey } from './keys.ts'

const valkeyUrl = process.env.VALKEY_TEST_URL
const valkeyContainer = process.env.VALKEY_TEST_CONTAINER
const describeIntegration = valkeyUrl ? describe : describe.skip
const namespace = `integration:${randomUUID()}:v1`
const clients = valkeyUrl ? [createValkeyClient(valkeyUrl), createValkeyClient(valkeyUrl)] : []
function createAdminClient() {
    if (!valkeyUrl) return undefined

    const client = new Valkey(valkeyUrl, {
        commandTimeout: 750,
        connectTimeout: 500,
        enableOfflineQueue: true,
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        retryStrategy(attempt) {
            return Math.min(attempt * 100, 500)
        },
    })
    client.on('error', () => {})

    return client
}

let admin = createAdminClient()

function entry(value: string, timestamp: number, tags = ['shared-tag']): CacheEntry {
    return {
        tags,
        stale: 1,
        timestamp,
        expire: 60,
        revalidate: 30,
        value: new ReadableStream<Uint8Array>({
            start(controller) {
                controller.enqueue(new TextEncoder().encode(value))
                controller.close()
            },
        }),
    }
}

function handler(clientIndex: number, now: () => number) {
    const client = clients[clientIndex]
    if (!client) throw new Error('Valkey integration client is unavailable')

    return createValkeyCacheHandler({
        client,
        namespace,
        maxEntryBytes: 1_024,
        maxTtlSeconds: 60,
        now,
    })
}

async function cleanupNamespace() {
    if (admin?.status === 'end') admin = createAdminClient()
    if (!admin) return
    if (admin.status === 'wait') await admin.connect()

    let cursor = '0'
    do {
        const [nextCursor, keys] = await admin.scan(cursor, 'MATCH', `${namespace}:*`, 'COUNT', 100)
        cursor = nextCursor
        if (keys.length) await admin.del(...keys)
    } while (cursor !== '0')
}

async function waitForValkey() {
    if (!valkeyContainer) return

    const deadline = Date.now() + 10_000
    while (Date.now() < deadline) {
        try {
            const response = execFileSync(
                'docker',
                ['exec', valkeyContainer, 'valkey-cli', 'ping'],
                { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
            )
            if (response.trim() === 'PONG') {
                await new Promise((resolve) => setTimeout(resolve, 500))
                admin?.disconnect()
                admin = createAdminClient()
                return
            }
        } catch {
            await new Promise((resolve) => setTimeout(resolve, 100))
        }
    }

    throw new Error('Valkey did not recover after container restart')
}

describeIntegration('valkey cache handler integration', () => {
    beforeAll(cleanupNamespace)

    afterAll(async () => {
        await cleanupNamespace()
        for (const client of clients) client.disconnect?.()
        admin?.disconnect()
    })

    it('shares entries and immediate invalidation between independent clients', async () => {
        let now = 2_000
        const first = handler(0, () => now)
        const second = handler(1, () => now)
        await first.set('shared-key', Promise.resolve(entry('replica-one', 1_000)))

        expect(await second.get('shared-key', [])).toBeDefined()
        await second.updateTags(['shared-tag'])
        now = 2_001
        expect(await first.get('shared-key', [])).toBeUndefined()
    })

    it('shares profiled and soft-tag invalidation between independent clients', async () => {
        let now = 10_000
        const first = handler(0, () => now)
        const second = handler(1, () => now)
        await first.set('profiled', Promise.resolve(entry('value', 9_000)))
        await second.updateTags(['shared-tag'], { expire: 5 })
        expect((await first.get('profiled', []))?.revalidate).toBe(-1)

        now = 15_000
        expect(await first.get('profiled', [])).toBeUndefined()

        now = 20_000
        await first.set('soft', Promise.resolve(entry('value', 19_000, [])))
        await second.updateTags(['path:soft'])
        now = 20_001
        expect(await first.get('soft', ['path:soft'])).toBeUndefined()
    })

    it('removes a corrupt entry without flushing unrelated keys', async () => {
        if (!admin) throw new Error('Valkey integration admin is unavailable')
        const corruptKey = entryStorageKey(namespace, 'corrupt')
        await admin.set(corruptKey, 'invalid', 'EX', 60)
        await admin.set('unrelated:key', 'preserve-me', 'EX', 60)

        expect(await handler(0, Date.now).get('corrupt', [])).toBeUndefined()
        expect(await admin.get(corruptKey)).toBeNull()
        expect(await admin.get('unrelated:key')).toBe('preserve-me')
        await admin.del('unrelated:key')
    })

    it('degrades during outage and reconnects to a shared cold cache', async () => {
        if (!valkeyContainer) throw new Error('Valkey integration container is unavailable')
        const first = handler(0, Date.now)
        const second = handler(1, Date.now)
        await first.set('before-restart', Promise.resolve(entry('old', Date.now())))

        admin?.disconnect()
        execFileSync('docker', ['pause', valkeyContainer], { stdio: 'ignore' })
        try {
            await expect(second.get('before-restart', [])).resolves.toBeUndefined()
            await expect(
                first.set('outage-write', Promise.resolve(entry('dropped', Date.now()))),
            ).resolves.toBeUndefined()
            await expect(first.updateTags(['shared-tag'])).rejects.toThrow()
        } finally {
            execFileSync('docker', ['unpause', valkeyContainer], { stdio: 'ignore' })
        }

        await waitForValkey()
        await admin?.flushdb()
        await expect(second.get('before-restart', [])).resolves.toBeUndefined()
        await first.set('after-restart', Promise.resolve(entry('new', Date.now())))
        expect(await admin?.getBuffer(entryStorageKey(namespace, 'after-restart'))).not.toBeNull()
        await expect(second.get('after-restart', [])).resolves.toBeDefined()
    }, 20_000)
})
