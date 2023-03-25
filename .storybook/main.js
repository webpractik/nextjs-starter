const path = require('path');

module.exports = {
    stories: ['../src/**/*.stories.@(ts|tsx)'],
    addons: [
        '@storybook/addon-links',
        '@storybook/addon-essentials',
        '@storybook/addon-actions',
        '@storybook/addon-interactions',
        'storybook-dark-mode',
        '@storybook/addon-mdx-gfm',
    ],
    typescript: {
        check: false,
        checkOptions: {},
        reactDocgen: 'react-docgen-typescript',
        reactDocgenTypescriptOptions: {
            shouldRemoveUndefinedFromOptional: true,
            shouldExtractLiteralValuesFromEnum: true,
            shouldExtractValuesFromUnion: true,
            propFilter: prop => (prop.parent ? !/node_modules/.test(prop.parent.fileName) : true),
        },
    },
    framework: {
        name: '@storybook/nextjs',
        options: {
            nextConfigPath: path.resolve(__dirname, '../next.config.js'),
        },
    },
    staticDirs: ['../public'],
    features: {
        storyStoreV7: true,
    },
    core: {
        options: {
            lazyCompilation: true,
        },
    },
    docs: {
        autodocs: true,
    },
};
