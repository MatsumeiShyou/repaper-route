import { LogicJob, LogicVehicle, ConstraintViolation, LogicResult, PointAccessPermission } from '../types';

/**
 * 決定論的制約エンジン V2 (Constraint Engine)
 * 100点品質の決定論的な論理計算により、三層の制約をチェックする。
 */
export const checkConstraints = (
    vehicle: LogicVehicle,
    jobs: LogicJob[],
    driverId?: string,
    pointPermissions?: PointAccessPermission[]
): LogicResult => {
    const violations: ConstraintViolation[] = [];
    const reasons: string[] = [];
    let score = 100;

    // ─────────────────────────────────────────────────
    // [L1: Hard Lock] - 物理的に不可能な配置
    // ─────────────────────────────────────────────────

    // 1.1 重量制約
    let totalWeight = 0;
    jobs.forEach(job => { totalWeight += job.weight; });
    if (totalWeight > vehicle.capacityWeight) {
        violations.push({
            tier: 'L1',
            type: '重量制限過多',
            message: `積載重量超過: ${totalWeight}kg > 制限 ${vehicle.capacityWeight}kg`,
            currentValue: totalWeight,
            limitValue: vehicle.capacityWeight
        });
        reasons.push(`【不可】重量制限超過 (${totalWeight}kg / 上限 ${vehicle.capacityWeight}kg)`);
    }

    // 1.2 車検制約
    if (vehicle.inspectionExpiry && jobs.length > 0) {
        const targetDate = jobs[0].targetDate;
        if (targetDate > vehicle.inspectionExpiry) {
            violations.push({
                tier: 'L1',
                type: '車検切れ',
                message: `車検満了日超過: ${vehicle.inspectionExpiry} < 配車日 ${targetDate}`,
                currentValue: targetDate,
                limitValue: vehicle.inspectionExpiry
            });
            reasons.push(`【不可】車両検査期限切れ (${vehicle.inspectionExpiry})`);
        }
    }

    // 1.3 入場制限 (Mandatory Vehicle)
    if (driverId && pointPermissions && pointPermissions.length > 0) {
        for (const job of jobs) {
            const perm = pointPermissions.find(
                p => p.point_id === job.pointId && p.driver_id === driverId && p.is_active
            );
            if (perm && perm.vehicle_id !== vehicle.id) {
                violations.push({
                    tier: 'L1',
                    type: '入場制限指定車両違反',
                    message: `指定車両以外入場不可: 地点(${job.pointId})`,
                    currentValue: vehicle.id,
                    limitValue: perm.vehicle_id
                });
                reasons.push(`【不可】入場制限: 登録済みの指定車両以外での配車は許可されません`);
            }
        }
    }

    // ─────────────────────────────────────────────────
    // [L2: Soft Warning] - 理由入力が必要な配置
    // ─────────────────────────────────────────────────

    for (const job of jobs) {
        if (job.preferredStartTime && job.actualStartTime) {
            const prefMin = timeToMinutes(job.preferredStartTime);
            const actMin = timeToMinutes(job.actualStartTime);
            const diff = Math.abs(prefMin - actMin);

            if (diff > 15) {
                violations.push({
                    tier: 'L2',
                    type: '時間指定乖離',
                    message: `希望時間との乖離: ${diff}分 (許容 15分)`,
                    currentValue: diff,
                    limitValue: 15
                });
                reasons.push(`【警告】希望時間(${job.preferredStartTime})と計画(${job.actualStartTime})が15分以上乖離しています`);
            }
        }
    }

    // ─────────────────────────────────────────────────
    // [Phase 3.3: 連鎖分析] - 遅延伝播のシミュレーション
    // ─────────────────────────────────────────────────
    const sortedJobs = [...jobs].sort((a, b) => {
        const timeA = timeToMinutes(a.actualStartTime || a.preferredStartTime || '00:00');
        const timeB = timeToMinutes(b.actualStartTime || b.preferredStartTime || '00:00');
        return timeA - timeB;
    });

    let currentMinutes = 0;
    let totalDelay = 0;
    const affectedJobIds: string[] = [];

    for (let i = 0; i < sortedJobs.length; i++) {
        const job = sortedJobs[i];
        const startTime = timeToMinutes(job.actualStartTime || job.preferredStartTime || '00:00');

        if (i > 0 && startTime < currentMinutes) {
            const delay = currentMinutes - startTime;
            totalDelay += delay;
            affectedJobIds.push(job.id);

            if (delay > 30) {
                violations.push({
                    tier: 'L2',
                    type: '多段遅延伝播',
                    message: `前件からの遅延波及: ${delay}分 (許容 30分)`,
                    currentValue: delay,
                    limitValue: 30
                });
                reasons.push(`【警告】${job.id} は前案件の遅延により開始が ${delay}分 遅れ、後続に影響します`);
            }
        }

        currentMinutes = Math.max(currentMinutes, startTime) + job.durationMinutes + 15; // 15分は移動バッファ
    }

    // ─────────────────────────────────────────────────
    // [L3: Optimization Hint] - スコアリング（五十日・週末補正）
    // ─────────────────────────────────────────────────

    if (jobs.length > 0) {
        const date = new Date(jobs[0].targetDate);
        const day = date.getDate();
        const isGotobi = day % 5 === 0 || day === 1; // 簡易五十日判定
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;

        if (isGotobi) {
            score -= 10;
            reasons.push(`【ヒント】五十日補正適用: 全体的な渋滞リスクが高めです`);
        }
        if (isWeekend) {
            score -= 5;
            reasons.push(`【ヒント】週末補正適用: 配達先営業時間に注意してください`);
        }
    }

    // L1違反がある場合は強制的に isFeasible = false
    const isFeasible = !violations.some(v => v.tier === 'L1');
    if (!isFeasible) score = 0;

    return {
        isFeasible,
        violations,
        score: Math.max(0, score),
        reason: reasons,
        propagation: totalDelay > 0 ? {
            delayMinutes: totalDelay,
            affectedJobIds
        } : undefined
    };
};

/** 時間文字列(HH:mm)を分に変換 */
const timeToMinutes = (time?: string): number => {
    if (!time) return 0;
    const parts = time.split(':');
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    return h * 60 + m;
};
