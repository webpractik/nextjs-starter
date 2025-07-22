import { withSentryConfig } from '@sentry/nextjs';
import { createJiti } from 'jiti';
import { nanoid } from 'nanoid';
import type { NextConfig } from 'next';
import { RsdoctorWebpackPlugin } from '@rsdoctor/webpack-plugin';
import { environment as clientEnv } from '#/env/client';
import { environment as serverEnv } from '#/env/server';
import { headers } from '~/headers';

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

    webpack: (config, { isServer }) => {
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

    allowedDevOrigins: ['localhost', process.env.NEXT_PUBLIC_FRONT_URL as string],

    experimental: {
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

    headers,

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
