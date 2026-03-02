import { describe, it, expect } from 'vitest';
import { TemplateManager } from './TemplateManager';

describe('TemplateManager', () => {
    describe('getNthWeek', () => {
        it('should return 1 for 1st-7th of the month', () => {
            expect(TemplateManager.getNthWeek(new Date('2026-03-01'))).toBe(1);
            expect(TemplateManager.getNthWeek(new Date('2026-03-07'))).toBe(1);
        });

        it('should return 2 for 8th-14th of the month', () => {
            expect(TemplateManager.getNthWeek(new Date('2026-03-08'))).toBe(2);
            expect(TemplateManager.getNthWeek(new Date('2026-03-14'))).toBe(2);
        });

        it('should return 5 for dates after 28th', () => {
            expect(TemplateManager.getNthWeek(new Date('2026-03-29'))).toBe(5);
            expect(TemplateManager.getNthWeek(new Date('2026-03-31'))).toBe(5);
        });
    });

    describe('findBestMatchingTemplate', () => {
        const mockTemplates: any[] = [
            { id: '1', name: 'Mon Weekly', day_of_week: 1, nth_week: null, is_active: true },
            { id: '2', name: '1st Mon', day_of_week: 1, nth_week: 1, is_active: true },
            { id: '3', name: '2nd Mon', day_of_week: 1, nth_week: 2, is_active: true },
        ];

        it('should prioritize specific nth_week match', () => {
            const date = new Date('2026-03-02'); // 1st Mon
            const match = TemplateManager.findBestMatchingTemplate(mockTemplates, date);
            expect(match?.name).toBe('1st Mon');
        });

        it('should fallback to weekly template if specific nth_week is not found', () => {
            const date = new Date('2026-03-16'); // 3rd Mon (no template for 3rd)
            const match = TemplateManager.findBestMatchingTemplate(mockTemplates, date);
            expect(match?.name).toBe('Mon Weekly');
        });

        it('should return null if no day_of_week matches', () => {
            const date = new Date('2026-03-03'); // Tue
            const match = TemplateManager.findBestMatchingTemplate(mockTemplates, date);
            expect(match).toBeNull();
        });
    });
});
