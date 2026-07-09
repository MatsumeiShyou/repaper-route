import { describe, it, expect } from 'vitest';
import { universalSort } from './sortUtils';
import { serializeMasterData, normalizeDays, cleansePurgedFields } from './serialization';
import { MasterField } from '../types/master';

describe('Milestone 1 - Challenger Stress Tests', () => {

    describe('universalSort Adversarial Conditions', () => {
        it('should handle null/undefined or empty objects without crashing if they are parsed as keys', () => {
            const list = [
                { val: 5 },
                { val: null },
                { val: undefined },
                {},
                { val: 1 }
            ];

            const asc = [...list].sort((a, b) => universalSort(a, b, 'val', 'asc'));
            expect(asc[0].val).toBe(1);
            expect(asc[1].val).toBe(5);
            // null, undefined, and empty objects ({}) all result in val == null, so they should be at the end.
            expect(asc[2].val).toBeNull();
            expect(asc[3].val).toBeUndefined();
            expect(asc[4]).toEqual({});
        });

        it('should throw TypeError if the sorted objects themselves are null/undefined', () => {
            // Documenting behavior: passing null/undefined as elements inside the list is a critical risk
            // if universalSort doesn't check for them first.
            expect(() => {
                universalSort(null as any, { val: 1 }, 'val', 'asc');
            }).toThrow(TypeError);
        });

        it('should compare mixed types safely using localeCompare string fallback', () => {
            const list = [
                { val: 'banana' },
                { val: 10 },
                { val: true },
                { val: '2' },
                { val: false }
            ];

            // When comparing mixed types, it falls back to string localeCompare.
            // String values: 'banana', '10', 'true', '2', 'false'.
            // Numeric: true will sort '2' before '10'.
            const asc = [...list].sort((a, b) => universalSort(a, b, 'val', 'asc'));
            const stringified = asc.map(item => String(item.val));
            expect(stringified).toContain('banana');
            expect(stringified).toContain('10');
            expect(stringified).toContain('true');
            expect(stringified).toContain('2');
            expect(stringified).toContain('false');
            // Ensure it doesn't crash.
        });

        it('should handle extreme numbers (Infinity, NaN)', () => {
            const list = [
                { val: Infinity },
                { val: -Infinity },
                { val: NaN },
                { val: 5 }
            ];

            // NaN is typeof 'number', so valA - valB is executed.
            // NaN - Infinity is NaN.
            // Let's see if sorting completes without crash.
            const sorted = [...list].sort((a, b) => universalSort(a, b, 'val', 'asc'));
            expect(sorted.length).toBe(4);
        });

        it('should handle various date formats and malformed date strings', () => {
            const list = [
                { d: '2026-07-10' },
                { d: '2026-02-30' }, // malformed but includes '-' and length >= 10, new Date() parses to 2026-03-02
                { d: 'invalid-date' }, // fails isValidDate
                { d: '2026/07/09' }, // fails isValidDate because it lacks '-'
                { d: '2026-7-8' }, // fails isValidDate because length < 10
                { d: '2026-07-09T15:00:00Z' } // passes isValidDate
            ];

            // Ensures no crash when running sort
            const sorted = [...list].sort((a, b) => universalSort(a, b, 'd', 'asc'));
            expect(sorted.length).toBe(6);
        });
    });

    describe('serializeMasterData Adversarial Conditions', () => {
        it('should convert null value to 0 for number fields (potential vulnerability)', () => {
            const fields: MasterField[] = [
                { name: 'num_val', label: 'Num', type: 'number' }
            ];
            
            const formData = {
                num_val: null
            };

            const result = serializeMasterData(formData, fields, 'test');
            // Since Number(null) is 0, serializeMasterData serializes null as 0!
            expect(result.num_val).toBe(0);
        });

        it('should convert "abc" to NaN for number fields', () => {
            const fields: MasterField[] = [
                { name: 'num_val', label: 'Num', type: 'number' }
            ];
            const formData = {
                num_val: 'abc'
            };
            const result = serializeMasterData(formData, fields, 'test');
            expect(result.num_val).toBeNaN();
        });

        it('should serialize switch/boolean fields using double-negation', () => {
            const fields: MasterField[] = [
                { name: 'active', label: 'Active', type: 'switch' }
            ];

            // String "false" is truthy in JS, so !!"false" is true.
            expect(serializeMasterData({ active: 'false' }, fields, 'test').active).toBe(true);
            expect(serializeMasterData({ active: 0 }, fields, 'test').active).toBe(false);
            expect(serializeMasterData({ active: null }, fields, 'test').active).toBe(false);
        });

        it('should handle days fields with malformed values', () => {
            const fields: MasterField[] = [
                { name: 'days', label: 'Days', type: 'days' }
            ];

            // Array containing invalid day formats
            const result1 = serializeMasterData({ days: ['Mon', 'InvalidDay', 'Mon6', 'Tue3'] }, fields, 'test');
            expect(result1.days).toEqual({
                mon: true, tue: false, wed: false, thu: false, fri: false, sat: false, sun: false,
                hol: false, oth: false,
                tue3: true
            });

            // Passing a string instead of array or object
            const result2 = serializeMasterData({ days: 'Mon,Wed' }, fields, 'test');
            expect(result2.days).toBe('Mon,Wed');
        });
    });

    describe('normalizeDays Adversarial Conditions', () => {
        it('should handle non-boolean values in DB object format', () => {
            const dbDays = {
                mon: 'true', // string
                tue: 1, // number
                wed: true, // boolean true
                thu: false
            };
            const result = normalizeDays(dbDays);
            // Only wed is strictly true, so only 'Wed' should be returned.
            expect(result).toEqual(['Wed']);
        });

        it('should filter out "null" and "undefined" strings from arrays', () => {
            const arr = ['Mon', null, undefined, 'Wed', 'null', 'undefined'];
            const result = normalizeDays(arr);
            // The map(String) converts null/undefined to 'null'/'undefined',
            // and the filter removes 'null'/'undefined'.
            expect(result).toEqual(['Mon', 'Wed']);
        });

        it('should handle non-standard types safely', () => {
            expect(normalizeDays(123)).toEqual([]);
            expect(normalizeDays(true)).toEqual([]);
            expect(normalizeDays(Symbol('test'))).toEqual([]);
        });
    });

    describe('cleansePurgedFields Adversarial Conditions', () => {
        it('should handle null, undefined, and primitives', () => {
            expect(cleansePurgedFields(null)).toBeNull();
            expect(cleansePurgedFields(undefined)).toBeUndefined();
            expect(cleansePurgedFields('string')).toBe('string');
            expect(cleansePurgedFields(123)).toBe(123);
        });

        it('should destroy Date, RegExp, Map, and Set objects (major vulnerability)', () => {
            const date = new Date('2026-07-10');
            const regex = /abc/;
            const map = new Map();
            const set = new Set();

            // Because these are typeof 'object' and not arrays,
            // cleansePurgedFields attempts to clone them using { ...data },
            // which strips all properties and methods from these built-in types.
            expect(cleansePurgedFields(date)).toEqual({});
            expect(cleansePurgedFields(regex)).toEqual({});
            expect(cleansePurgedFields(map)).toEqual({});
            expect(cleansePurgedFields(set)).toEqual({});
        });

        it('should throw RangeError on cyclic references (denial of service risk)', () => {
            const obj: any = {};
            obj.self = obj;

            expect(() => {
                cleansePurgedFields(obj);
            }).toThrow(RangeError);
        });
    });
});
