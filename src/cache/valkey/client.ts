import type { ValkeyStorageClient, ValkeyTransaction } from './types.ts'

import { Valkey } from 'iovalkey'

import logger from '../../observability/logger.ts'

const errorLogIntervalMilliseconds = 30_000
const readyTimeoutMilliseconds = 500
let lastErrorLogTimestamp = 0
let singletonClient: ValkeyStorageClient | undefined

function reportConnectionError() {
    const now = Date.now()
    if (now - lastErrorLogTimestamp < errorLogIntervalMilliseconds) return

    lastErrorLogTimestamp = now
    logger.error('Shared cache backend operation failed')
}

export function createValkeyClient(url: string): ValkeyStorageClient {
    function createClient() {
        const nextClient = new Valkey(url, {
            commandTimeout: 750,
            connectTimeout: 500,
            enableOfflineQueue: false,
            lazyConnect: true,
            maxRetriesPerRequest: 1,
            retryStrategy(attempt) {
                return Math.min(attempt * 100, 1_000)
            },
        })

        nextClient.on('error', reportConnectionError)
        return nextClient
    }

    let client = createClient()

    async function waitUntilReady() {
        const connectingClient = client
        await new Promise<void>((resolve, reject) => {
            let timeout: ReturnType<typeof setTimeout>

            function cleanup() {
                clearTimeout(timeout)
                connectingClient.off('end', onEnd)
                connectingClient.off('ready', onReady)
            }

            function onEnd() {
                cleanup()
                reject(new Error('Shared cache connection ended before becoming ready'))
            }

            function onReady() {
                cleanup()
                resolve()
            }

            timeout = setTimeout(() => {
                cleanup()
                reject(new Error('Shared cache connection did not become ready in time'))
            }, readyTimeoutMilliseconds)

            connectingClient.once('end', onEnd)
            connectingClient.once('ready', onReady)
            if (connectingClient.status === 'ready') onReady()
        })
    }

    async function ensureConnection() {
        if (client.status === 'ready') return
        if (client.status === 'end') client = createClient()
        if (client.status === 'wait') {
            await client.connect()
            return
        }

        await waitUntilReady()
    }

    return {
        async getBuffer(key) {
            await ensureConnection()
            return client.getBuffer(key)
        },
        async mget(...keys) {
            await ensureConnection()
            return client.mget(...keys)
        },
        async set(key, value, mode, ttlSeconds) {
            await ensureConnection()
            return client.set(key, value, mode, ttlSeconds)
        },
        async del(...keys) {
            await ensureConnection()
            return client.del(...keys)
        },
        multi() {
            const writes: Array<[string, string, 'EX', number]> = []
            const transaction: ValkeyTransaction = {
                set(key, value, mode, ttlSeconds) {
                    writes.push([key, value, mode, ttlSeconds])
                    return transaction
                },
                async exec() {
                    await ensureConnection()
                    const valkeyTransaction = client.multi()
                    for (const write of writes) valkeyTransaction.set(...write)

                    return valkeyTransaction.exec() as Promise<Array<
                        [Error | null, unknown]
                    > | null>
                },
            }

            return transaction
        },
        disconnect() {
            client.disconnect()
        },
    }
}

export function getSingletonValkeyClient(url: string) {
    singletonClient ??= createValkeyClient(url)

    return singletonClient
}
