import { LogicJob, LogicResult } from '../types';

interface ScoreConfig {
    distanceWeight: number; // 1kmあたりの減点
    timeViolationPenalty: number; // 時間違反の減点
    baseScore: number; // 基本点
}

const DEFAULT_CONFIG: ScoreConfig = {
    distanceWeight: 10,
    timeViolationPenalty: 100,
    baseScore: 1000
};

/**
 * 透明なスコアリングエンジン (Scoring Engine)
 * 複数の評価軸に基づいてスコアを算出し、その内訳（Reason）を明示する。
 * @param jobs 評価対象のルート（案件リスト）
 * @param config スコアリング設定（可変）
 */
export const calculateScore = (jobs: LogicJob[], config: ScoreConfig = DEFAULT_CONFIG): LogicResult => {
    let score = config.baseScore;
    const reasons: string[] = [`Base Score: ${config.baseScore}`];

    // 1. 距離計算（簡易実装：直線距離の合計とする）
    let totalDistance = 0;
    for (let i = 0; i < jobs.length - 1; i++) {
        const from = jobs[i].location;
        const to = jobs[i + 1].location;
        const dist = Math.sqrt(Math.pow(to.lat - from.lat, 2) + Math.pow(to.lng - from.lng, 2)); // 簡易ユークリッド距離
        totalDistance += dist;
    }

    const distancePenalty = Math.floor(totalDistance * config.distanceWeight);
    score -= distancePenalty;
    reasons.push(`Distance Penalty: -${distancePenalty} (Total Dist: ${totalDistance.toFixed(2)} * Weight: ${config.distanceWeight})`);

    // 2. その他の要素（スキップ）

    return {
        isFeasible: true, // スコア計算自体は常に成功する
        violations: [],
        score: Math.max(0, score),
        reason: reasons
    };
};
