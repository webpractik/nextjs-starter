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
        'react/jsx-props-no-spreading': [
            'warn',
            {
                html: 'ignore',
                custom: 'enforce',
                explicitSpread: 'enforce',
                exceptions: ['Component', 'Image', 'Link', 'ErrorBoundary'],
            },
        ],
    },
};
