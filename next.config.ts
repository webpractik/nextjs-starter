import MillionCompiler from '@million/lint';
import { withSentryConfig } from '@sentry/nextjs';
import createJiti from 'jiti';
import { nanoid } from 'nanoid';
import type { NextConfig } from 'next';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';

const jiti = createJiti(import.meta.url);

(async () => {
    try {
        await jiti.import('./env/client', {});
        await jiti.import('./env/server', {});
    } catch {}
})();

const nextConfig: NextConfig = {
    reactStrictMode: true,

    poweredByHeader: false,

    cleanDistDir: true,

    webpack: (config, { isServer, nextRuntime }) => {
        // fix for dom-sanitizer on server-side
        config.externals = [...config.externals, 'jsdom'];

        if (isServer) {
            config.ignoreWarnings = [{ module: /opentelemetry/ }];
        }

        if (process.env.ANALYZE === 'true' && !nextRuntime) {
            config.plugins.push(
                new BundleAnalyzerPlugin({
                    generateStatsFile: true,
                    analyzerMode: 'disabled',
                })
            );
        }

        return config;
    },

    experimental: {
        // ppr: 'incremental',
        webpackBuildWorker: true,
        parallelServerCompiles: true,
        parallelServerBuildTraces: true,
        serverSourceMaps: true,
        webpackMemoryOptimizations: true,
        optimizePackageImports: ['react-use', 'lodash-es', 'lucide-react'],
    },

    generateBuildId: () => `${nanoid()}-${new Date().toISOString()}`,

    devIndicators: {
        buildActivity: true,
        buildActivityPosition: 'top-right',
    },

    images: {
        disableStaticImages: true,
        dangerouslyAllowSVG: true,
        contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    },

    headers: async () => {
        if (process.env.NODE_ENV !== 'production') {
            return [];
        }

        return [
            {
                source: '/:all*(svg|jpg|png|jpeg|woff|woff2|webp|ico)',
                locale: false,
                headers: [
                    {
                        key: 'Cache-Control',
                        value: `public, max-age=${process.env.CACHE_PUBLIC_MAX_AGE ?? 3600}, stale-while-revalidate`,
                    },
                ],
            },
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'X-DNS-Prefetch-Control',
                        value: 'on',
                    },
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=63072000; includeSubDomains; preload',
                    },
                    {
                        key: 'X-XSS-Protection',
                        value: '1; mode=block',
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                ],
            },
        ];
    },

    logging: {
        fetches: {
            fullUrl: true,
        },
    },
};

const isProduction =
    process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_APP_ENV === 'PROD';

const withSentry = () => {
    if (process.env.NEXT_PUBLIC_SENTRY_DSN && process.env.NEXT_PUBLIC_SENTRY_DSN?.length > 0) {
        return withSentryConfig(nextConfig, {
            org: process.env.SENTRY_ORG,
            project: process.env.APP_NAME,
            authToken: process.env.SENTRY_AUTH_TOKEN,
            sentryUrl: process.env.SENTRY_URL,
            silent: true,
            hideSourceMaps: true,
            widenClientFileUpload: true,
        });
    }

    return nextConfig;
};

export default isProduction
    ? withSentry()
    : MillionCompiler.next({ enabled: process.env.MILLION === 'true', rsc: true })(nextConfig);
