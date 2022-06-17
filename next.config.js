const path = require('path');
const { withSentryConfig } = require('@sentry/nextjs');
const { withPlugins, optional } = require('next-compose-plugins');
const { PHASE_PRODUCTION_SERVER } = require('next/constants');

const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
});

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
    sassOptions: {
        indentType: 'tab',
        includePaths: [path.join(__dirname, 'src/assets/styles')],
    },
    swcMinify: true,
    reactStrictMode: true,
    poweredByHeader: false,
    experimental: {
        modularizeImports: {
            lodash: {
                transform: 'lodash/{{member}}',
            },
        },
    },
};

module.exports = withPlugins(
    [
        [withBundleAnalyzer],
        [optional(() => withSentryConfig), { silent: true }, [PHASE_PRODUCTION_SERVER]],
    ],
    nextConfig
);
