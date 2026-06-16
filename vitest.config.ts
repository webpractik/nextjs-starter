// https://vitest.dev/config/
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import react from '@vitejs/plugin-react'
import { playwright } from '@vitest/browser-playwright'
import tsconfigPaths from 'vite-tsconfig-paths'
import { configDefaults, defineConfig } from 'vitest/config'

const dirname =
    typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url))

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
    define: {
        'process.env': JSON.stringify({}),
    },
    optimizeDeps: {
        include: [
            '@sentry/nextjs',
            '@testing-library/react',
            'class-variance-authority',
            'clsx',
            'lodash-es',
            'tailwind-merge',
        ],
    },
    plugins: [react(), tsconfigPaths()],
    test: {
        projects: [
            {
                extends: true,
                test: {
                    name: 'browser',
                    browser: {
                        enabled: true,
                        headless: true,
                        instances: [
                            {
                                browser: 'chromium',
                            },
                        ],
                        provider: playwright(),
                    },
                    css: false,
                    exclude: [...configDefaults.exclude, 'packages/api/**'],
                    globals: true,
                    include: ['**/?(*.)test.ts?(x)'],
                },
            },
            {
                extends: true,
                test: {
                    environment: 'node',
                    globals: false,
                    include: ['packages/api/kubb-plugin-cache-tags/**/*.test.ts'],
                    name: 'api',
                },
            },
            {
                extends: true,
                plugins: [
                    // The plugin will run tests for the stories defined in your Storybook config
                    // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
                    storybookTest({
                        configDir: path.join(dirname, '.storybook'),
                    }),
                ],
                test: {
                    name: 'storybook',
                    browser: {
                        enabled: true,
                        headless: true,
                        provider: playwright({}),
                        instances: [
                            {
                                browser: 'chromium',
                            },
                        ],
                    },
                },
            },
        ],
    },
})
