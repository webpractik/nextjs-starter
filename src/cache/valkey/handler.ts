import type {
    CacheEntry,
    CacheHandler,
    ValkeyCacheHandlerOptions,
    ValkeyStorageClient,
} from './types.ts'

import {
    cacheInvalidationsTotal,
    cacheOperationDurationSeconds,
    cacheOperationsTotal,
} from '../../observability/metrics.ts'
import { getSingletonValkeyClient } from './client.ts'
import {
    CacheCodecError,
    CacheEntryTooLargeError,
    decodeCacheEntry,
    encodeCacheEntry,
} from './codec.ts'
import { entryStorageKey, tagStorageKey } from './keys.ts'

interface TagMarker {
    version: 1
    staleAt?: number
    expiredAt?: number
}

const tagMarkerSafetyMarginSeconds = 300

function recordOperation(operation: 'get' | 'set', outcome: string, startedAt: number) {
    cacheOperationsTotal.inc({ operation, outcome })
    cacheOperationDurationSeconds.observe({ operation }, (performance.now() - startedAt) / 1000)
}

function parseTagMarker(value: string | null): TagMarker | undefined {
    if (value === null) return undefined

    let marker: unknown
    try {
        marker = JSON.parse(value)
    } catch {
        throw new CacheCodecError('Tag marker is not valid JSON')
    }

    if (!marker || typeof marker !== 'object') {
        throw new CacheCodecError('Tag marker is invalid')
    }

    const candidate = marker as Partial<TagMarker>
    const validTimestamp = (timestamp: unknown) =>
        timestamp === undefined ||
        (typeof timestamp === 'number' && Number.isFinite(timestamp) && timestamp >= 0)

    if (
        candidate.version !== 1 ||
        !validTimestamp(candidate.staleAt) ||
        !validTimestamp(candidate.expiredAt)
    ) {
        throw new CacheCodecError('Tag marker is invalid')
    }

    return candidate as TagMarker
}

function storageTtl(entry: CacheEntry, maxTtlSeconds: number) {
    return Math.max(1, Math.min(Math.ceil(entry.expire), maxTtlSeconds))
}

async function deleteBestEffort(client: ValkeyStorageClient, key: string) {
    try {
        await client.del(key)
    } catch {
        // The original cache read/decode outcome remains authoritative.
    }
}

