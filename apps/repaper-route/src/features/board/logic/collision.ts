import { BoardJob, BoardSplit, BoardDriver } from '../../../types';
import { checkConstraints } from '../../logic/core/ConstraintEngine';
import { calculateScore } from '../../logic/score/ScoringEngine';
import { LogicJob, LogicVehicle, PointAccessPermission } from '../../logic/types';
import { resolveVehicleSpec } from '../../logic/core/VehicleSpecManifest';
import { StaffPermissions } from '../../os/auth/types';
import { timeToMinutes } from './timeUtils';

interface CollisionCheckParams {
    proposedDriverId: string;
    proposedStartMin: number;
    proposedDuration: number;
    ignoreJobId?: string;
    existingJobs: BoardJob[];
    splits: BoardSplit[];
    isResize?: boolean;
    drivers?: BoardDriver[];
    // Phase D: 入場制限ルール（省略可 = 制約なし）
    pointPermissions?: PointAccessPermission[];
    // Phase 6: 編集権限ガード用
    permissions?: StaffPermissions;
    today?: string;
    targetDate?: string;
}

export const calculateCollision = ({
    proposedDriverId,
    proposedStartMin,
    proposedDuration,
    ignoreJobId,
    existingJobs,
    drivers = [],
    pointPermissions = [],
    permissions,
    today,
    targetDate
}: CollisionCheckParams) => {
    // 1. 物理的な重なりチェック & 救済ロジック
    const otherJobs = existingJobs.filter(j => j.driverId === proposedDriverId && j.id !== ignoreJobId);
    let isOverlapError = false;
    let isWarning = false;
    let adjustedDuration = proposedDuration;

    let currentStartMin = proposedStartMin;

    for (const job of otherJobs) {
        const jobStartMin = timeToMinutes(job.startTime || job.timeConstraint || '06:00');
        const jobEndMin = jobStartMin + job.duration;

        if (currentStartMin < jobEndMin && (currentStartMin + adjustedDuration) > jobStartMin) {
            // Case 1: Dragging from BELOW (Existing job is above)
            if (currentStartMin < jobEndMin && currentStartMin >= jobStartMin) {
                const snapStartMin = jobEndMin;
                const reduction = snapStartMin - currentStartMin;
                if (adjustedDuration - reduction >= 15) {
                    adjustedDuration -= reduction;
                    currentStartMin = snapStartMin;
                    isWarning = true;
                } else {
                    isOverlapError = true;
                }
            } 
            // Case 2: Dragging from ABOVE (Existing job is below)
            else if ((currentStartMin + adjustedDuration) > jobStartMin && currentStartMin < jobStartMin) {
                const allowedDuration = jobStartMin - currentStartMin;
                if (allowedDuration >= 15) {
                    adjustedDuration = allowedDuration;
                    isWarning = true;
                } else {
                    isOverlapError = true;
                }
            } else {
                isOverlapError = true;
            }
        }
    }

    // 2. Logic Base による制約チェック
    const driver = drivers.find(d => d.id === proposedDriverId);
    const jobsInCol = existingJobs.filter(j => j.driverId === proposedDriverId && j.id !== ignoreJobId);

    let constraintResult: { isFeasible: boolean; violations: any[]; score: number; reason: string[] } = {
        isFeasible: true,
        violations: [],
        score: 100,
        reason: []
    };

    if (driver) {
        const vehicleSpec = resolveVehicleSpec(
            driver.id,
            (driver as any).vehicleNumber,
            driver.vehicleCallsign,
            (driver as any).max_payload
        );

        const logicVehicle: LogicVehicle = {
            id: driver.id,
            name: driver.name,
            capacityWeight: vehicleSpec.capacityWeight,
            startLocation: { lat: 35.44, lng: 139.36 }
        };

        // ドラッグ中の案件自体の情報を取得
        const targetJob = existingJobs.find(j => j.id === ignoreJobId);

        // 既存の案件 + ドラッグ中の案件をシミュレーション
        const logicJobs: LogicJob[] = [
            ...jobsInCol.map(j => ({
                id: j.id,
                weight: (j as any).weight_kg || 0,
                durationMinutes: j.duration,
                location: { lat: 35.44, lng: 139.36 },
                pointId: (j as any).pointId,
                targetDate: targetDate || '2024-01-01',
                // 既存案件の時間をパースして注入（多段遅延判定用）
                actualStartTime: j.startTime || j.timeConstraint || undefined
            })),
            ...(targetJob ? [{
                id: targetJob.id,
                weight: (targetJob as any).weight_kg || 0,
                durationMinutes: proposedDuration, // リサイズ中の場合も考慮
                location: { lat: 35.44, lng: 139.36 },
                pointId: (targetJob as any).pointId,
                targetDate: targetDate || '2024-01-01',
                actualStartTime: `${Math.floor(proposedStartMin / 60).toString().padStart(2, '0')}:${(proposedStartMin % 60).toString().padStart(2, '0')}`
            }] : [])
        ];

        const checkRes = checkConstraints(logicVehicle, logicJobs, driver.id, pointPermissions, permissions, today);
        const scoreRes = calculateScore(logicJobs);

        constraintResult = {
            ...checkRes,
            score: scoreRes.score,
            reason: [...(checkRes.reason || []), ...(scoreRes.reason || [])]
        };
    }

    return {
        isOverlapError: isOverlapError || !constraintResult.isFeasible,
        isWarning: isWarning,
        adjustedDuration,
        adjustedStartMin: isWarning ? currentStartMin : undefined,
        logicResult: constraintResult
    };
};

export const checkVehicleCompatibility = (
    driverId: string,
    _startMin: number,
    _splits: BoardSplit[],
    drivers: BoardDriver[],
    requiredVehicle?: string
) => {
    if (!requiredVehicle || requiredVehicle === '未定' || requiredVehicle === 'なし') return false;

    const driver = drivers.find(d => d.id === driverId);
    if (!driver) return true;

    // TODO: 車種適合性チェックの Logic Base 移管
    return false;
};
