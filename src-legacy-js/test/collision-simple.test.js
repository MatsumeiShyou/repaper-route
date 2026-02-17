import { describe, it, expect } from 'vitest';
import { calculateCollision } from '../features/board/logic/collision';

describe('collision - calculateCollision only', () => {
    it('returns no overlap when slot is completely free', () => {
        const result = calculateCollision({
            proposedDriverId: 'd1',
            proposedStartMin: 400,
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
            { id: 'j1', driverId: 'd1', startTime: '6:00', duration: 60 }
        ];

        const result = calculateCollision({
            proposedDriverId: 'd1',
            proposedStartMin: 390,
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
            proposedStartMin: 360,
            proposedDuration: 60,
            ignoreJobId: 'j1',
            existingJobs,
            splits: []
        });

        expect(result.isOverlapError).toBe(false);
    });

    it('adjusts duration when job would overlap with another job', () => {
        const existingJobs = [
            { id: 'j2', driverId: 'd1', startTime: '7:00', duration: 30 }
        ];

        const result = calculateCollision({
            proposedDriverId: 'd1',
            proposedStartMin: 360,
            proposedDuration: 120,
            ignoreJobId: null,
            existingJobs,
            splits: []
        });

        expect(result.isOverlapError).toBe(false);
        expect(result.adjustedDuration).toBe(60);
    });

    it('adjusts duration when job would overlap with a split', () => {
        const splits = [
            { id: 's1', driverId: 'd1', time: '13:00' }
        ];

        const result = calculateCollision({
            proposedDriverId: 'd1',
            proposedStartMin: 720,
            proposedDuration: 120,
            ignoreJobId: null,
            existingJobs: [],
            splits
        });

        expect(result.isOverlapError).toBe(false);
        expect(result.adjustedDuration).toBe(60);
    });

    it('sets overlap error when available duration is less than 15 minutes', () => {
        const existingJobs = [
            { id: 'j2', driverId: 'd1', startTime: '6:10', duration: 30 }
        ];

        const result = calculateCollision({
            proposedDriverId: 'd1',
            proposedStartMin: 360,
            proposedDuration: 60,
            ignoreJobId: null,
            existingJobs,
            splits: []
        });

        expect(result.isOverlapError).toBe(true);
        expect(result.adjustedDuration).toBe(15);
    });

    it('does not detect collision for different drivers', () => {
        const existingJobs = [
            { id: 'j1', driverId: 'd2', startTime: '6:00', duration: 60 }
        ];

        const result = calculateCollision({
            proposedDriverId: 'd1',
            proposedStartMin: 360,
            proposedDuration: 60,
            ignoreJobId: null,
            existingJobs,
            splits: []
        });

        expect(result.isOverlapError).toBe(false);
        expect(result.adjustedDuration).toBe(60);
    });
});
