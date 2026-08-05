import { getSingletonValkeyClient } from './client.ts'

export async function assertSharedCacheAvailable() {
    const client = getSingletonValkeyClient(process.env.VALKEY_URL ?? 'redis://127.0.0.1:6379')
    const namespace = process.env.VALKEY_CACHE_NAMESPACE ?? 'nextjs-starter:build:v1'

    await client.getBuffer(`${namespace}:probe:availability`)
}
