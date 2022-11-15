module.exports = {
    '**/*.ts?(x)': () => 'npm run type-check',
    '**/*.{js?(x),ts?(x)}': () => 'npm run lint',
    '*/*.{js,jsx,ts,tsx,md,html,css,json}': () => 'npm run format',
};
