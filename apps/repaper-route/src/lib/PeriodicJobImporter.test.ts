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
            }
        ];

        vi.mocked(nativeSupabaseFetch).mockResolvedValue({
            data: mockPoints,
            error: null
        });

        // 2026-07-06 (Monday, 1st week of July since 1st is Wednesday? Wait:
        // July 1 is Wed, July 2 is Thu, July 3 is Fri, July 4 is Sat, July 5 is Sun, July 6 is Mon.
        // July 6 is indeed 1st Monday! date.getDate() = 6. 6 / 7 = 0.85 -> ceil is 1. Nth week = 1.
        const testDate = new Date('2026-07-06T10:00:00Z');

        const result = await PeriodicJobImporter.fetchPointsByDate(testDate);

        // Expected matches: p1, p2, p5
        const matchedIds = result.map(p => p.id);
        expect(matchedIds).toContain('p1');
        expect(matchedIds).toContain('p2');
        expect(matchedIds).toContain('p5');
        expect(matchedIds).not.toContain('p3');
        expect(matchedIds).not.toContain('p4');
        expect(matchedIds).not.toContain('p6');
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
