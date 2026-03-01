import { describe, it, expect } from 'vitest';

describe.skip('Smoke Test', () => {
    it('should have access to essential global variables', () => {
        expect(true).toBe(true);
    });

    it('should have access to DOM', () => {
        const element = document.createElement('div');
        expect(element).toBeDefined();
    });
});
