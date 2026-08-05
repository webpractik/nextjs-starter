import type { NextConfig } from 'next'

import { fileURLToPath } from 'node:url'

import { withSentryConfig } from '@sentry/nextjs'
import { nanoid } from 'nanoid'
import { PHASE_PRODUCTION_BUILD } from 'next/constants'

import { isDev, isProd } from '#/constants/env'
import { clientEnvironment } from '#/env/client'
import { serverEnvironment } from '#/env/server'
import { headers } from '~/headers'

const frontendDevHostname = new URL(clientEnvironment.NEXT_PUBLIC_FRONT_URL).hostname
const valkeyCacheHandlerPath = fileURLToPath(
    new URL('./src/cache/valkey-handler.mjs', import.meta.url),
)

const nextConfig: NextConfig = {
    output: 'standalone',
    reactStrictMode: true,
    reactCompiler: isProd,
    cacheComponents: true,
    cacheHandlers: {
        default: valkeyCacheHandlerPath,
    },
    typedRoutes: true,
    reactProductionProfiling: false,
    poweredByHeader: false,
    cleanDistDir: true,
    turbopack: {},
    allowedDevOrigins: ['localhost', frontendDevHostname],
    experimental: {
        serverSourceMaps: true,
        optimizePackageImports: ['react-use', 'lodash-es', 'lucide-react'],
        useTypeScriptCli: true,
    },
    generateBuildId: () => `${nanoid()}-${new Date().toISOString()}`,
    devIndicators: {
        position: 'top-right',
    },
    images: {
        disableStaticImages: true,
        dangerouslyAllowSVG: true,
    },
    async rewrites() {
        if (!isDev) {
            return []
        }

        if (!clientEnvironment.NEXT_PUBLIC_BFF_PATH || !serverEnvironment.BACK_INTERNAL_URL) {
            throw new Error('Missing bff envs')
        }

        return {
            beforeFiles: [
                {
                    source: `${clientEnvironment.NEXT_PUBLIC_BFF_PATH}/:path*`,
                    destination: `${serverEnvironment.BACK_INTERNAL_URL}/:path*`,
                },
            ],
        }
    },
    headers,
    logging: isDev
        ? { browserToTerminal: false, serverFunctions: true, fetches: { fullUrl: true } }
        : false,
}

function withSentry(config: NextConfig) {
    if (process.env.NEXT_PUBLIC_SENTRY_DSN && process.env.NEXT_PUBLIC_SENTRY_DSN?.length > 0) {
        return withSentryConfig(config, {
            org: process.env.SENTRY_ORG,
            project: process.env.APP_NAME,
            authToken: process.env.SENTRY_AUTH_TOKEN,
            sentryUrl: process.env.SENTRY_URL,
            silent: true,
            widenClientFileUpload: true,
            sourcemaps: { deleteSourcemapsAfterUpload: true },
            telemetry: false,
            bundleSizeOptimizations: {
                excludeDebugStatements: true,
                excludeReplayShadowDom: true,
                excludeReplayIframe: true,
            },
        })
    }

    return config
}

export default function createNextConfig(phase: string) {
    process.env.NEXTJS_STARTER_CACHE_BUILD = String(phase === PHASE_PRODUCTION_BUILD)

    return isProd ? withSentry(nextConfig) : nextConfig
}
