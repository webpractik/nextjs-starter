import type { NextConfig } from 'next'

import { withSentryConfig } from '@sentry/nextjs'
import { nanoid } from 'nanoid'

import { isDev, isProd } from '#/constants/env'
import { clientEnvironment } from '#/env/client'
import { serverEnvironment } from '#/env/server'
import { headers } from '~/headers'

const nextConfig: NextConfig = {
    output: 'standalone',
    reactStrictMode: true,
    reactCompiler: isProd,
    cacheComponents: false,
    typedRoutes: true,
    reactProductionProfiling: false,
    poweredByHeader: false,
    cleanDistDir: true,
    turbopack: {},
    allowedDevOrigins: ['localhost', process.env.NEXT_PUBLIC_FRONT_URL as string],
    experimental: {
        serverSourceMaps: true,
        optimizePackageImports: ['react-use', 'lodash-es', 'lucide-react'],
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
        ? { browserToTerminal: true, serverFunctions: true, fetches: { fullUrl: true } }
        : false,
}

function withSentry() {
    if (process.env.NEXT_PUBLIC_SENTRY_DSN && process.env.NEXT_PUBLIC_SENTRY_DSN?.length > 0) {
        return withSentryConfig(nextConfig, {
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

    return nextConfig
}

export default isProd ? withSentry() : nextConfig
