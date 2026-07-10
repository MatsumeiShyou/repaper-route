import { describe, it, expect } from 'vitest';
import { universalSort } from './sortUtils';

describe('universalSort', () => {
    it('should sort numbers correctly in ascending and descending order', () => {
        const list = [{ val: 10 }, { val: 2 }, { val: 5 }];
        
        const asc = [...list].sort((a, b) => universalSort(a, b, 'val', 'asc'));
        expect(asc).toEqual([{ val: 2 }, { val: 5 }, { val: 10 }]);

        const desc = [...list].sort((a, b) => universalSort(a, b, 'val', 'desc'));
        expect(desc).toEqual([{ val: 10 }, { val: 5 }, { val: 2 }]);
    });

    it('should sort booleans correctly', () => {
        const list = [{ val: true }, { val: false }, { val: true }];
        
        const asc = [...list].sort((a, b) => universalSort(a, b, 'val', 'asc'));
        expect(asc[0].val).toBe(true); // true comes first in ascending? (true ? -1 : 1)
        expect(asc[1].val).toBe(true);
        expect(asc[2].val).toBe(false);
    });

    it('should sort dates correctly', () => {
        const list = [
            { date: '2026-07-10' },
            { date: '2026-07-08' },
            { date: '2026-07-09' }
        ];

        const asc = [...list].sort((a, b) => universalSort(a, b, 'date', 'asc'));
        expect(asc).toEqual([
            { date: '2026-07-08' },
            { date: '2026-07-09' },
            { date: '2026-07-10' }
        ]);
    });

    it('should sort Japanese strings and numbers naturally', () => {
        const list = [
            { name: 'あ10' },
            { name: 'あ2' },
            { name: 'い1' }
        ];

        const asc = [...list].sort((a, b) => universalSort(a, b, 'name', 'asc'));
        expect(asc).toEqual([
            { name: 'あ2' },
            { name: 'あ10' },
            { name: 'い1' }
        ]);
    });

    it('should always sort null/undefined values to the end', () => {
        const list = [
            { val: 10 },
            { val: null },
            { val: 2 },
            { val: undefined }
        ];

        const asc = [...list].sort((a, b) => universalSort(a, b, 'val', 'asc'));
        // 2, 10, then null/undefined (null/undefined at index 2 and 3)
        expect(asc[0].val).toBe(2);
        expect(asc[1].val).toBe(10);
        expect(asc[2].val == null).toBe(true);
        expect(asc[3].val == null).toBe(true);

        const desc = [...list].sort((a, b) => universalSort(a, b, 'val', 'desc'));
        // 10, 2, then null/undefined (still at the end)
        expect(desc[0].val).toBe(10);
        expect(desc[1].val).toBe(2);
        expect(desc[2].val == null).toBe(true);
        expect(desc[3].val == null).toBe(true);
    });

    it('should sort null/undefined elements to the end', () => {
        const list = [
            { val: 10 },
            null,
            { val: 2 },
            undefined
        ];
        const asc = [...list].sort((a, b) => universalSort(a, b, 'val', 'asc'));
        expect(asc[0]?.val).toBe(2);
        expect(asc[1]?.val).toBe(10);
        expect(asc[2]).toBeNull();
        expect(asc[3]).toBeUndefined();
    });

    it('should handle NaN elements stably by sorting them to the end', () => {
        const list = [
            { val: 10 },
            { val: NaN },
            { val: 2 }
        ];
        const asc = [...list].sort((a, b) => universalSort(a, b, 'val', 'asc'));
        expect(asc[0].val).toBe(2);
        expect(asc[1].val).toBe(10);
        expect(isNaN(asc[2].val as number)).toBe(true);
    });

    it('should sort Date objects correctly', () => {
        const list = [
            { date: new Date('2026-07-10') },
            { date: new Date('2026-07-08') },
            { date: new Date('2026-07-09') }
        ];
        const asc = [...list].sort((a, b) => universalSort(a, b, 'date', 'asc'));
        expect(asc[0].date.getTime()).toBe(new Date('2026-07-08').getTime());
        expect(asc[1].date.getTime()).toBe(new Date('2026-07-09').getTime());
        expect(asc[2].date.getTime()).toBe(new Date('2026-07-10').getTime());
    });
});
