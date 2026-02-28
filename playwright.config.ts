import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: process.env.CI ? 'html' : 'list',
    timeout: 60000,
    expect: {
        timeout: 30000
    },
    use: {
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
    },

    projects: [
        {
            name: 'vlm',
            testDir: './tests/vlm',
            use: {
                ...devices['Desktop Chrome'],
                baseURL: 'http://localhost:5173',
                viewport: { width: 1440, height: 900 },
            },
        },
        {
            name: 'e2e-smoke',
            testDir: './tests/e2e',
            use: {
                ...devices['Desktop Chrome'],
                baseURL: process.env.STAGING_URL || 'https://repaper-route.pages.dev',
            },
        },
    ],
});
