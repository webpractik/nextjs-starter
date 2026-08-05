import { createHash, timingSafeEqual } from 'node:crypto'

interface CacheProbeAccessOptions {
    enabled: boolean
    isCi: boolean
    appEnvironment: string
    configuredToken: string | undefined
    suppliedToken: string | null
}

const probeKeyPattern = /^[\w-]{16,64}$/u

function tokenDigest(token: string) {
    return createHash('sha256').update(token).digest()
}

export function isValidProbeKey(key: string | null): key is string {
    return key !== null && probeKeyPattern.test(key)
}

export function canAccessCacheProbe(options: CacheProbeAccessOptions) {
    if (
        !options.enabled ||
        !options.isCi ||
        options.appEnvironment === 'PROD' ||
        !options.configuredToken ||
        !options.suppliedToken
    ) {
        return false
    }

    return timingSafeEqual(tokenDigest(options.configuredToken), tokenDigest(options.suppliedToken))
}
