import { BoardJob, BoardSplit, BoardDriver } from '../../../types';
import { checkConstraints } from '../../logic/core/ConstraintEngine';
import { calculateScore } from '../../logic/score/ScoringEngine';
import { LogicJob, LogicVehicle, PointAccessPermission } from '../../logic/types';

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
    ignoreJobId,
    existingJobs,
    drivers = [],
    pointPermissions = []
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
        const logicVehicle: LogicVehicle = {
            id: driver.id,
            name: driver.name,
            capacityWeight: 4000, // TODO: 車両マスタから取得
            startLocation: { lat: 35.44, lng: 139.36 }
        };

        const logicJobs: LogicJob[] = jobsInCol.map(j => ({
            id: j.id,
            weight: 500, // TODO: 実データから取得
            durationMinutes: j.duration,
            location: { lat: 35.44, lng: 139.36 },
            pointId: (j as any).pointId // 回収先ID（入場制限チェック用）
        }));

        // Phase D: driverId と pointPermissions を渡して入場制限チェックを有効化
        const checkRes = checkConstraints(logicVehicle, logicJobs, driver.id, pointPermissions);
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
