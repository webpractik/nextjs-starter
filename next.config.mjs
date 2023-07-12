import path from 'path';
import { headers } from './config/headers.mjs';
import { withSentryConfig } from '@sentry/nextjs';
import { fileURLToPath } from 'url';
import withBundleAnalyzer from '@next/bundle-analyzer';
import './env.mjs';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * @type {import('next').NextConfig}
 */

const nextConfig = {
    sassOptions: {
        indentType: 'tab',
        style: 'compressed',
        additionalData: '@import "../config"',
        includePaths: [path.join(__dirname, 'src/styles/modules/')],
        charset: false,
    },

    reactStrictMode: true,

    poweredByHeader: false,

    modularizeImports: {
        lodash: {
            transform: 'lodash/{{member}}',
        },
    },

    experimental: {
        webpackBuildWorker: true,
        instrumentationHook: true,
    },

    images: {
        disableStaticImages: true,
        dangerouslyAllowSVG: true,
        contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    },

    rewrites: async () => [
        {
            source: `${process.env.NEXT_PUBLIC_FRONT_PROXY}/:path*`,
            destination: process.env.BACK_INTERNAL_URL ?? `${process.env.NEXT_PUBLIC_FRONT_PROXY}/:path*`,
        },
    ],

    headers,
};

const isProduction =
    process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_APP_ENV === 'PROD';

const bundleAnalyzer = withBundleAnalyzer({
    enabled: process.env.ANALYZE === 'true',
});

const withSentry = () => {
    if (process.env.NEXT_PUBLIC_SENTRY_DSN?.length > 0) {
        return withSentryConfig(nextConfig, { silent: true });
    }
    return nextConfig;
};

export default isProduction ? withSentry() : bundleAnalyzer(nextConfig);
