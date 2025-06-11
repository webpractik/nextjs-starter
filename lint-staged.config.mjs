import { relative } from 'node:path';
import { minimatch } from 'minimatch';

export const ignores = [
    '.next',
    'next.config.ts',
    'next-env.d.ts',
    '*.config.js',
    'report',
    'packages/routes/**/*.ts',
    'packages/api/**/*.ts',
    '.storybook/preview.tsx',
    '.storybook/main.ts',
];

function lintCommand(filenames) {
    try {
        const nonIgnoredFiles = filenames
            .map(name => relative(process.cwd(), name))
            .filter(filePath => !ignores.some(pattern => minimatch(filePath, pattern)));

        const paths = nonIgnoredFiles.join(' --file ');

        return `npm run check:lint -- --fix --file ${paths}`;
    } catch (error) {
        console.error(error);
    }
}

/**
 * @type {import('lint-staged').Configuration}
 */
export default {
    '*.ts?(x)': () => 'npm run check:ts',
    '*.{js?(x),ts?(x)}': [lintCommand],
    '*.{js,jsx,ts,tsx,md,html,css,json}': () => 'npm run check:format',
    '*.test.{js,jsx,ts,tsx}': () => 'npm run check:test',
};
