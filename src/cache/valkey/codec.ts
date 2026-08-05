import type { CacheEntry } from './types.ts'

const codecVersion = 1
const metadataLengthBytes = 4

interface CacheEntryMetadata {
    version: typeof codecVersion
    tags: string[]
    stale: number
    timestamp: number
    expire: number
    revalidate: number
}

export class CacheCodecError extends Error {}

export class CacheEntryTooLargeError extends CacheCodecError {}

function isFiniteNonNegativeNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value) && value >= 0
}

function isCacheEntryMetadata(value: unknown): value is CacheEntryMetadata {
    if (!value || typeof value !== 'object') return false

    const metadata = value as Partial<CacheEntryMetadata>

    return (
        metadata.version === codecVersion &&
        Array.isArray(metadata.tags) &&
        metadata.tags.every((tag) => typeof tag === 'string') &&
        isFiniteNonNegativeNumber(metadata.stale) &&
        isFiniteNonNegativeNumber(metadata.timestamp) &&
        isFiniteNonNegativeNumber(metadata.expire) &&
        isFiniteNonNegativeNumber(metadata.revalidate)
    )
}

async function readStream(stream: ReadableStream<Uint8Array>, maxBytes: number) {
    const chunks: Buffer[] = []
    const reader = stream.getReader()
    let size = 0

    try {
        while (true) {
            const chunk = await reader.read()

            if (chunk.done) break

            size += chunk.value.byteLength
            if (size > maxBytes) {
                await reader.cancel()
                throw new CacheEntryTooLargeError('Cache entry exceeds the configured size limit')
            }

            chunks.push(Buffer.from(chunk.value))
        }
    } finally {
        reader.releaseLock()
    }

    return Buffer.concat(chunks, size)
}

export async function encodeCacheEntry(entry: CacheEntry, maxBytes: number) {
    const body = await readStream(entry.value, maxBytes)
    const metadata = Buffer.from(
        JSON.stringify({
            version: codecVersion,
            tags: entry.tags,
            stale: entry.stale,
            timestamp: entry.timestamp,
            expire: entry.expire,
            revalidate: entry.revalidate,
        } satisfies CacheEntryMetadata),
    )
    const totalLength = metadataLengthBytes + metadata.byteLength + body.byteLength

    if (totalLength > maxBytes) {
        throw new CacheEntryTooLargeError('Cache entry exceeds the configured size limit')
    }

    const header = Buffer.allocUnsafe(metadataLengthBytes)
    header.writeUInt32BE(metadata.byteLength)

    return Buffer.concat([header, metadata, body], totalLength)
}

export function decodeCacheEntry(value: Buffer): CacheEntry {
    if (value.byteLength < metadataLengthBytes) {
        throw new CacheCodecError('Cache entry header is truncated')
    }

    const metadataLength = value.readUInt32BE(0)
    const bodyOffset = metadataLengthBytes + metadataLength
    if (metadataLength === 0 || bodyOffset > value.byteLength) {
        throw new CacheCodecError('Cache entry metadata is truncated')
    }

    let metadata: unknown
    try {
        metadata = JSON.parse(value.subarray(metadataLengthBytes, bodyOffset).toString('utf8'))
    } catch {
        throw new CacheCodecError('Cache entry metadata is not valid JSON')
    }

    if (!isCacheEntryMetadata(metadata)) {
        throw new CacheCodecError('Cache entry metadata is invalid')
    }

    const body = new Uint8Array(value.subarray(bodyOffset))

    return {
        tags: metadata.tags,
        stale: metadata.stale,
        timestamp: metadata.timestamp,
        expire: metadata.expire,
        revalidate: metadata.revalidate,
        value: new ReadableStream<Uint8Array>({
            start(controller) {
                controller.enqueue(body)
                controller.close()
            },
        }),
    }
}
