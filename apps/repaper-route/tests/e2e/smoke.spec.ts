import { test, expect } from '@playwright/test';

const STAGING_URL = process.env.STAGING_URL || 'https://repaper-route.pages.dev';

test.describe('Staging Smoke Tests', () => {
    test('ページが正常にロードされること', async ({ page }) => {
        const response = await page.goto(STAGING_URL, { waitUntil: 'networkidle' });

        // HTTP 200 であること
        expect(response?.status()).toBe(200);

        // タイトルに "RePaper" が含まれること
        await expect(page).toHaveTitle(/RePaper/i);

        // React の root 要素が描画されていること
        const root = page.locator('#root');
        await expect(root).toBeAttached();

        // root が空でないこと（React が正常に描画した証拠）
        const childCount = await root.evaluate(el => el.children.length);
        expect(childCount).toBeGreaterThan(0);

        // スクリーンショットを証拠として保存
        await page.screenshot({ path: 'test-results/staging-home.png', fullPage: true });
    });

    test('コンソールに致命的エラーがないこと', async ({ page }) => {
        const errors: string[] = [];

        page.on('console', msg => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            }
        });

        await page.goto(STAGING_URL, { waitUntil: 'networkidle' });

        // 致命的な JS エラー（Uncaught等）がないことを確認
        const criticalErrors = errors.filter(e =>
            e.includes('Uncaught') ||
            e.includes('TypeError') ||
            e.includes('ReferenceError') ||
            e.includes('SyntaxError')
        );

        expect(criticalErrors).toHaveLength(0);
    });
});
