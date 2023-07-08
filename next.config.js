const path = require('path');
const headers = require('./config/headers.js');
const { withSentryConfig } = require('@sentry/nextjs');

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
            source: '/api/:path*',
            destination: process.env.BACK_INTERNAL_URL ?? '/api/:path*',
        },
    ],

    headers,
};

const isProduction =
    process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_APP_ENV === 'PROD';

const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
});

const withSentry = () => {
    if (process.env.NEXT_PUBLIC_SENTRY_DSN?.length > 0) {
        return withSentryConfig(nextConfig, { silent: true });
    }

    return nextConfig;
};

module.exports = isProduction ? withSentry() : withBundleAnalyzer(nextConfig);
