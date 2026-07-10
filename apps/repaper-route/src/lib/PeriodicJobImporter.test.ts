import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PeriodicJobImporter } from './PeriodicJobImporter';
import { nativeSupabaseFetch } from './supabase/nativeFetch';

// Mock nativeSupabaseFetch
vi.mock('./supabase/nativeFetch', () => ({
    nativeSupabaseFetch: vi.fn()
}));

describe('PeriodicJobImporter', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should filter points by date based on collection_days and recurrence_pattern', async () => {
        const mockPoints = [
            // Point 1: Matches Mon (Array format), no recurrence pattern
            {
                id: 'p1',
                display_name: 'Mon Point Array',
                is_active: true,
                collection_days: ['mon'],
                recurrence_pattern: null
            },
            // Point 2: Matches Mon (Object format), no recurrence pattern
            {
                id: 'p2',
                display_name: 'Mon Point Object',
                is_active: true,
                collection_days: { mon: true, tue: false },
                recurrence_pattern: null
            },
            // Point 3: Matches Tue, should be filtered out on Monday
            {
                id: 'p3',
                display_name: 'Tue Point',
                is_active: true,
                collection_days: ['tue'],
                recurrence_pattern: null
            },
            // Point 4: Mon but recurrence_pattern = "第2月曜日" (We will test with a date that is 1st week, so it should be filtered out)
            {
                id: 'p4',
                display_name: 'Mon 2nd Week Point',
                is_active: true,
                collection_days: ['mon'],
                recurrence_pattern: '第2月曜日'
            },
            // Point 5: Mon and recurrence_pattern = "第1" (Should match in 1st week)
            {
                id: 'p5',
                display_name: 'Mon 1st Week Point',
                is_active: true,
                collection_days: ['mon'],
                recurrence_pattern: '1'
            },
            // Point 6: null collection_days, should be excluded
            {
                id: 'p6',
                display_name: 'Null Days Point',
                is_active: true,
                collection_days: null,
                recurrence_pattern: null
            },
            // Point 7: Object format with Nth weekday key (e.g. { mon1: true, mon: false })
            {
                id: 'p7',
                display_name: 'Mon1 Object Point',
                is_active: true,
                collection_days: { mon1: true, mon: false },
                recurrence_pattern: null
            },
            // Point 8: Array format with Nth weekday key (e.g. ['mon1'])
            {
                id: 'p8',
                display_name: 'Mon1 Array Point',
                is_active: true,
                collection_days: ['mon1'],
                recurrence_pattern: null
            },
            // Point 9: Object format with another Nth weekday key (e.g. { mon2: true })
            {
                id: 'p9',
                display_name: 'Mon2 Object Point',
                is_active: true,
                collection_days: { mon2: true },
                recurrence_pattern: null
            },
            // Point 10: Array format with another Nth weekday key (e.g. ['mon2'])
            {
                id: 'p10',
                display_name: 'Mon2 Array Point',
                is_active: true,
                collection_days: ['mon2'],
                recurrence_pattern: null
            }
        ];

        vi.mocked(nativeSupabaseFetch).mockResolvedValue({
            data: mockPoints,
            error: null
        });

        // 2026-07-06 (Monday, 1st week of July. date.getDate() = 6. 6 / 7 = 0.85 -> ceil is 1. Nth week = 1.)
        const testDate1 = new Date('2026-07-06T10:00:00Z');
        const result1 = await PeriodicJobImporter.fetchPointsByDate(testDate1);

        // Expected matches on 1st Monday: p1, p2, p5, p7, p8
        const matchedIds1 = result1.map(p => p.id);
        expect(matchedIds1).toContain('p1');
        expect(matchedIds1).toContain('p2');
        expect(matchedIds1).toContain('p5');
        expect(matchedIds1).toContain('p7');
        expect(matchedIds1).toContain('p8');
        expect(matchedIds1).not.toContain('p3');
        expect(matchedIds1).not.toContain('p4');
        expect(matchedIds1).not.toContain('p6');
        expect(matchedIds1).not.toContain('p9');
        expect(matchedIds1).not.toContain('p10');

        // 2026-07-13 (Monday, 2nd week of July. date.getDate() = 13. 13 / 7 = 1.85 -> ceil is 2. Nth week = 2.)
        const testDate2 = new Date('2026-07-13T10:00:00Z');
        const result2 = await PeriodicJobImporter.fetchPointsByDate(testDate2);

        // Expected matches on 2nd Monday: p1, p2, p4, p9, p10
        const matchedIds2 = result2.map(p => p.id);
        expect(matchedIds2).toContain('p1');
        expect(matchedIds2).toContain('p2');
        expect(matchedIds2).toContain('p4');
        expect(matchedIds2).toContain('p9');
        expect(matchedIds2).toContain('p10');
        expect(matchedIds2).not.toContain('p3');
        expect(matchedIds2).not.toContain('p5');
        expect(matchedIds2).not.toContain('p6');
        expect(matchedIds2).not.toContain('p7');
        expect(matchedIds2).not.toContain('p8');
    });

    it('should throw error when fetch fails', async () => {
        vi.mocked(nativeSupabaseFetch).mockResolvedValue({
            data: null,
            error: { message: 'DB Error', status: 500 }
        });

        await expect(PeriodicJobImporter.fetchPointsByDate(new Date())).rejects.toEqual({
            message: 'DB Error',
            status: 500
        });
    });
});
