const path = require('path');

module.exports = {
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
