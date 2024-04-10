/** @type {import("eslint").Linter.Config} */
module.exports = {
    parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
    },
    extends: ['webpractik', 'next', 'plugin:tailwindcss/recommended'],
    rules: {
        'max-len': 'off',
    },
    ignorePatterns: ['.*.js', 'node_modules/'],
    overrides: [{ files: ['*.js?(x)', '*.ts?(x)'], parser: '@typescript-eslint/parser' }],
};
