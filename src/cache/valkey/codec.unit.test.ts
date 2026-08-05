import type { CacheEntry } from './types.ts'

import { describe, expect, it } from 'vitest'

import {
    CacheCodecError,
    CacheEntryTooLargeError,
    decodeCacheEntry,
    encodeCacheEntry,
} from './codec.ts'

function stream(...chunks: Array<string | Uint8Array>) {
    return new ReadableStream<Uint8Array>({
        start(controller) {
            for (const chunk of chunks) {
                controller.enqueue(
                    typeof chunk === 'string' ? new TextEncoder().encode(chunk) : chunk,
                )
            }
            controller.close()
        },
    })
}

async function streamText(value: ReadableStream<Uint8Array>) {
    const chunks: Uint8Array[] = []
    for await (const chunk of value) chunks.push(chunk)

    return new TextDecoder().decode(Buffer.concat(chunks))
}

function entry(value: ReadableStream<Uint8Array>): CacheEntry {
    return {
        value,
        tags: ['pets', 'tenant:demo'],
        stale: 30,
        timestamp: 1_000,
        expire: 120,
        revalidate: 60,
    }
}

describe('valkey cache entry codec', () => {
    it('round-trips metadata and a multi-chunk raw stream', async () => {
        const decoded = decodeCacheEntry(
            await encodeCacheEntry(entry(stream('hello', ' ', 'world')), 512),
        )

        expect({ ...decoded, value: undefined }).toEqual({
            value: undefined,
            tags: ['pets', 'tenant:demo'],
            stale: 30,
            timestamp: 1_000,
            expire: 120,
            revalidate: 60,
        })
        await expect(streamText(decoded.value)).resolves.toBe('hello world')
    })

    it('rejects an entry when the complete envelope exceeds the limit', async () => {
        await expect(encodeCacheEntry(entry(stream('x'.repeat(100))), 32)).rejects.toBeInstanceOf(
            CacheEntryTooLargeError,
        )
    })

    it('does not return partial data when the source stream errors', async () => {
        const failingStream = new ReadableStream<Uint8Array>({
            start(controller) {
                controller.enqueue(new TextEncoder().encode('partial'))
                controller.error(new Error('stream failed'))
            },
        })

        await expect(encodeCacheEntry(entry(failingStream), 512)).rejects.toThrow('stream failed')
    })

    it.each([
        Buffer.alloc(3),
        Buffer.from([0, 0, 0, 10, 123]),
        Buffer.concat([Buffer.from([0, 0, 0, 2]), Buffer.from('{}')]),
    ])('rejects a truncated or invalid envelope', (value) => {
        expect(() => decodeCacheEntry(value)).toThrow(CacheCodecError)
    })

    it('rejects an unknown codec version', () => {
        const metadata = Buffer.from(
            JSON.stringify({
                version: 2,
                tags: [],
                stale: 1,
                timestamp: 1,
                expire: 2,
                revalidate: 1,
            }),
        )
        const header = Buffer.alloc(4)
        header.writeUInt32BE(metadata.byteLength)

        expect(() => decodeCacheEntry(Buffer.concat([header, metadata]))).toThrow(CacheCodecError)
    })
})
