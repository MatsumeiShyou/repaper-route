export interface LogicConstraint {
    maxWeight: number; // 最大積載量 (kg)
    maxWorkTimeMinutes: number; // 最大稼働時間 (分)
    requiredLicenses: string[]; // 必要免許
}

export interface LogicJob {
    id: string;
    weight: number; // kg
    timeConstraint?: string; // HH:mm
    durationMinutes: number; // 作業時間
    location: { lat: number; lng: number }; // 簡易座標
}

export interface LogicVehicle {
    id: string;
    name: string;
    capacityWeight: number; // kg
    startLocation: { lat: number; lng: number }; // 出発地
}

export interface ConstraintViolation {
    type: '積載量超過' | '稼働時間超過' | '免許不足';
    message: string;
    currentValue: number | string;
    limitValue: number | string;
}

export interface LogicResult {
    isFeasible: boolean; // 実行可能か
    violations: ConstraintViolation[]; // 制約違反の内訳
    score: number; // 決定論的スコア
    reason: string[]; // 論理的根拠（人間が追跡可能な形式で日本語記述）
}
