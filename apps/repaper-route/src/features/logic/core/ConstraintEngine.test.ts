import { describe, it, expect } from 'vitest';
import { checkConstraints } from './ConstraintEngine';
import { LogicVehicle, LogicJob } from '../types';
import { StaffPermissions } from '../../os/auth/types';
import { resolveVehicleSpec } from './VehicleSpecManifest';

describe('ConstraintEngine V2 (Logic Deep Edition)', () => {
    const mockAdminPerms: StaffPermissions = {
        can_edit_board: true,
        can_manage_master: true,
        can_edit_past_records: true
    };

    const mockStaffPerms: StaffPermissions = {
        can_edit_board: true,
        can_manage_master: false,
        can_edit_past_records: false
    };

    describe('VehicleSpecManifest Integration (積載量制限の決定論的判定)', () => {
        it('軽トラ (350kg) に 400kg の案件を積もうとすると L1 違反となること', () => {
            const spec = resolveVehicleSpec('v-light', '軽自動車', '軽トラ-01');
            const vehicle: LogicVehicle = {
                id: 'v-light',
                name: 'Kei',
                capacityWeight: spec.capacityWeight || 0,
                startLocation: { lat: 0, lng: 0 }
            };
            const jobs: LogicJob[] = [{ id: 'j1', weight: 400, pointId: 'p1', durationMinutes: 10, location: { lat: 0, lng: 0 }, targetDate: '2026-04-18' }];
            
            const result = checkConstraints(vehicle, jobs, undefined, undefined, mockAdminPerms, '2026-04-18');
            expect(result.isFeasible).toBe(false);
            expect(result.violations.some(v => v.type === '重量制限過多')).toBe(true);
        });

        it('4t車 (4000kg) に 3500kg の案件を積むのは許可されること', () => {
            const spec = resolveVehicleSpec('v-4t', '4tトラック', 'B-4t-01');
            const vehicle: LogicVehicle = {
                id: 'v-4t',
                name: '4t Truck',
                capacityWeight: spec.capacityWeight || 0,
                startLocation: { lat: 0, lng: 0 }
            };
            const jobs: LogicJob[] = [{ id: 'j1', weight: 3500, pointId: 'p1', durationMinutes: 10, location: { lat: 0, lng: 0 }, targetDate: '2026-04-18' }];
            
            const result = checkConstraints(vehicle, jobs, undefined, undefined, mockAdminPerms, '2026-04-18');
            expect(result.isFeasible).toBe(true);
        });

        it('マニフェストにない車両はデフォルト重量 (500kg) が適用されること', () => {
            const spec = resolveVehicleSpec('v-unknown', '謎の車両', 'Unknown');
            expect(spec.capacityWeight).toBe(500); // 性能マニフェストの DEFAULT_SPEC
        });
    });

    describe('ReadOnly Gate (論理編集ガード)', () => {
        const mockVehicle: LogicVehicle = { id: 'v1', name: 'T', capacityWeight: 1000, startLocation: { lat: 0, lng: 0 } };
        const today = '2026-04-18';
        const yesterday = '2026-04-17';

        it('一般スタッフ権限で過去日を編集しようとすると L1 違反となること', () => {
            const jobs: LogicJob[] = [{ id: 'j1', weight: 100, pointId: 'p1', durationMinutes: 10, location: { lat: 0, lng: 0 }, targetDate: yesterday }];
            const result = checkConstraints(mockVehicle, jobs, undefined, undefined, mockStaffPerms, today);
            expect(result.isFeasible).toBe(false);
            expect(result.reason.some(r => r.includes('過去データの編集権限がありません'))).toBe(true);
        });

        it('一般スタッフ権限でも本日または未来の編集は許可されること', () => {
            const jobs: LogicJob[] = [{ id: 'j1', weight: 100, pointId: 'p1', durationMinutes: 10, location: { lat: 0, lng: 0 }, targetDate: today }];
            const result = checkConstraints(mockVehicle, jobs, undefined, undefined, mockStaffPerms, today);
            expect(result.isFeasible).toBe(true);
        });
    });

    describe('Legacy Constraints (基底制約)', () => {
        const mockVehicle: LogicVehicle = { id: 'v1', name: 'T', capacityWeight: 1000, startLocation: { lat: 0, lng: 0 }, inspectionExpiry: '2026-12-31' };

        it('車検切れの場合に L1 違反となること', () => {
            const oldVehicle: LogicVehicle = { ...mockVehicle, inspectionExpiry: '2025-01-01' };
            const jobs: LogicJob[] = [{ id: 'j1', weight: 100, pointId: 'p1', durationMinutes: 10, location: { lat: 0, lng: 0 }, targetDate: '2026-03-01' }];
            const result = checkConstraints(oldVehicle, jobs, undefined, undefined, mockAdminPerms, '2026-03-01');
            expect(result.isFeasible).toBe(false);
            expect(result.violations.some(v => v.type === '車検切れ')).toBe(true);
        });

        it('多段遅延伝播を検知すること', () => {
            const jobs: LogicJob[] = [
                { id: 'j1', weight: 100, durationMinutes: 30, location: { lat: 0, lng: 0 }, targetDate: '2026-03-01', actualStartTime: '09:00' },
                { id: 'j2', weight: 100, durationMinutes: 30, location: { lat: 0, lng: 0 }, targetDate: '2026-03-01', actualStartTime: '09:10' } 
            ];
            const result = checkConstraints(mockVehicle, jobs, undefined, undefined, mockAdminPerms, '2026-03-01');
            expect(result.violations.some(v => v.type === '多段遅延伝播')).toBe(true);
        });
    });
});
