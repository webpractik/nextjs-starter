import { headers } from './headers.mjs';
import { withSentryConfig } from '@sentry/nextjs';
import withBundleAnalyzer from '@next/bundle-analyzer';
import { nanoid } from 'nanoid';
import { fileURLToPath } from 'node:url';
import createJiti from 'jiti';

const jiti = createJiti(fileURLToPath(import.meta.url));

jiti('./env/client');
jiti('./env/server');

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
    reactStrictMode: true,

    poweredByHeader: false,

    cleanDistDir: true,

    webpack: (config, { isServer }) => {
        // fix for dom-sanitizer on server-side
        config.externals = [...config.externals, 'jsdom'];

        if (isServer) {
            config.ignoreWarnings = [{ module: /opentelemetry/ }];
        }

        return config;
    },

    swcMinify: true,

    experimental: {
        serverSourceMaps: true,
        optimizePackageImports: ['react-use', 'lodash-es', 'lucide-react'],
        instrumentationHook: true,
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
        return withSentryConfig(nextConfig, {
            org: process.env.SENTRY_ORG,
            project: process.env.SENTRY_PROJECT,
            authToken: process.env.SENTRY_AUTH_TOKEN,
            url: process.env.SENTRY_URL,
            silent: true,
            hideSourceMaps: true,
        });
    }

    return nextConfig;
};

export default isProduction ? withSentry() : bundleAnalyzer(nextConfig);
