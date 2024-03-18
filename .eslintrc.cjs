/* eslint-env node */
module.exports = {
    root: true,
    parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
    },
    extends: ['webpractik', 'next', 'plugin:tailwindcss/recommended'],
    rules: {
        'max-len': 'off',
    },
};
