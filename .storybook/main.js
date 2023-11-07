const path = require('path');

module.exports = {
    stories: ['../components/**/*.stories.@(ts|tsx)', '../app/**/*.stories.@(ts|tsx)'],
    addons: [
        '@storybook/addon-links',
        '@storybook/addon-essentials',
        '@storybook/addon-actions',
        '@storybook/addon-interactions',
        'storybook-dark-mode',
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
            nextConfigPath: path.resolve(__dirname, '../next.config.mjs'),
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
