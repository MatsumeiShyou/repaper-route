import { describe, it, expect } from 'vitest';
import { SortingBuffer } from './SortingBuffer';
import { LicenseMatcher } from './LicenseMatcher';

describe('ResourceManagement Logic', () => {
    describe('SortingBuffer', () => {
        it('should reserve exactly 2 staff when enough drivers are available', () => {
            const drivers: any[] = [
                { id: '1', driver_name: 'D1', display_order: 1, is_active: true },
                { id: '2', driver_name: 'D2', display_order: 2, is_active: true },
                { id: '3', driver_name: 'D3', display_order: 3, is_active: true },
            ];
            const { reserved, remaining } = SortingBuffer.reserveSortingStaff(drivers);
            expect(reserved).toHaveLength(2);
            expect(remaining).toHaveLength(1);
            expect(reserved[0].id).toBe('1');
        });

        it('should reserve all staff if 2 or fewer are available', () => {
            const drivers: any[] = [
                { id: '1', driver_name: 'D1', display_order: 1, is_active: true },
            ];
            const { reserved, remaining } = SortingBuffer.reserveSortingStaff(drivers);
            expect(reserved).toHaveLength(1);
            expect(remaining).toHaveLength(0);
        });
    });

    describe('LicenseMatcher', () => {
        it('should allow MT driver to drive AT vehicle', () => {
            expect(LicenseMatcher.canDrive('MT', 'AT')).toBe(true);
        });

        it('should block AT driver from driving MT vehicle', () => {
            expect(LicenseMatcher.canDrive('AT', 'MT')).toBe(false);
        });

        it('should allow LRG license for everything', () => {
            expect(LicenseMatcher.canDrive('LRG', 'MT')).toBe(true);
            expect(LicenseMatcher.canDrive('LRG', 'MID')).toBe(true);
        });
    });
});
