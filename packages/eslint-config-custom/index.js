/** @type {import("eslint").Linter.Config} */
module.exports = {
    extends: ['webpractik', 'plugin:tailwindcss/recommended', 'plugin:@next/next/recommended'],
    rules: {
        'max-len': 'off',
        'tailwindcss/no-custom-classname': 'off',
    },
    ignorePatterns: ['.*.js', 'node_modules/'],
    overrides: [{ files: ['*.js?(x)', '*.ts?(x)'], parser: '@typescript-eslint/parser' }],
    settings: {
        polyfills: ['fetch', 'URL', 'Headers', 'Request', 'Response'],
    },
};
