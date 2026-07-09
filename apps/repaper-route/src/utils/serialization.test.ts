import { describe, it, expect } from 'vitest';
import { serializeMasterData, normalizeDays, cleansePurgedFields } from './serialization';
import { MasterField } from '../types/master';

describe('serialization', () => {
    describe('serializeMasterData', () => {
        it('should serialize fields correctly based on types', () => {
            const formData = {
                id: 1,
                name: 'Test Point',
                is_active: 'true', // will be converted to boolean if switch/boolean type
                limit: '',
                days: ['Mon', 'Wed']
            };

            const fields: MasterField[] = [
                { name: 'id', label: 'ID', type: 'number' },
                { name: 'name', label: 'Name', type: 'text' },
                { name: 'is_active', label: 'Active', type: 'switch' },
                { name: 'limit', label: 'Limit', type: 'number' },
                { name: 'days', label: 'Days', type: 'days' }
            ];

            const result = serializeMasterData(formData, fields, 'test_table');

            expect(result.id).toBe(1);
            expect(result.name).toBe('Test Point');
            expect(result.is_active).toBe(true);
            expect(result.limit).toBeNull();
            expect(result.days).toEqual({
                mon: true,
                tue: false,
                wed: true,
                thu: false,
                fri: false,
                sat: false,
                sun: false,
                hol: false,
                oth: false
            });
        });
    });

    describe('normalizeDays', () => {
        it('should handle falsy values', () => {
            expect(normalizeDays(null)).toEqual([]);
            expect(normalizeDays(undefined)).toEqual([]);
        });

        it('should normalize DB object to array', () => {
            const dbDays = {
                mon: true,
                tue: false,
                wed: true,
                mon1: true,
                mon2: false
            };
            const result = normalizeDays(dbDays);
            expect(result).toContain('Mon');
            expect(result).not.toContain('Tue');
            expect(result).toContain('Wed');
            expect(result).toContain('Mon1');
            expect(result).not.toContain('Mon2');
        });

        it('should normalize array of days', () => {
            expect(normalizeDays(['Mon', 'Tue', null, undefined])).toEqual(['Mon', 'Tue']);
        });

        it('should normalize comma-separated string', () => {
            expect(normalizeDays('Mon, Tue, Wed')).toEqual(['Mon', 'Tue', 'Wed']);
        });
    });

    describe('cleansePurgedFields', () => {
        it('should recursively remove purged keys', () => {
            const data = {
                id: 101,
                name: 'Clean Item',
                is_spot: true, // purged
                special_type: 'VIP', // purged
                nested: {
                    value: 'test',
                    is_spot_only: false // purged
                },
                list: [
                    { id: 1, time_constraint_type: 'strict' }, // purged
                    { id: 2, is_template: true } // purged
                ]
            };

            const cleansed = cleansePurgedFields(data);

            expect(cleansed.is_spot).toBeUndefined();
            expect(cleansed.special_type).toBeUndefined();
            expect(cleansed.nested.is_spot_only).toBeUndefined();
            expect(cleansed.nested.value).toBe('test');
            expect(cleansed.list[0].time_constraint_type).toBeUndefined();
            expect(cleansed.list[0].id).toBe(1);
            expect(cleansed.list[1].is_template).toBeUndefined();
            expect(cleansed.list[1].id).toBe(2);
        });
    });
});
