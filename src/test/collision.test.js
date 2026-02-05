import { describe, it, expect } from 'vitest';
import { calculateCollision, checkVehicleCompatibility } from '../features/board/logic/collision';

describe('collision', () => {
    describe('calculateCollision', () => {
        it('returns no overlap when slot is completely free', () => {
            const result = calculateCollision({
                proposedDriverId: 'd1',
                proposedStartMin: 400, // 6:40
                proposedDuration: 60,
                ignoreJobId: null,
                existingJobs: [],
                splits: []
            });

            expect(result.isOverlapError).toBe(false);
            expect(result.adjustedDuration).toBe(60);
        });

        it('detects overlap when start time is inside existing job', () => {
            const existingJobs = [
                { id: 'j1', driverId: 'd1', startTime: '6:00', duration: 60 } // 360-420
            ];

            const result = calculateCollision({
                proposedDriverId: 'd1',
                proposedStartMin: 390, // 6:30 (inside 6:00-7:00)
                proposedDuration: 30,
                ignoreJobId: null,
                existingJobs,
                splits: []
            });

            expect(result.isOverlapError).toBe(true);
        });

        it('ignores self when checking collision', () => {
            const existingJobs = [
                { id: 'j1', driverId: 'd1', startTime: '6:00', duration: 60 }
            ];

            const result = calculateCollision({
                proposedDriverId: 'd1',
                proposedStartMin: 360, // 6:00 (same as j1)
                proposedDuration: 60,
                ignoreJobId: 'j1', // Ignore self
                existingJobs,
                splits: []
            });

            expect(result.isOverlapError).toBe(false);
        });

        it('adjusts duration when job would overlap with another job', () => {
            const existingJobs = [
                { id: 'j2', driverId: 'd1', startTime: '7:00', duration: 30 } // 420-450
            ];

            const result = calculateCollision({
                proposedDriverId: 'd1',
                proposedStartMin: 360, // 6:00
                proposedDuration: 120, // Would extend to 8:00 (480), but j2 is at 7:00
                ignoreJobId: null,
                existingJobs,
                splits: []
            });

            expect(result.isOverlapError).toBe(false);
            expect(result.adjustedDuration).toBe(60); // Adjusted to end at 7:00
        });

        it('adjusts duration when job would overlap with a split', () => {
            const splits = [
                { id: 's1', driverId: 'd1', time: '13:00' } // 780
            ];

            const result = calculateCollision({
                proposedDriverId: 'd1',
                proposedStartMin: 720, // 12:00
                proposedDuration: 120, // Would extend to 14:00, but split at 13:00
                ignoreJobId: null,
                existingJobs: [],
                splits
            });

            expect(result.isOverlapError).toBe(false);
            expect(result.adjustedDuration).toBe(60); // Adjusted to end at 13:00
        });

        it('sets overlap error when available duration is less than 15 minutes', () => {
            const existingJobs = [
                { id: 'j2', driverId: 'd1', startTime: '6:10', duration: 30 } // 370-400
            ];

            const result = calculateCollision({
                proposedDriverId: 'd1',
                proposedStartMin: 360, // 6:00
                proposedDuration: 60,
                ignoreJobId: null,
                existingJobs,
                splits: []
            });

            // Available duration is 10 minutes (6:00 to 6:10)
            // Logic sets isOverlapError=true when available < 15min, and duration=15
            expect(result.isOverlapError).toBe(true);
            expect(result.adjustedDuration).toBe(15); // Minimum duration
        });
        it('does not detect collision for different drivers', () => {
            const existingJobs = [
                { id: 'j1', driverId: 'd2', startTime: '6:00', duration: 60 }
            ];

            const result = calculateCollision({
                proposedDriverId: 'd1',
                proposedStartMin: 360, // 6:00 (same time as j1, but different driver)
                proposedDuration: 60,
                ignoreJobId: null,
                existingJobs,
                splits: []
            });

            expect(result.isOverlapError).toBe(false);
            expect(result.adjustedDuration).toBe(60);
        });
    });

    describe('checkVehicleCompatibility', () => {
        const drivers = [
            { id: 'd1', currentVehicle: '2025PK' },
            { id: 'd2', currentVehicle: '2267PK' }
        ];

        it('returns false when no vehicle is required', () => {
            const result = checkVehicleCompatibility('d1', 360, [], drivers, null);
            expect(result).toBe(false);
        });

        it('returns false when vehicle matches', () => {
            const result = checkVehicleCompatibility('d1', 360, [], drivers, '2025PK');
            expect(result).toBe(false);
        });

        it('returns true when vehicle does not match', () => {
            const result = checkVehicleCompatibility('d1', 360, [], drivers, '2267PK');
            expect(result).toBe(true);
        });

        it('uses split vehicle when time is after split', () => {
            const splits = [
                { id: 's1', driverId: 'd1', time: '13:00', vehicle: '2618PK' }
            ];

            // Before split (12:00): uses currentVehicle (2025PK)
            const beforeSplit = checkVehicleCompatibility('d1', 720, splits, drivers, '2618PK');
            expect(beforeSplit).toBe(true); // Mismatch

            // After split (14:00): uses split vehicle (2618PK)
            const afterSplit = checkVehicleCompatibility('d1', 840, splits, drivers, '2618PK');
            expect(afterSplit).toBe(false); // Match
        });

        it('uses most recent split when multiple splits exist', () => {
            const splits = [
                { id: 's1', driverId: 'd1', time: '9:00', vehicle: 'VEH_A' },
                { id: 's2', driverId: 'd1', time: '13:00', vehicle: 'VEH_B' },
                { id: 's3', driverId: 'd1', time: '16:00', vehicle: 'VEH_C' }
            ];

            // At 14:00, should use VEH_B (most recent before 14:00)
            const result = checkVehicleCompatibility('d1', 840, splits, drivers, 'VEH_B');
            expect(result).toBe(false); // Match
        });

        it('returns false when driver not found', () => {
            const result = checkVehicleCompatibility('d999', 360, [], drivers, '2025PK');
            expect(result).toBe(false);
        });
    });
});
