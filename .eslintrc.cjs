/* eslint-env node */
module.exports = {
    root: true,
    parserOptions: {
        project: true,
        tsconfigRootDir: __dirname,
    },
    extends: ['webpractik', 'next'],
    rules: {
        'lodash/import-scope': 'off',
    },
};
