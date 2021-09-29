const path = require('path');
const { withSentryConfig } = require('@sentry/nextjs');

const isProduction = process.env.NODE_ENV === 'production';

const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
    distDir: 'dist',
    sassOptions: {
        indentType: 'tab',
        includePaths: [path.join(__dirname, 'src/assets/styles')],
    },
    env: {
        APP_ENV: process.env.APP_ENV,
        SENTRY_DSN: process.env.SENTRY_DSN,
    },
};

module.exports = isProduction
    ? withSentryConfig(nextConfig, { silent: true })
    : withBundleAnalyzer(nextConfig);
