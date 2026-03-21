import { describe, it, expect } from 'vitest';
import { calculateCollision } from '../collision';
import { BoardJob } from '../../../types';

describe('calculateCollision symmetry check (Negative Proof)', () => {
    const existingJobs: BoardJob[] = [
        {
            id: 'job-1',
            driverId: 'driver-1',
            startTime: '09:00',
            duration: 60, // 09:00 - 10:00 (540 - 600)
            status: 'pending'
        } as any
    ];

    it('Case 2: Dragging from ABOVE (Existing job is below) -> Warning & Adjustment (Current: SUCCESS)', () => {
        const result = calculateCollision({
            proposedDriverId: 'driver-1',
            proposedStartMin: 510, // 08:30
            proposedDuration: 60,  // 08:30 - 09:30 (overlaps at 09:00)
            existingJobs,
            splits: []
        });

        // 09:00 - 08:30 = 30 min (allowed)
        expect(result.isOverlapError).toBe(false);
        expect(result.isWarning).toBe(true);
        expect(result.adjustedDuration).toBe(30);
    });

    it('Case 1: Dragging from BELOW (Existing job is above) -> Warning & Adjustment (Current: SUCCESS)', () => {
        const result = calculateCollision({
            proposedDriverId: 'driver-1',
            proposedStartMin: 570, // 09:30
            proposedDuration: 60,  // 09:30 - 10:30 (overlaps at 09:30)
            existingJobs,
            splits: []
        });

        // 10:00 - 09:30 = 30 min reduction. New start: 10:00. New duration: 30.
        expect(result.isOverlapError).toBe(false);
        expect(result.isWarning).toBe(true);
        expect(result.adjustedStartMin).toBe(600); // 10:00
        expect(result.adjustedDuration).toBe(30);
    });
});
