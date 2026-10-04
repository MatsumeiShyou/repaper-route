import { describe, it, expect } from 'vitest';
import { checkConstraints } from './ConstraintEngine';
import { LogicVehicle, LogicJob } from '../types';

describe('ConstraintEngine V2', () => {
    const mockVehicle: LogicVehicle = {
        id: 'v1',
        name: 'Test Vehicle',
        capacityWeight: 1000,
        startLocation: { lat: 35.0, lng: 135.0 },
        inspectionExpiry: '2026-12-31'
    };

    it('重量制限�Eであれば Feasible であり、L1違反がなぁE��と', () => {
        const jobs: LogicJob[] = [
            { id: 'j1', weight: 500, pointId: 'p1', durationMinutes: 10, location: { lat: 35.1, lng: 135.1 }, targetDate: '2026-03-01' },
            { id: 'j2', weight: 400, pointId: 'p2', durationMinutes: 10, location: { lat: 35.2, lng: 135.2 }, targetDate: '2026-03-01' }
        ];
        const result = checkConstraints(mockVehicle, jobs);
        expect(result.isFeasible).toBe(true);
        expect(result.score).toBeGreaterThan(0);
        expect(result.violations.filter(v => v.tier === 'L1')).toHaveLength(0);
    });

    it('重量制限を趁E��たら L1 違反となめEInfeasible であること', () => {
        const jobs: LogicJob[] = [
            { id: 'j1', weight: 600, pointId: 'p1', durationMinutes: 10, location: { lat: 35.1, lng: 135.1 }, targetDate: '2026-03-01' },
            { id: 'j2', weight: 500, pointId: 'p2', durationMinutes: 10, location: { lat: 35.2, lng: 135.2 }, targetDate: '2026-03-01' }
        ];
        const result = checkConstraints(mockVehicle, jobs);
        expect(result.isFeasible).toBe(false);
        expect(result.violations.some(v => v.tier === 'L1' && v.type === '重量制限過夁E')).toBe(true);
    });

    it('車検�Eれ�E場合に L1 違反となること', () => {
        const oldVehicle: LogicVehicle = { ...mockVehicle, inspectionExpiry: '2025-01-01' };
        const jobs: LogicJob[] = [{ id: 'j1', weight: 100, pointId: 'p1', durationMinutes: 10, location: { lat: 35.1, lng: 135.1 }, targetDate: '2026-03-01' }];
        const result = checkConstraints(oldVehicle, jobs);
        expect(result.isFeasible).toBe(false);
        expect(result.violations.some(v => v.type === '車検�EめE')).toBe(true);
    });

    it('時間乖離ぁE5刁E��趁E��ると L2 警告が発生すること', () => {
        const jobs: LogicJob[] = [
            {
                id: 'j1', weight: 100, pointId: 'p1', durationMinutes: 10, location: { lat: 35.1, lng: 135.1 },
                targetDate: '2026-03-01', preferredStartTime: '09:00', actualStartTime: '09:20'
            }
        ];
        const result = checkConstraints(mockVehicle, jobs);
        expect(result.isFeasible).toBe(true); // L2はFeasibleに影響しなぁE        expect(result.violations.some(v => v.tier === 'L2' && v.type === '時間持E��乖離')).toBe(true);
    });

    it('多段遁E��伝播を検知すること', () => {
        const jobs: LogicJob[] = [
            { id: 'j1', weight: 100, durationMinutes: 30, location: { lat: 35.1, lng: 135.1 }, targetDate: '2026-03-01', actualStartTime: '09:00' },
            { id: 'j2', weight: 100, durationMinutes: 30, location: { lat: 35.1, lng: 135.1 }, targetDate: '2026-03-01', actualStartTime: '09:10' } // j1が終わる前に開始してぁE��矛盾
        ];
        const result = checkConstraints(mockVehicle, jobs);
        expect(result.propagation?.delayMinutes).toBeGreaterThan(0);
        expect(result.violations.some(v => v.type === '多段遁E��伝播')).toBe(true);
    });

    it('五十日補正によりスコアが減衰すること', () => {
        const normalJobs: LogicJob[] = [{ id: 'j1', weight: 100, durationMinutes: 10, location: { lat: 0, lng: 0 }, targetDate: '2026-03-02' }];
        const gotobiJobs: LogicJob[] = [{ id: 'j1', weight: 100, durationMinutes: 10, location: { lat: 0, lng: 0 }, targetDate: '2026-03-01' }]; // 1日は五十日扱ぁE
        const normalResult = checkConstraints(mockVehicle, normalJobs);
        const gotobiResult = checkConstraints(mockVehicle, gotobiJobs);

        expect(gotobiResult.score).toBeLessThan(normalResult.score);
        expect(gotobiResult.reason.some(r => r.includes('五十日補正'))).toBe(true);
    });
});
