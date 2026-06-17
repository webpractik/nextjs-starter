// https://vitest.dev/config/
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { parseEnv } from 'node:util'

import react from '@vitejs/plugin-react'
import { playwright } from '@vitest/browser-playwright'
import svgr from 'vite-plugin-svgr'
import { defineConfig } from 'vitest/config'

const sonnerMock = fileURLToPath(new URL('./src/tests/mocks/sonner.ts', import.meta.url))
const nextNavigationMock = fileURLToPath(
    new URL('./src/tests/mocks/next-navigation.ts', import.meta.url),
)
const nextScriptMock = fileURLToPath(new URL('./src/tests/mocks/next-script.tsx', import.meta.url))
const nextImageMock = fileURLToPath(new URL('./src/tests/mocks/next-image.tsx', import.meta.url))
const dotEnvPath = new URL('./.env', import.meta.url)

const testExclude = [
    '**/.next/**',
    '**/allure-results/**',
    '**/blob-report/**',
    '**/coverage/**',
    '**/dist/**',
    '**/node_modules/**',
    '**/playwright-report/**',
    '**/test-results/**',
]

const testEnvironmentKeys = [
    'APP_ENV',
    'APP_NAME',
    'BACK_INTERNAL_URL',
    'CI',
    'FRONT_HOST',
    'PORT',
    'HTTP_AUTH_LOGIN',
    'HTTP_AUTH_PASS',
    'MOCK_MODE',
    'SENTRY_AUTH_TOKEN',
    'SENTRY_DSN',
    'SENTRY_ORG',
    'SENTRY_URL',
    'NEXT_PUBLIC_APP_ENV',
    'NEXT_PUBLIC_BFF_PATH',
    'NEXT_PUBLIC_FRONT_URL',
    'NEXT_PUBLIC_BACK_URL',
    'NEXT_PUBLIC_MOCK_MODE',
    'NEXT_PUBLIC_SENTRY_DSN',
] as const

const dotEnvEnvironment = existsSync(dotEnvPath) ? parseEnv(readFileSync(dotEnvPath, 'utf8')) : {}

const testEnvironment = Object.fromEntries(
    testEnvironmentKeys.flatMap((key) => {
        const value = process.env[key] ?? dotEnvEnvironment[key]

        return value === undefined ? [] : [[key, value]]
    }),
)

const testProcessEnvironment: Partial<NodeJS.ProcessEnv> = {
    NODE_ENV: 'test',
    ...testEnvironment,
}

export default defineConfig({
    define: {
        __NEXTJS_STARTER_TEST_ENV__: JSON.stringify(testProcessEnvironment),
    },
    optimizeDeps: {
        exclude: ['undici'],
        include: [
            '@sentry/nextjs',
            'class-variance-authority',
            'clsx',
            'lodash-es',
            'next/headers',
            'next/link',
            'next/link.js',
            'nuqs',
            'nuqs/server',
            'sonner',
            'tailwind-merge',
            'vitest-browser-react',
        ],
    },
    plugins: [
        react(),
        svgr({
            include: '**/*.svg',
        }),
    ],
    resolve: {
        alias: [
            { find: /^next\/navigation$/, replacement: nextNavigationMock },
            { find: /^next\/script$/, replacement: nextScriptMock },
            { find: /^next\/image$/, replacement: nextImageMock },
            { find: /^sonner$/, replacement: sonnerMock },
        ],
        tsconfigPaths: true,
    },
    test: {
        clearMocks: true,
        coverage: {
            exclude: [
                ...testExclude,
                '**/*.d.ts',
                '**/*.{test,spec}.{ts,tsx}',
                '**/*.stories.{ts,tsx}',
                '**/codegen/**',
                '**/openapi/**',
                '**/*.config.{ts,tsx,mts,cts,js,mjs,cjs}',
                'next-env.d.ts',
                'src/fonts/**',
                'src/styles/**',
            ],
            include: ['app/**/*.{ts,tsx}', 'packages/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}'],
            provider: 'v8',
            reporter: ['text', 'html', 'lcov', 'json', 'json-summary', 'cobertura'],
            reportsDirectory: './coverage/vitest',
        },
        css: true,
        deps: {
            optimizer: {
                client: {
                    enabled: true,
                    include: [
                        '@sentry/nextjs',
                        'class-variance-authority',
                        'clsx',
                        'lodash-es',
                        'next/dist/client/components/navigation',
                        'next/dist/client/link',
                        'next/dist/shared/lib/app-router-context.shared-runtime',
                        'next/headers',
                        'next/link',
                        'next/link.js',
                        'nuqs',
                        'nuqs/server',
                        'sonner',
                        'tailwind-merge',
                        'vitest-browser-react',
                    ],
                },
            },
        },
        env: testProcessEnvironment,
        globals: true,
        outputFile: {
            json: './test-results/vitest.json',
            junit: './test-results/vitest.junit.xml',
        },
        projects: [
            {
                extends: true,
                test: {
                    environment: 'node',
                    exclude: testExclude,
                    include: ['**/*.unit.test.{ts,tsx}', 'packages/**/*.test.ts'],
                    name: 'unit',
                    setupFiles: ['./src/tests/setup-env.ts', './src/tests/setup-allure-unit.ts'],
                },
            },
            {
                extends: true,
                test: {
                    browser: {
                        enabled: true,
                        headless: true,
                        instances: [{ browser: 'chromium' }],
                        provider: playwright(),
                    },
                    exclude: testExclude,
                    include: [
                        '**/*.component.test.{ts,tsx}',
                        'app/**/*.test.tsx',
                        'src/**/*.test.tsx',
                    ],
                    name: 'component',
                    setupFiles: [
                        './src/tests/setup-env.ts',
                        './src/tests/setup-browser.ts',
                        './src/tests/setup-allure-component.ts',
                    ],
                },
            },
        ],
        reporters: [
            'default',
            'junit',
            'json',
            ['allure-vitest/reporter', { resultsDir: './allure-results' }],
        ],
        restoreMocks: true,
        unstubGlobals: true,
    },
})
