import { BoardJob, BoardSplit, BoardDriver } from '../../../types';
import { checkConstraints } from '../../logic/core/ConstraintEngine';
import { calculateScore } from '../../logic/score/ScoringEngine';
import { LogicJob, LogicVehicle, PointAccessPermission } from '../../logic/types';
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
}

export const calculateCollision = ({
    proposedDriverId,
    proposedStartMin,
    proposedDuration,
    ignoreJobId,
    existingJobs,
    drivers = [],
    pointPermissions = []
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
        const logicVehicle: LogicVehicle = {
            id: driver.id,
            name: driver.name,
            capacityWeight: 4000,
            startLocation: { lat: 35.44, lng: 139.36 }
        };

        const logicJobs: LogicJob[] = jobsInCol.map(j => ({
            id: j.id,
            weight: 500,
            durationMinutes: j.duration,
            location: { lat: 35.44, lng: 139.36 },
            pointId: (j as any).pointId,
            targetDate: '2024-01-01'
        }));

        const checkRes = checkConstraints(logicVehicle, logicJobs, driver.id, pointPermissions);
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
