import { defineConfig, devices } from '@playwright/test';

const port = process.env.FRONT_PORT ?? '3000';

const baseURL = `http://localhost:${port}`;

process.env.ENVIRONMENT_URL = baseURL;

const CI = process.env.CI === 'true';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
    forbidOnly: CI,
    fullyParallel: true,
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },

        {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
        },

        {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] },
        },

        /* Test against mobile viewports. */
        // {
        //   name: 'Mobile Chrome',
        //   use: { ...devices['Pixel 5'] },
        // },
        // {
        //   name: 'Mobile Safari',
        //   use: { ...devices['iPhone 12'] },
        // },

        /* Test against branded browsers. */
        // {
        //   name: 'Microsoft Edge',
        //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
        // },
        // {
        //   name: 'Google Chrome',
        //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
        // },
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
        command: CI ? 'npm run prod' : 'npm run dev',
        reuseExistingServer: !CI,
        timeout: 2 * 60 * 1000,
        url: baseURL,
    },
});
