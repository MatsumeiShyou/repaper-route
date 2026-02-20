import { LogicJob, LogicResult } from '../types';

interface ScoreConfig {
    distanceWeight: number; // 距離ペナルティ重み (1kmあたりの減点)
    timeViolationPenalty: number; // 稼働時間違反ペナルティ (固定減点)
    baseScore: number; // 基本スコア (加点方式の起点)
}

const DEFAULT_CONFIG: ScoreConfig = {
    distanceWeight: 10,
    timeViolationPenalty: 100,
    baseScore: 1000
};

/**
 * 透明なスコアリングエンジン (Scoring Engine)
 * 決定論的な算術計算に基づきスコアを算出し、その論理的根拠（Reason）を明示する。
 * 憲法第1条5項に基づき、AIを介在させず100%人間が追跡可能なロジックで構成される。
 */
export const calculateScore = (jobs: LogicJob[], config: ScoreConfig = DEFAULT_CONFIG): LogicResult => {
    let score = config.baseScore;
    const reasons: string[] = [`【基本点】: ${config.baseScore}点（計算開始時の初期値）`];

    // 1. 距離計算（決定論的：物理座標に基づくユークリッド距離の総和）
    let totalDistance = 0;
    for (let i = 0; i < jobs.length - 1; i++) {
        const from = jobs[i].location;
        const to = jobs[i + 1].location;
        // 簡易座標系による直線距離計算
        const dist = Math.sqrt(Math.pow(to.lat - from.lat, 2) + Math.pow(to.lng - from.lng, 2));
        totalDistance += dist;
    }

    const distancePenalty = Math.floor(totalDistance * config.distanceWeight);
    score -= distancePenalty;
    reasons.push(`【距離減点】: -${distancePenalty}点 (総移動距離 ${totalDistance.toFixed(2)}km × 重み ${config.distanceWeight})`);

    // 2. 将来的な拡張（時間枠、優先度、車種適合性等はここに決定論的ロジックとして追加される）

    return {
        isFeasible: true, // スコア算出自体は常に可能
        violations: [],
        score: Math.max(0, score),
        reason: reasons
    };
};
