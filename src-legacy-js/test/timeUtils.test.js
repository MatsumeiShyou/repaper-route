import { describe, it, expect } from 'vitest';
import { timeToMinutes, minutesToTime, calculateTimeFromY } from '../features/board/logic/timeUtils';

describe('timeUtils', () => {
    describe('timeToMinutes', () => {
        it('converts "00:00" to 0 minutes', () => {
            expect(timeToMinutes('0:00')).toBe(0);
        });

        it('converts "06:30" to 390 minutes', () => {
            expect(timeToMinutes('6:30')).toBe(390);
        });

        it('converts "13:45" to 825 minutes', () => {
            expect(timeToMinutes('13:45')).toBe(825);
        });

        it('converts "23:59" to 1439 minutes', () => {
            expect(timeToMinutes('23:59')).toBe(1439);
        });

        it('handles null/undefined by returning 0', () => {
            expect(timeToMinutes(null)).toBe(0);
            expect(timeToMinutes(undefined)).toBe(0);
        });
    });

    describe('minutesToTime', () => {
        it('converts 0 minutes to "0:00"', () => {
            expect(minutesToTime(0)).toBe('0:00');
        });

        it('converts 390 minutes to "6:30"', () => {
            expect(minutesToTime(390)).toBe('6:30');
        });

        it('converts 825 minutes to "13:45"', () => {
            expect(minutesToTime(825)).toBe('13:45');
        });

        it('converts 1439 minutes to "23:59"', () => {
            expect(minutesToTime(1439)).toBe('23:59');
        });

        it('pads single-digit minutes with zero', () => {
            expect(minutesToTime(65)).toBe('1:05');
        });
    });

    describe('calculateTimeFromY', () => {
        it('calculates 0 minutes from y=0', () => {
            expect(calculateTimeFromY(0)).toBe(0);
        });

        it('calculates 15 minutes from y=32 (one cell)', () => {
            expect(calculateTimeFromY(32)).toBe(15);
        });

        it('calculates 30 minutes from y=64 (two cells)', () => {
            expect(calculateTimeFromY(64)).toBe(30);
        });

        it('calculates 60 minutes from y=128 (four cells)', () => {
            expect(calculateTimeFromY(128)).toBe(60);
        });

        it('rounds to nearest 15-minute block for y=48 (1.5 cells)', () => {
            expect(calculateTimeFromY(48)).toBe(30);
        });

        it('handles negative Y values', () => {
            expect(calculateTimeFromY(-32)).toBe(-15);
        });
    });

    describe('round-trip conversion', () => {
        it('maintains consistency: time -> minutes -> time', () => {
            const originalTime = '14:45';
            const minutes = timeToMinutes(originalTime);
            const convertedBack = minutesToTime(minutes);
            expect(convertedBack).toBe(originalTime);
        });

        it('maintains consistency for multiple times', () => {
            const times = ['6:00', '6:15', '6:30', '12:00', '17:45'];
            times.forEach(time => {
                const minutes = timeToMinutes(time);
                const convertedBack = minutesToTime(minutes);
                expect(convertedBack).toBe(time);
            });
        });
    });
});
