import { defineConfig, devices } from '@playwright/test'

const port = process.env.FRONT_PORT ?? '3000'

const baseURL = `http://localhost:${port}`

process.env.ENVIRONMENT_URL = baseURL

const CI = process.env.CI === 'true'
const serverMode = process.env.PLAYWRIGHT_SERVER_MODE ?? (CI ? 'standalone' : 'development')

if (serverMode !== 'development' && serverMode !== 'standalone') {
    throw new Error(`Unsupported PLAYWRIGHT_SERVER_MODE: ${serverMode}`)
}

const usesStandaloneServer = serverMode === 'standalone'

/** See https://playwright.dev/docs/test-configuration. */
export default defineConfig({
    forbidOnly: CI,
    fullyParallel: true,
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
    reporter: 'html',
    retries: CI ? 2 : 0,
    testDir: './src/tests/e2e',
    timeout: 30 * 1000,
    use: {
        baseURL,
        trace: 'on-first-retry',
    },
    webServer: {
        command: usesStandaloneServer ? 'npm run prod' : 'npm run dev',
        reuseExistingServer: !usesStandaloneServer,
        timeout: 2 * 60 * 1000,
        url: baseURL,
    },
})
