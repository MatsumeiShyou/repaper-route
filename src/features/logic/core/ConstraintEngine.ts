import { LogicJob, LogicVehicle, ConstraintViolation, LogicResult } from '../types';

/**
 * 決定論的制約エンジン (Constraint Engine)
 * 物理的な制約（重量、時間など）を厳密にチェックし、違反があればその理由を返す。
 * @param vehicle 車両情報
 * @param jobs 割り当て予定の案件リスト
 * @returns 判定結果（可否、違反理由、スコア初期値）
 */
export const checkConstraints = (vehicle: LogicVehicle, jobs: LogicJob[]): LogicResult => {
    const violations: ConstraintViolation[] = [];
    let totalWeight = 0;
    let reasons: string[] = [];

    // 1. 重量制約チェック (物理的な積載量制限の検証)
    jobs.forEach(job => {
        totalWeight += job.weight;
    });

    if (totalWeight > vehicle.capacityWeight) {
        violations.push({
            type: '積載量超過',
            message: `積載重量超過: ${totalWeight}kg > 制限 ${vehicle.capacityWeight}kg`,
            currentValue: totalWeight,
            limitValue: vehicle.capacityWeight
        });
        reasons.push(`【不可】重量制限超過 (${totalWeight}kg / 上限 ${vehicle.capacityWeight}kg)`);
    } else {
        reasons.push(`【良好】重量チェック通過 (${totalWeight}kg / 上限 ${vehicle.capacityWeight}kg)`);
    }

    // 2. 将来的な拡張: 時間制約チェックや免許チェック等はここに決定論的ロジックとして追加される

    const isFeasible = violations.length === 0;

    return {
        isFeasible,
        violations,
        score: isFeasible ? 100 : 0, // 制約を満たさない場合はスコア0
        reason: reasons
    };
};
