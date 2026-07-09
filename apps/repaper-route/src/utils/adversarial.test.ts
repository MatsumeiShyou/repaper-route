import { describe, it, expect } from 'vitest';
import { serializeMasterData, normalizeDays, cleansePurgedFields } from './serialization';
import { universalSort } from './sortUtils';
import { MasterField } from '../types/master';

describe('Adversarial & Stress Tests', () => {

    describe('universalSort - Adversarial Cases', () => {
        it('should handle missing keys gracefully by sorting them to the end', () => {
            const list = [{ name: 'A', val: 10 }, { name: 'B' }, { name: 'C', val: 5 }];
            
            const asc = [...list].sort((a, b) => universalSort(a, b, 'val', 'asc'));
            expect(asc[0].name).toBe('C'); // val: 5
            expect(asc[1].name).toBe('A'); // val: 10
            expect(asc[2].name).toBe('B'); // val: undefined (sorted to end)

            const desc = [...list].sort((a, b) => universalSort(a, b, 'val', 'desc'));
            expect(desc[0].name).toBe('A'); // val: 10
            expect(desc[1].name).toBe('C'); // val: 5
            expect(desc[2].name).toBe('B'); // val: undefined (still sorted to end)
        });

        it('should compare mixed types (number vs string) using string localeCompare naturally', () => {
            const list = [{ val: 10 }, { val: '2' }, { val: '1.5' }];
            const asc = [...list].sort((a, b) => universalSort(a, b, 'val', 'asc'));
            // Since they are mixed types, they will fall back to string localeCompare with numeric: true.
            // "1.5" < "2" < "10"
            expect(asc[0].val).toBe('1.5');
            expect(asc[1].val).toBe('2');
            expect(asc[2].val).toBe(10);
        });

        it('should handle NaN value without crashing (though sort may be unstable)', () => {
            const list = [{ val: 10 }, { val: NaN }, { val: 5 }];
            const sortFunc = () => [...list].sort((a, b) => universalSort(a, b, 'val', 'asc'));
            expect(sortFunc).not.toThrow();
        });

        it('should handle malformed and valid date string mixing', () => {
            const list = [
                { date: '2026-07-10' },
                { date: 'invalid-date-with-dash' },
                { date: '2026-07-01' }
            ];
            const asc = [...list].sort((a, b) => universalSort(a, b, 'date', 'asc'));
            // Since 'invalid-date-with-dash' fails isValidDate, it gets compared as a string.
            // Let's assert it doesn't crash.
            expect(asc.length).toBe(3);
        });

        it('should handle dates with timezone offsets correctly', () => {
            const list = [
                { date: '2026-07-10T09:00:00+09:00' },
                { date: '2026-07-10T01:00:00Z' } // equivalent to 10:00:00+09:00
            ];
            const asc = [...list].sort((a, b) => universalSort(a, b, 'date', 'asc'));
            expect(asc[0].date).toBe('2026-07-10T09:00:00+09:00');
            expect(asc[1].date).toBe('2026-07-10T01:00:00Z');
        });
    });

    describe('serializeMasterData - Adversarial Cases', () => {
        const fields: MasterField[] = [
            { name: 'id', label: 'ID', type: 'number' },
            { name: 'is_active', label: 'Active', type: 'switch' },
            { name: 'days', label: 'Days', type: 'days' },
            { name: 'note', label: 'Note', type: 'text' }
        ];

        it('should crash when formData is null/undefined (verifying crash surface)', () => {
            expect(() => serializeMasterData(null as any, fields, 'test_table')).toThrow();
            expect(() => serializeMasterData(undefined as any, fields, 'test_table')).toThrow();
        });

        it('should crash when fields array is null/undefined (verifying crash surface)', () => {
            expect(() => serializeMasterData({}, null as any, 'test_table')).toThrow();
        });

        it('should convert null value of number field to 0 (potential regression/behavior observation)', () => {
            const result = serializeMasterData({ id: null as any }, fields, 'test_table');
            // Since null is not undefined, it goes to Number(null) which is 0!
            expect(result.id).toBe(0);
        });

        it('should convert undefined value to nothing (skip field)', () => {
            const result = serializeMasterData({ id: undefined }, fields, 'test_table');
            expect(result.id).toBeUndefined();
        });

        it('should convert empty string for number field to null', () => {
            const result = serializeMasterData({ id: '' as any }, fields, 'test_table');
            expect(result.id).toBeNull();
        });

        it('should handle malformed values for days field gracefully', () => {
            // value is a string instead of array
            const result1 = serializeMasterData({ days: 'Mon,Wed' as any }, fields, 'test_table');
            expect(result1.days).toBe('Mon,Wed');

            // value is a boolean
            const result2 = serializeMasterData({ days: true as any }, fields, 'test_table');
            expect(result2.days).toBe(true);

            // value is null
            const result3 = serializeMasterData({ days: null as any }, fields, 'test_table');
            expect(result3.days).toBeNull();
        });

        it('should handle N-th week format for days correctly', () => {
            const result = serializeMasterData({ days: ['Mon1', 'Sun5', 'invalidDay', 'Tue6'] }, fields, 'test_table');
            const daysObj = result.days as Record<string, boolean>;
            expect(daysObj.mon1).toBe(true);
            expect(daysObj.sun5).toBe(true);
            expect(daysObj.mon).toBe(false);
            expect(daysObj.tue6).toBeUndefined(); // Tue6 exceeds [1-5] limit so regex doesn't match
        });
    });

    describe('normalizeDays - Adversarial Cases', () => {
        it('should return empty array for non-truthy values, numbers, and functions', () => {
            expect(normalizeDays(0)).toEqual([]);
            expect(normalizeDays(false)).toEqual([]);
            expect(normalizeDays(123)).toEqual([]);
            expect(normalizeDays(() => {})).toEqual([]);
        });

        it('should parse comma-separated string containing weird whitespaces and empty values', () => {
            expect(normalizeDays(' Mon , , Wed , , Thu5 ')).toEqual(['Mon', 'Wed', 'Thu5']);
        });

        it('should handle arrays containing nested objects or weird types', () => {
            const result = normalizeDays(['Mon', null, undefined, { toString: () => 'Wed' }, {}, 123]);
            expect(result).toEqual(['Mon', 'Wed', '[object Object]', '123']);
        });

        it('should normalize DB object with custom proto and extra fields correctly', () => {
            const dbDays = Object.create({ inherited: true });
            dbDays.mon = true;
            dbDays.tue = false;
            dbDays.mon1 = true;
            dbDays.mon9 = true; // Mon9 is invalid N-th week (regex checks 1-5)

            const result = normalizeDays(dbDays);
            expect(result).toContain('Mon');
            expect(result).toContain('Mon1');
            expect(result).not.toContain('inherited');
            expect(result).not.toContain('Mon9');
        });

        it('should handle object types like Date and RegExp without crashing', () => {
            expect(normalizeDays(new Date())).toEqual([]);
            expect(normalizeDays(/abc/)).toEqual([]);
        });
    });

    describe('cleansePurgedFields - Adversarial Cases', () => {
        it('should pass through falsy/primitive values', () => {
            expect(cleansePurgedFields(null)).toBeNull();
            expect(cleansePurgedFields(undefined)).toBeUndefined();
            expect(cleansePurgedFields('')).toBe('');
            expect(cleansePurgedFields(0)).toBe(0);
            expect(cleansePurgedFields(false)).toBe(false);
        });

        it('should throw RangeError (Stack Overflow) on circular reference objects', () => {
            const circular: any = {};
            circular.self = circular;
            expect(() => cleansePurgedFields(circular)).toThrow(RangeError);
        });

        it('should corrupt Date and RegExp objects by converting them to empty plain objects (known behavior)', () => {
            const date = new Date('2026-07-10');
            const result = cleansePurgedFields(date);
            // Since Date is an object, cleansePurgedFields does { ...date } which results in empty object
            expect(result).toEqual({});
        });

        it('should handle null properties inside nested objects correctly', () => {
            const data = {
                id: 1,
                nested: {
                    info: null,
                    is_spot: true
                }
            };
            const result = cleansePurgedFields(data);
            expect(result.nested.info).toBeNull();
            expect(result.nested.is_spot).toBeUndefined();
        });
    });
});
