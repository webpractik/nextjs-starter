module.exports = {
    '**/*.ts?(x)': () => 'npm run check:ts',
    '**/*.{js?(x),ts?(x)}': () => 'npm run check:lint',
    '*/*.{js,jsx,ts,tsx,md,html,css,json}': () => 'npm run check:format',
    '*.test.{js,jsx,ts,tsx}': () => 'npm run check:test',
};
