import { hostname } from 'node:os'

import { cacheLife, cacheTag, revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'

import { assertSharedCacheAvailable } from '#/cache/valkey/availability'
import { serverEnvironment } from '#/env/server'

import { canAccessCacheProbe, isValidProbeKey } from './_lib/access'

function probeTag(key: string) {
    return `cache-probe:${key}`
}

async function generateProbeValue(key: string) {
    'use cache'

    cacheLife({ stale: 1, revalidate: 300, expire: 600 })
    cacheTag(probeTag(key))

    return {
        generatedAt: new Date().toISOString(),
        generatedBy: hostname(),
    }
}

function notFoundResponse() {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
}

function isAuthorized(request: Request) {
    return canAccessCacheProbe({
        enabled: serverEnvironment.CACHE_PROBE_ENABLED,
        isCi: serverEnvironment.CI,
        appEnvironment: serverEnvironment.APP_ENV,
        configuredToken: serverEnvironment.CACHE_PROBE_TOKEN,
        suppliedToken: request.headers.get('x-cache-probe-token'),
    })
}

export async function GET(request: Request) {
    const key = new URL(request.url).searchParams.get('key')
    if (!isAuthorized(request) || !isValidProbeKey(key)) return notFoundResponse()

    return NextResponse.json({
        ...(await generateProbeValue(key)),
        servedBy: hostname(),
    })
}

export async function POST(request: Request) {
    const key = new URL(request.url).searchParams.get('key')
    if (!isAuthorized(request) || !isValidProbeKey(key)) return notFoundResponse()

    try {
        await assertSharedCacheAvailable()
        revalidateTag(probeTag(key), { expire: 0 })
    } catch {
        return NextResponse.json({ invalidated: false }, { status: 503 })
    }

    return NextResponse.json({ invalidated: true, servedBy: hostname() })
}
