import { BoardJob, BoardSplit, BoardDriver } from '../../../types';
import { timeToMinutes } from './timeUtils';
import { checkConstraints } from '../../logic/core/ConstraintEngine';
import { calculateScore } from '../../logic/score/ScoringEngine';
import { LogicJob, LogicVehicle } from '../../logic/types';

interface CollisionCheckParams {
    proposedDriverId: string;
    proposedStartMin: number;
    proposedDuration: number;
    ignoreJobId?: string;
    existingJobs: BoardJob[];
    splits: BoardSplit[];
    isResize?: boolean;
    drivers?: BoardDriver[]; // 追加: 車両情報取得のため
}

export const calculateCollision = ({
    proposedDriverId,
    ignoreJobId,
    existingJobs,
    drivers = []
}: CollisionCheckParams) => {
    // 1. 物理的な重なりチェック (現在はスタブのまま)
    const isOverlapError = false;
    const adjustedDuration = 0;

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
        // Logic Base 形式に変換
        const logicVehicle: LogicVehicle = {
            id: driver.id,
            name: driver.name,
            capacityWeight: 4000, // TODO: マスタから取得。一旦 4t 固定
            startLocation: { lat: 35.44, lng: 139.36 } // 厚木
        };

        const logicJobs: LogicJob[] = jobsInCol.map(j => ({
            id: j.id,
            weight: 500, // TODO: 実データから取得。一旦 500kg 固定
            durationMinutes: j.duration,
            location: { lat: 35.44, lng: 139.36 }
        }));

        const checkRes = checkConstraints(logicVehicle, logicJobs);
        const scoreRes = calculateScore(logicJobs);

        constraintResult = {
            ...checkRes,
            score: scoreRes.score,
            reason: [...checkRes.reason, ...scoreRes.reason]
        };
    }

    return {
        isOverlapError: isOverlapError || !constraintResult.isFeasible,
        adjustedDuration,
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
