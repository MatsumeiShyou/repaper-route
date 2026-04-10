import { test, expect } from '@playwright/test';
import { VLMClient } from '../../src/test/ai/VLMClient';
import * as path from 'path';

// Define the VLM Client outside the test to use across runs
const vlm = new VLMClient();

test.describe('Board Visual E2E Tests', () => {
    test.beforeEach(async ({ page }) => {
        // Go to the local development server (assumes npm run dev is active)
        await page.goto('http://localhost:5173/?activeView=board');

        // Wait for ANY svg icon to appear, signaling the React app has mounted
        await page.waitForSelector('svg', { state: 'visible', timeout: 15000 });

        // Wait for the specific board container or driver header
        await page.waitForSelector('text="配車"', { state: 'visible', timeout: 15000 });

        // Give it an extra second for layout stabilization and API fetches
        await page.waitForTimeout(2000);
    });

    test('Verify semantic drag jump bug is fixed', async ({ page }) => {
        // Find an existing job card to drag (we'll grab the first one)
        // If the board is truly empty, we'd need to inject one via API or UI first.
        // For this test, we assume there's at least one card on the board.
        const jobCard = page.locator('[data-job-id]').first();

        // Make sure a card exists
        await expect(jobCard).toBeVisible({ timeout: 10000 });

        // Get the bounding box of the card to click the grab handle (left side)
        const box = await jobCard.boundingBox();
        if (!box) throw new Error('Could not get bounding box for job card');

        // Target the grab handle (left side of the card, vertically centered)
        const grabX = box.x + 5;
        const grabY = box.y + (box.height / 2);

        // Move mouse to the grab handle
        await page.mouse.move(grabX, grabY);
        await page.waitForTimeout(200);

        // Click and HOLD to start drag
        await page.mouse.down();
        await page.waitForTimeout(200); // Wait for the "lift" animation/state change

        // Drag 100 pixels to the right (to a different column)
        const targetX = grabX + 100;
        await page.mouse.move(targetX, grabY, { steps: 5 });
        await page.waitForTimeout(500); // Hold it there

        // --- VISUAL VERIFICATION ---
        // Capture screenshot of the entire board while dragging
        const screenshotBuffer = await page.screenshot({ type: 'png' });
        const base64Screenshot = screenshotBuffer.toString('base64');

        // Send to VLM for visual checking
        console.log('[Test] Sending drag state to VLM for verification...');
        const prompt = `
            Look at this dispatch board interface. 
            The user is currently dragging a colorful job card (it has a green 'drag preview' outline or is hovering).
            The mouse pointer (if visible, or imagine its position 100px to the right of the original card position) should be exactly on the LEFT GRAB HANDLE of the floating card.
            
            CRITICAL CHECK:
            Verify that the floating card is NOT jumping far away from the grab point. 
            The left edge of the floating card preview MUST be physically aligned with where the user would be dragging it.
            Check if the "drag outline" (which might be a dotted line or solid color box) is correctly following the pointer, and NOT disjointed or offset erroneously to the right.

            Also, check if there are any lingering "ghost" cards (duplicate previews lingering incorrectly in the original column).
        `;

        const verdict = await vlm.verifyVisualState(base64Screenshot, prompt);

        // Log the AI's reasoning for debuggability
        console.log(`[VLM Verdict]: ${verdict.passed ? 'PASS' : 'FAIL'}`);
        console.log(`[VLM Reason ]: ${verdict.reason}`);

        // Assert that the VLM passed the visual check
        expect(verdict.passed).toBe(true);

        // Finally, release the mouse to clean up
        await page.mouse.up();
    });
});
