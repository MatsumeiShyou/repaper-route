import { describe, it, expect } from 'vitest';

describe('Smoke Test', () => {
    it('should run this test', () => {
        expect(true).toBe(true);
    });

    it('should have access to DOM', () => {
        const element = document.createElement('div');
        expect(element).toBeDefined();
    });
});
