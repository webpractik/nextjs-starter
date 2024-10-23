const { relative } = require('node:path');
const { readFile } = require('node:fs/promises');
const { minimatch } = require('minimatch');

async function buildEslintCommand(filenames) {
    try {
        const eslintIgnores = await readFile('./.eslintignore', 'utf-8');

        const ignoreList = eslintIgnores.split('\n').filter(Boolean);

        const nonIgnoredFiles = filenames
            .map(name => relative(process.cwd(), name))
            .filter(filePath => !ignoreList.some(pattern => minimatch(filePath, pattern)));

        const paths = nonIgnoredFiles.join(' --file ');

        return `npm run check:lint -- --fix --file ${paths}`;
    } catch (error) {
        console.error(error);
    }
}

module.exports = {
    '*.ts?(x)': () => 'npm run check:ts',
    '*.{js?(x),ts?(x)}': [buildEslintCommand],
    '*.{js,jsx,ts,tsx,md,html,css,json}': () => 'npm run check:format',
    '*.test.{js,jsx,ts,tsx}': () => 'npm run check:test',
};
