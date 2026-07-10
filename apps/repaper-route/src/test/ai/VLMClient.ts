/**
 * Mock VLMClient for testing
 */
export class VLMClient {
    async verifyVisualState(_base64Screenshot: string, _prompt: string): Promise<{ passed: boolean; reason: string }> {
        console.log('[Mock VLMClient] verifyVisualState called.');
        return {
            passed: true,
            reason: 'Visual state verified by mock VLMClient (stub)'
        };
    }
}
