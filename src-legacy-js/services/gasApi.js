/**
 * GAS API Service.
 * Handles communication with Google Apps Script Backend.
 * Uses 'no-cors' mode or standard CORS depending on deployment.
 * For Zero-Cost, we use this for Batch Log Sync (Cold Storage).
 */

// Production Endpoint (v1.0)
const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbztzbQGp7FTQ2t0qlBgY0qz3uOuRed6ec8QseGtbE69pHmjHZy_x6Y2ATNu-DKomCFygA/exec";

export const GasApi = {
    /**
     * Sends a batch of events to GAS Cold Storage.
     * @param {Array} events - List of event objects
     */
    async syncBatch(events) {
        if (!GAS_WEB_APP_URL) {
            console.warn('[GasApi] URL not set. Skipping sync.');
            return { success: false, error: 'URL_NOT_SET' };
        }

        const payload = {
            action: 'BATCH_SYNC_LOGS',
            payload: events
        };

        try {
            // Use fetch with text/plain to avoid CORS preflight options request issues with GAS
            const response = await fetch(GAS_WEB_APP_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            return { success: true, data: result };

        } catch (error) {
            console.error('[GasApi] Sync failed:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Submits End of Day report (Split Calculation Trigger).
     */
    async submitEndOfDay(reportData) {
        if (!GAS_WEB_APP_URL) return { success: false, message: 'Mock Success (No URL)' };

        // Similar implementation for report submission...
        // For MVP, we primarily use this for syncing logs.
    }
};
