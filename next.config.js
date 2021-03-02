const path = require('path');

const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
    webpack(config) {
        return config;
    },
    trailingSlash: true,
    distDir: 'dist',
    sassOptions: {
        indentType: 'tab',
        includePaths: [path.join(__dirname, 'src/assets/styles')],
    },
    env: {
        ENV_EXAMPLE: process.env.ENV_EXAMPLE,
    },
};

module.exports = withBundleAnalyzer(nextConfig);
