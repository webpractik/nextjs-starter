import { withSentryConfig } from '@sentry/nextjs';
import { createJiti } from 'jiti';
import { nanoid } from 'nanoid';
import type { NextConfig } from 'next';
import { RsdoctorWebpackPlugin } from '@rsdoctor/webpack-plugin';
import { environment as clientEnv } from '#/env/client';
import { environment as serverEnv } from '#/env/server';

const jiti = createJiti(import.meta.url);

(async () => {
    try {
        await jiti.import('./src/env/client', {});
        await jiti.import('./src/env/server', {});
    } catch {}
})();

const nextConfig: NextConfig = {
    reactStrictMode: true,

    poweredByHeader: false,

    cleanDistDir: true,

    webpack: (config, { isServer, nextRuntime }) => {
        if (isServer) {
            config.ignoreWarnings = [{ module: /opentelemetry/ }];
        }

        if (process.env.ANALYZE === 'true') {
            if (config.name === 'client') {
                config.plugins.push(
                    new RsdoctorWebpackPlugin({
                        disableClientServer: true,
                    })
                );
            } else if (config.name === 'server') {
                config.plugins.push(
                    new RsdoctorWebpackPlugin({
                        disableClientServer: true,
                        output: {
                            reportDir: './.next/server',
                        },
                    })
                );
            }
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
        position: 'top-right',
    },

    images: {
        disableStaticImages: true,
        dangerouslyAllowSVG: true,
        contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    },

    async rewrites() {
        if (!clientEnv.NEXT_PUBLIC_BFF_PATH || !serverEnv.BACK_INTERNAL_URL) {
            throw new Error('Missing bff envs');
        }

        return {
            beforeFiles: [
                {
                    source: `${clientEnv.NEXT_PUBLIC_BFF_PATH}/:path*`,
                    destination: `${serverEnv.BACK_INTERNAL_URL}/:path*`,
                },
            ],
        };
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
                        key: 'X-XSS-Protection',
                        value: '0',
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'X-Permitted-Cross-Domain-Policies',
                        value: 'none',
                    },
                    {
                        key: 'Content-Security-Policy',
                        value: `
                            default-src 'self';
                            script-src 'self' 'unsafe-eval' 'unsafe-inline';
                            style-src 'self' 'unsafe-inline';
                            img-src 'self' blob: data:;
                            font-src 'self';
                            object-src 'none';
                            base-uri 'self';
                            form-action 'self';
                            frame-ancestors 'none';
                            upgrade-insecure-requests;
                        `.replace(/\n/g, ''),
                    },
                    {
                        key: 'Cross-Origin-Embedder-Policy',
                        value: 'require-corp',
                    },
                    {
                        key: 'Cross-Origin-Opener-Policy',
                        value: 'same-origin',
                    },
                    {
                        key: 'Cross-Origin-Resource-Policy',
                        value: 'same-origin',
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'no-referrer',
                    },
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=31536000; includeSubDomains',
                    },
                    {
                        key: 'Permissions-Policy',
                        value: 'accelerometer=(), autoplay=(), camera=(), cross-origin-isolated=(), display-capture=(), encrypted-media=(), fullscreen=(), geolocation=(), gyroscope=(), keyboard-map=(), magnetometer=(), microphone=(), midi=(), payment=(), picture-in-picture=(), publickey-credentials-get=(), screen-wake-lock=(), sync-xhr=(self), usb=(), web-share=(), xr-spatial-tracking=(), clipboard-read=(), clipboard-write=(), gamepad=(), hid=(), idle-detection=(), interest-cohort=(), serial=(), unload=()',
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
            widenClientFileUpload: true,
            sourcemaps: { deleteSourcemapsAfterUpload: true },
            reactComponentAnnotation: { enabled: true },
            disableLogger: true,
            telemetry: false,
            bundleSizeOptimizations: {
                excludeDebugStatements: true,
                excludeReplayShadowDom: true,
                excludeReplayIframe: true,
            },
        });
    }

    return nextConfig;
};

export default isProduction ? withSentry() : nextConfig;
