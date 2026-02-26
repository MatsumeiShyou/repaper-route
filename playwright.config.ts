import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests/vlm',
    fullyParallel: false, // Ensure VLM tests run sequentially to avoid ratelimits
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',
    timeout: 60000,
    expect: {
        timeout: 30000
    },
    use: {
        /* Base URL to use in actions like `await page.goto('/')`. */
        baseURL: 'http://localhost:5173',
        trace: 'on-first-retry',
        viewport: { width: 1440, height: 900 },
    },

    /* Configure projects for major browsers */
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
});
