import { describe, it, expect } from 'vitest';
import { checkConstraints } from './ConstraintEngine';
import { LogicVehicle, LogicJob } from '../types';

describe('ConstraintEngine', () => {
    const mockVehicle: LogicVehicle = {
        id: 'v1',
        name: 'Test Vehicle',
        capacityWeight: 1000,
        startLocation: { lat: 35.0, lng: 135.0 }
    };

    it('重量制限内であれば Feasible であること', () => {
        const jobs: LogicJob[] = [
            { id: 'j1', weight: 500, pointId: 'p1', durationMinutes: 10, location: { lat: 35.1, lng: 135.1 } },
            { id: 'j2', weight: 400, pointId: 'p2', durationMinutes: 10, location: { lat: 35.2, lng: 135.2 } }
        ];
        const result = checkConstraints(mockVehicle, jobs);
        expect(result.isFeasible).toBe(true);
        expect(result.score).toBe(100);
    });

    it('重量制限を超えたら Infeasible であること', () => {
        const jobs: LogicJob[] = [
            { id: 'j1', weight: 600, pointId: 'p1', durationMinutes: 10, location: { lat: 35.1, lng: 135.1 } },
            { id: 'j2', weight: 500, pointId: 'p2', durationMinutes: 10, location: { lat: 35.2, lng: 135.2 } }
        ];
        const result = checkConstraints(mockVehicle, jobs);
        expect(result.isFeasible).toBe(false);
        expect(result.violations[0].type).toBe('積載量超過');
    });

    it('入場制限（車両不一致）で Infeasible であること', () => {
        const jobs: LogicJob[] = [{ id: 'j1', weight: 100, pointId: 'p1', durationMinutes: 10, location: { lat: 35.1, lng: 135.1 } }];
        const permissions = [
            { id: 'perm1', point_id: 'p1', driver_id: 'd1', vehicle_id: 'v2', is_active: true }
        ];
        const result = checkConstraints(mockVehicle, jobs, 'd1', permissions);
        expect(result.isFeasible).toBe(false);
        expect(result.violations[0].type).toBe('入場制限違反');
    });
});
