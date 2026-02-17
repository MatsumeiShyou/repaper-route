
import { describe, it, expect } from 'vitest';
import { timeToMinutes, minutesToTime, calculateTimeFromY } from './timeUtils';
import { calculateCollision } from './collision';

// -----------------------------------------------------------------------------
// Test Suite: Time Utils
// -----------------------------------------------------------------------------
describe('Time Utils', () => {
    it('should convert time string to minutes', () => {
        expect(timeToMinutes('06:00')).toBe(360);
        expect(timeToMinutes('12:30')).toBe(750);
        expect(timeToMinutes('00:00')).toBe(0);
    });

    it('should convert minutes to time string', () => {
        expect(minutesToTime(360)).toBe('06:00');
        expect(minutesToTime(750)).toBe('12:30');
        expect(minutesToTime(0)).toBe('00:00');
    });

    it('should handle rounding in minutesToTime', () => {
        expect(minutesToTime(365)).toBe('06:05');
    });
});

// -----------------------------------------------------------------------------
// Test Suite: Collision Logic
// -----------------------------------------------------------------------------
describe('Collision Logic', () => {
    const mockJobs = [
        { id: 'j1', driverId: 'd1', startTime: '08:00', duration: 60 }, // 08:00 - 09:00
        { id: 'j2', driverId: 'd1', startTime: '10:00', duration: 30 }, // 10:00 - 10:30
    ];

    it('should detect direct overlap', () => {
        const result = calculateCollision({
            proposedDriverId: 'd1',
            proposedStartMin: timeToMinutes('08:30'), // Overlaps with j1
            proposedDuration: 30,
            ignoreJobId: 'new',
            existingJobs: mockJobs,
            splits: []
        });
        expect(result.isOverlapError).toBe(true);
    });

    it('should allow placement in free slot', () => {
        const result = calculateCollision({
            proposedDriverId: 'd1',
            proposedStartMin: timeToMinutes('09:00'), // Fits between j1 and j2
            proposedDuration: 60,
            ignoreJobId: 'new',
            existingJobs: mockJobs,
            splits: []
        });
        expect(result.isOverlapError).toBe(false);
    });

    it('should ignore self overlap (resizing/moving same job)', () => {
        const result = calculateCollision({
            proposedDriverId: 'd1',
            proposedStartMin: timeToMinutes('08:30'),
            proposedDuration: 30,
            ignoreJobId: 'j1', // Ignoring self
            existingJobs: mockJobs,
            splits: []
        });
        expect(result.isOverlapError).toBe(false);
    });
});
