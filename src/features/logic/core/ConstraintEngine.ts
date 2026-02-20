import { LogicJob, LogicVehicle, ConstraintViolation, LogicResult, PointAccessPermission } from '../types';

/**
 * 決定論的制約エンジン (Constraint Engine)
 * 物理的な制約（重量、入場制限など）を厳密にチェックし、違反があればその理由を返す。
 * @param vehicle 車両情報
 * @param jobs 割り当て予定の案件リスト
 * @param driverId 対象ドライバーID（入場制限チェック用、省略可）
 * @param pointPermissions 入場制限ルール一覧（省略可 = 制約なし）
 */
export const checkConstraints = (
    vehicle: LogicVehicle,
    jobs: LogicJob[],
    driverId?: string,
    pointPermissions?: PointAccessPermission[]
): LogicResult => {
    const violations: ConstraintViolation[] = [];
    const reasons: string[] = [];

    // ─────────────────────────────────────────────────
    // 1. 重量制約チェック（既存ロジック・変更なし）
    // ─────────────────────────────────────────────────
    let totalWeight = 0;
    jobs.forEach(job => { totalWeight += job.weight; });

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

    // ─────────────────────────────────────────────────
    // 2. 入場制限チェック（追加ロジック）
    // エントリーなし = 制約なし（デフォルト）
    // ─────────────────────────────────────────────────
    if (driverId && pointPermissions && pointPermissions.length > 0) {
        for (const job of jobs) {
            if (!job.pointId) continue;

            // この地点・このドライバーの許可ルールを検索
            const perm = pointPermissions.find(
                p => p.point_id === job.pointId && p.driver_id === driverId && p.is_active
            );

            if (perm && perm.vehicle_id !== vehicle.id) {
                // 許可ルールは存在するが、指定車両と一致しない → 違反
                violations.push({
                    type: '入場制限違反',
                    message: `入場制限違反: この地点(${job.pointId})はこのドライバーに対して車両(${perm.vehicle_id})の使用が必須です`,
                    currentValue: vehicle.id,
                    limitValue: perm.vehicle_id
                });
                reasons.push(`【不可】入場制限違反: 指定車両以外での配車は不可`);
            } else if (!perm) {
                // ルールなし = 制約なし（この地点はこのドライバーに対して自由）
                reasons.push(`【良好】入場制限なし (この地点・ドライバーの組み合わせに制限なし)`);
            }
        }
    }

    const isFeasible = violations.length === 0;

    return {
        isFeasible,
        violations,
        score: isFeasible ? 100 : 0,
        reason: reasons
    };
};
