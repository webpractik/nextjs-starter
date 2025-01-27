export default {
    singleQuote: true,
    trailingComma: 'es5',
    tabWidth: 4,
    arrowParens: 'avoid',
    printWidth: 100,
    plugins: ['prettier-plugin-tailwindcss'],
    tailwindStylesheet: './app/globals.css',
    tailwindFunctions: ['cn', 'cva'],
};