export function createValkeyCacheHandler(options: ValkeyCacheHandlerOptions): CacheHandler {
    const pendingSets = new Map<string, Promise<void>>()
    const now = options.now ?? Date.now

    return {
        async get(cacheKey, softTags) {
            const startedAt = performance.now()
            if (options.buildPhase) {
                recordOperation('get', 'build_miss', startedAt)
                return undefined
            }

            const pendingSet = pendingSets.get(cacheKey)
            if (pendingSet) await pendingSet

            const storageKey = entryStorageKey(options.namespace, cacheKey)

            try {
                const storedEntry = await options.client.getBuffer(storageKey)
                if (storedEntry === null) {
                    recordOperation('get', 'miss', startedAt)
                    return undefined
                }

                const entry = decodeCacheEntry(storedEntry)
                const currentTimestamp = now()
                if (currentTimestamp >= entry.timestamp + entry.expire * 1000) {
                    await deleteBestEffort(options.client, storageKey)
                    recordOperation('get', 'expired', startedAt)
                    return undefined
                }

                const tags = [...new Set([...entry.tags, ...softTags])]
                const markerValues = tags.length
                    ? await options.client.mget(
                          ...tags.map((tag) => tagStorageKey(options.namespace, tag)),
                      )
                    : []
                let isStale = false

                for (const value of markerValues) {
                    const marker = parseTagMarker(value)
                    if (!marker) continue
                    const invalidatedAt = marker.staleAt ?? marker.expiredAt
                    const affectsEntry =
                        invalidatedAt !== undefined && entry.timestamp < invalidatedAt

                    if (
                        affectsEntry &&
                        marker.expiredAt !== undefined &&
                        (marker.staleAt === undefined || currentTimestamp >= marker.expiredAt)
                    ) {
                        recordOperation('get', 'tag_expired', startedAt)
                        return undefined
                    }

                    if (
                        affectsEntry &&
                        marker.staleAt !== undefined &&
                        currentTimestamp >= marker.staleAt
                    ) {
                        isStale = true
                    }
                }

                recordOperation('get', isStale ? 'stale' : 'hit', startedAt)
                return isStale ? { ...entry, revalidate: -1 } : entry
            } catch (error) {
                if (error instanceof CacheCodecError) {
                    await deleteBestEffort(options.client, storageKey)
                    recordOperation('get', 'decode_error', startedAt)
                } else {
                    recordOperation('get', 'backend_error', startedAt)
                }

                return undefined
            }
        },
        async set(cacheKey, pendingEntry) {
            const startedAt = performance.now()
            if (options.buildPhase) {
                await pendingEntry
                recordOperation('set', 'build_skip', startedAt)
                return
            }

            const operation = (async () => {
                try {
                    const entry = await pendingEntry
                    const encoded = await encodeCacheEntry(entry, options.maxEntryBytes)
                    await options.client.set(
                        entryStorageKey(options.namespace, cacheKey),
                        encoded,
                        'EX',
                        storageTtl(entry, options.maxTtlSeconds),
                    )
                    recordOperation('set', 'written', startedAt)
                } catch (error) {
                    recordOperation(
                        'set',
                        error instanceof CacheEntryTooLargeError ? 'oversize' : 'error',
                        startedAt,
                    )
                }
            })()

            pendingSets.set(cacheKey, operation)
            try {
                await operation
            } finally {
                if (pendingSets.get(cacheKey) === operation) pendingSets.delete(cacheKey)
            }
        },
        async refreshTags() {},
        async getExpiration() {
            return Infinity
        },
        async updateTags(tags, durations) {
            if (options.buildPhase || tags.length === 0) return

            const currentTimestamp = now()
            const mode = durations ? 'profiled' : 'immediate'
            const marker: TagMarker = durations
                ? {
                      version: 1,
                      staleAt: currentTimestamp,
                      expiredAt:
                          durations.expire === undefined
                              ? undefined
                              : currentTimestamp + durations.expire * 1000,
                  }
                : { version: 1, expiredAt: currentTimestamp }
            const markerTtl = options.maxTtlSeconds + tagMarkerSafetyMarginSeconds
            const transaction = options.client.multi()

            for (const tag of tags) {
                transaction.set(
                    tagStorageKey(options.namespace, tag),
                    JSON.stringify(marker),
                    'EX',
                    markerTtl,
                )
            }

            try {
                const results = await transaction.exec()
                if (!results || results.some(([error]) => error !== null)) {
                    throw new Error('Shared cache invalidation transaction failed')
                }
                cacheInvalidationsTotal.inc({ mode, outcome: 'success' })
            } catch (error) {
                cacheInvalidationsTotal.inc({ mode, outcome: 'error' })
                throw error
            }
        },
    }
}

const buildPhase =
    process.env.NEXTJS_STARTER_CACHE_BUILD === 'true' ||
    process.env.NEXT_PHASE === 'phase-production-build'
const defaultClient = getSingletonValkeyClient(process.env.VALKEY_URL ?? 'redis://127.0.0.1:6379')

const handler = createValkeyCacheHandler({
    buildPhase,
    client: defaultClient,
    namespace: process.env.VALKEY_CACHE_NAMESPACE ?? 'nextjs-starter:build:v1',
    maxEntryBytes: Number(process.env.VALKEY_CACHE_MAX_ENTRY_BYTES ?? 1_048_576),
    maxTtlSeconds: Number(process.env.VALKEY_CACHE_MAX_TTL_SECONDS ?? 86_400),
})

export default handler
