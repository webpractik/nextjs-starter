import type { NextConfig } from 'next'

import { withSentryConfig } from '@sentry/nextjs/config'
import { nanoid } from 'nanoid'

import { isDev, isProd } from '#/constants/env'
import { clientEnvironment } from '#/env/client'
import { serverEnvironment } from '#/env/server'
import { headers } from '~/headers'

const frontendDevHostname = new URL(clientEnvironment.NEXT_PUBLIC_FRONT_URL).hostname

const nextConfig: NextConfig = {
    allowedDevOrigins: ['localhost', frontendDevHostname],
    cacheComponents: true,
    cleanDistDir: true,
    devIndicators: {
        position: 'top-right',
    },
    experimental: {
        optimizePackageImports: ['react-use', 'lodash-es', 'lucide-react'],
        serverSourceMaps: true,
        useTypeScriptCli: true,
    },
    generateBuildId: () => `${nanoid()}-${new Date().toISOString()}`,
    headers,
    images: {
        dangerouslyAllowSVG: true,
        disableStaticImages: true,
    },
    logging: isDev
        ? { browserToTerminal: false, fetches: { fullUrl: true }, serverFunctions: true }
        : false,
    output: 'standalone',
    poweredByHeader: false,
    reactCompiler: isProd,
    reactProductionProfiling: false,
    reactStrictMode: true,
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
                    destination: `${serverEnvironment.BACK_INTERNAL_URL}/:path*`,
                    source: `${clientEnvironment.NEXT_PUBLIC_BFF_PATH}/:path*`,
                },
            ],
        }
    },
    turbopack: {},
    typedRoutes: true,
}

function withSentry() {
    if ((process.env.NEXT_PUBLIC_SENTRY_DSN?.length ?? 0) > 0) {
        return withSentryConfig(nextConfig, {
            authToken: process.env.SENTRY_AUTH_TOKEN,
            bundleSizeOptimizations: {
                excludeDebugStatements: true,
                excludeReplayIframe: true,
                excludeReplayShadowDom: true,
            },
            org: process.env.SENTRY_ORG,
            project: process.env.APP_NAME,
            sentryUrl: process.env.SENTRY_URL,
            silent: true,
            sourcemaps: { deleteSourcemapsAfterUpload: true },
            telemetry: false,
            widenClientFileUpload: true,
        })
    }

    return nextConfig
}

export default isProd ? withSentry() : nextConfig
