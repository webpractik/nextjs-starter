const path = require('path');
module.exports = {
    stories: ['../src/**/*.stories.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
    addons: ['@storybook/addon-links', '@storybook/addon-essentials'],
    typescript: {
        check: false,
    },
    webpackFinal: async config => {
        config.resolve.alias['@'] = path.resolve(__dirname, '../src/');
        config.resolve.alias['@sassConfig'] = path.resolve(
            __dirname,
            '../src/assets/styles/base/config.sass'
        );
        config.module.rules.push({
            test: /\.module\.sass$/,
            loader: [
                'style-loader',
                {
                    loader: 'css-loader',
                    options: {
                        modules: true,
                        sourceMap: true,
                    },
                },
                {
                    loader: 'sass-loader',
                    options: {
                        sourceMap: true,
                        sassOptions: {
                            indentType: 'tab',
                            includePaths: [
                                path.join(__dirname, '..', 'src/assets/styles/index.sass'),
                            ],
                        },
                    },
                },
            ],
        });

        return config;
    },
};
