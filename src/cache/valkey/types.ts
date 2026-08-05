export interface CacheEntry {
    value: ReadableStream<Uint8Array>
    tags: string[]
    stale: number
    timestamp: number
    expire: number
    revalidate: number
}

export interface CacheHandler {
    get: (_cacheKey: string, _softTags: string[]) => Promise<CacheEntry | undefined>
    set: (_cacheKey: string, _pendingEntry: Promise<CacheEntry>) => Promise<void>
    refreshTags: () => Promise<void>
    getExpiration: (_tags: string[]) => Promise<number>
    updateTags: (_tags: string[], _durations?: { expire?: number }) => Promise<void>
}

export interface ValkeyTransaction {
    set: (_key: string, _value: string, _mode: 'EX', _ttlSeconds: number) => ValkeyTransaction
    exec: () => Promise<Array<[Error | null, unknown]> | null>
}

export interface ValkeyStorageClient {
    getBuffer: (_key: string) => Promise<Buffer | null>
    mget: (..._keys: string[]) => Promise<Array<string | null>>
    set: (_key: string, _value: Buffer, _mode: 'EX', _ttlSeconds: number) => Promise<unknown>
    del: (..._keys: string[]) => Promise<number>
    multi: () => ValkeyTransaction
    disconnect?: () => void
}

export interface ValkeyCacheHandlerOptions {
    client: ValkeyStorageClient
    namespace: string
    maxEntryBytes: number
    maxTtlSeconds: number
    now?: () => number
    buildPhase?: boolean
}
