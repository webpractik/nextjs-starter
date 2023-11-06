import path from 'path';
import { headers } from './lib/headers.mjs';
import { withSentryConfig } from '@sentry/nextjs';
import { fileURLToPath } from 'url';
import withBundleAnalyzer from '@next/bundle-analyzer';
import './lib/env.mjs';
import { nanoid } from 'nanoid';
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

    cleanDistDir: true,

    webpack: config => {
        // fix for dom-sanitizer on server-side
        config.externals = [...config.externals, 'jsdom'];

        return config;
    },

    swcMinify: true,

    modularizeImports: {
        lodash: {
            transform: 'lodash/{{member}}',
        },
    },

    experimental: {
        webpackBuildWorker: true,
        serverSourceMaps: true,
        optimizePackageImports: ['react-use'],
    },

    compiler: {
        reactRemoveProperties: true,
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

    headers,

    logging: {
        fetches: {
            fullUrl: true,
        },
    },
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
