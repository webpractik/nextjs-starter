import { defineConfig, devices } from '@playwright/test';

const port = process.env.FRONT_PORT ?? '3000';

const baseURL = `http://localhost:${port}`;

process.env.ENVIRONMENT_URL = baseURL;

const CI = process.env.CI === 'true';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
    /* Fail the build on CI if you accidentally left test.only in the source code. */
    forbidOnly: CI,
    /* Run tests in files in parallel */
    fullyParallel: true,
    /* Configure projects for major browsers */
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
    /* Reporter to use. See https://playwright.dev/docs/test-reporters */
    reporter: 'html',
    /* Retry on CI only */
    retries: CI ? 2 : 0,
    testDir: './tests/e2e',
    // Timeout per test
    timeout: 30 * 1000,
    /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
    use: {
        /* Base URL to use in actions like `await page.goto('/')`. */
        baseURL,

        /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
        trace: 'on-first-retry',
    },

    /* Run your local dev server before starting the tests */
    webServer: {
        command: CI ? 'npm run prod' : 'npm run dev',
        reuseExistingServer: !CI,
        timeout: 2 * 60 * 1000,
        url: baseURL,
    },

    /* Opt out of parallel tests on CI. */
    workers: CI ? 1 : undefined,
});
