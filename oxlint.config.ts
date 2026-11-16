import { defineOxlintConfig } from '@webpractik/oxlint-config'
import { ALL_REACT_DOCTOR_RULES } from 'oxlint-plugin-react-doctor'

/** https://github.com/webpractik/oxlint-config#использование */
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
        'openwiki',
        'src/api/bundled.yaml',
        'src/api/codegen',
    ],
    // Корпоративный preset не включает проверку определений Server Components.
    jsPlugins: [
        'eslint-plugin-react-rsc',
        { name: 'react-doctor', specifier: 'oxlint-plugin-react-doctor' },
    ],
    jsxA11y: true,
    nextjs: true,
    react: true,
    settings: {
        'react-doctor': { portedRuleMode: 'curated' },
    },
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
        ...ALL_REACT_DOCTOR_RULES,
        'no-restricted-imports': [
            'error',
            {
                patterns: [
                    {
                        group: [
                            'next/link',
                            'next/link.js',
                            'next/dist/client/link',
                            'next/dist/client/link.js',
                        ],
                        message:
                            'Для внутренних переходов используйте ForesightLink из #/components/utilities/foresight-link.',
                    },
                    {
                        group: ['~/src/components/ui/*'],
                        message: 'Please use import from #/components/ui instead',
                    },
                    {
                        group: ['~/src/api/*'],
                        message: 'Please use import from #/api instead',
                    },
                ],
            },
        ],
        // Base UI требует проброса props; глубина JSX определяется композицией примитивов.
        'react-doctor/jsx-max-depth': 'off',
        'react-doctor/jsx-props-no-spreading': 'off',
        // Архитектура требует публичных index.ts; Next.js поддерживает exports маршрутов.
        'react-doctor/no-barrel-import': 'off',
        // Проект использует React и automatic JSX runtime, а не Preact и classic JSX.
        'react-doctor/preact-no-react-hooks-import': 'off',
        'react-doctor/react-in-jsx-scope': 'off',
        'react-rsc/function-definition': 'error',
    },
})
