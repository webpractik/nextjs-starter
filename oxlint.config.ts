import { defineOxlintConfig } from '@webpractik/oxlint-config'

// https://github.com/webpractik/oxlint-config#использование
export default defineOxlintConfig({
    ignores: [
        '**/.vscode',
        '**/.turbo',
        '**/.million',
        '**/.remember',
        '**/.vitest-attachments',
        '**/next-env.d.ts',
        '**/storybook-static',
        '**/coverage-ts',
        '**/report',
        '**/test-results',
        '**/allure-results',
        '**/playwright-report',
        '**/blob-report',
        '.pnp',
        '**/.pnp.js',
        'out',
        'build',
        '.kuber',
        'styles',
        'docs',
        'packages/api/bundled.yaml',
        'packages/api/codegen',
    ],
    // Корпоративный preset не включает проверку определений Server Components.
    jsPlugins: ['eslint-plugin-react-rsc'],
    jsxA11y: true,
    nextjs: true,
    react: true,
    storybook: true,
    stylistic: {
        indent: 4,
        printWidth: 100,
        tabWidth: 4,
    },
    tailwindcss: {
        entryPoint: './src/styles/globals.css',
        overrides: {
            'prefer-template/multiline-classname': 'error',
            'tailwindcss/enforce-canonical-classes': 'warn',
            'tailwindcss/no-deprecated-classes': 'warn',
            'tailwindcss/no-duplicate-classes': 'warn',
            'tailwindcss/no-unnecessary-whitespace': 'warn',
        },
    },
    type: 'app',
    typescript: {
        tsconfigPath: './tsconfig.json',
    },
    rules: {
        'no-restricted-imports': [
            'error',
            {
                patterns: [
                    {
                        group: ['~/packages/core/*'],
                        message: 'Please use import from @repo/core instead',
                    },
                    {
                        group: ['~/packages/api/*'],
                        message: 'Please use import from @repo/api instead',
                    },
                ],
            },
        ],
        'react-rsc/function-definition': 'error',
    },
})
