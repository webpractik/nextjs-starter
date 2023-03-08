module.exports = {
    stories: ['../src/**/*.stories.@(ts|tsx)'],
    addons: [
        '@storybook/addon-links',
        '@storybook/addon-essentials',
        '@storybook/addon-actions',
        '@storybook/addon-interactions',
        'storybook-addon-next',
        'storybook-addon-next-router',
        'storybook-addon-swc',
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
    framework: '@storybook/react',
    features: {
        storyStoreV7: true,
    },
    core: {
        builder: 'webpack5',
        options: {
            lazyCompilation: true,
        },
    },
};
