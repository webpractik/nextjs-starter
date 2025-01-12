/** @type {import("eslint").Linter.Config} */
module.exports = {
    extends: [
        'webpractik',
        'plugin:tailwindcss/recommended',
        'plugin:@next/next/recommended',
        'plugin:storybook/recommended',
    ],
    rules: {
        'max-len': 'off',
        'tailwindcss/no-custom-classname': 'off',
        'sonarjs/function-return-type': 'off',
        'sonarjs/no-misused-promises': 'off',
        'unicorn/prevent-abbreviations': [
            'error',
            {
                replacements: {
                    'next-env': false,
                    props: false,
                    ref: false,
                    params: false,
                },
            },
        ],
        '@typescript-eslint/no-misused-promises': 'off',
    },
    ignorePatterns: ['.*.js', 'node_modules/'],
    overrides: [{ files: ['*.js?(x)', '*.ts?(x)'], parser: '@typescript-eslint/parser' }],
    settings: {
        polyfills: ['fetch', 'URL', 'Headers', 'Request', 'Response'],
    },
};
