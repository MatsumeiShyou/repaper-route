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

    // 1. 重量制約チェック (Weight Constraint)
    jobs.forEach(job => {
        totalWeight += job.weight;
    });

    if (totalWeight > vehicle.capacityWeight) {
        violations.push({
            type: 'WEIGHT_OVER',
            message: `積載重量超過: ${totalWeight}kg > ${vehicle.capacityWeight}kg`,
            currentValue: totalWeight,
            limitValue: vehicle.capacityWeight
        });
        reasons.push(`[NG] Weight Limit Exceeded (${totalWeight}/${vehicle.capacityWeight})`);
    } else {
        reasons.push(`[OK] Weight Check (${totalWeight}/${vehicle.capacityWeight})`);
    }

    // 2. 将来的な拡張: 時間制約チェック (Time Constraint)
    // 現時点では簡易的なチェックのみ実装可能（移動時間計算ロジックが必要なため）

    const isFeasible = violations.length === 0;

    return {
        isFeasible,
        violations,
        score: isFeasible ? 100 : 0, // 制約違反なら0点
        reason: reasons
    };
};
