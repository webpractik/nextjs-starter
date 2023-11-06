/* eslint-env node */
module.exports = {
    root: true,
    parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
    },
    extends: ['webpractik', 'next'],
    rules: {
        'lodash/import-scope': 'off',
    },
};
