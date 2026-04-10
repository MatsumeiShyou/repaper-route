export type ConstraintTier = 'L1' | 'L2' | 'L3';

export interface LogicConstraint {
    maxWeight: number; // 最大積載量 (kg)
    maxWorkTimeMinutes: number; // 最大稼働時間 (分)
    requiredLicenses: string[]; // 必要免許
}

export interface LogicJob {
    id: string;
    weight: number; // kg
    preferredStartTime?: string; // HH:mm (顧客希望)
    actualStartTime?: string;    // HH:mm (計画・実績)
    durationMinutes: number; // 作業時間
    location: { lat: number; lng: number }; // 簡易座標
    pointId?: string; // 回収先マスタの地点ID
    targetDate: string; // YYYY-MM-DD (五十日・週末チェック用)
}

export interface LogicVehicle {
    id: string;
    name: string;
    capacityWeight: number; // kg
    startLocation: { lat: number; lng: number }; // 出発地
    inspectionExpiry?: string; // 車検満了日 (YYYY-MM-DD)
}

export interface ConstraintViolation {
    tier: ConstraintTier;
    type: string;
    message: string;
    currentValue: number | string;
    limitValue: number | string;
}

/** 地点×ドライバー×車両のアクセス許可 (point_access_permissions テーブルの行) */
export interface PointAccessPermission {
    id: string;
    point_id: string;   // master_collection_points.id
    driver_id: string;  // profiles.id
    vehicle_id: string; // vehicles.id
    note?: string;
    is_active: boolean;
}

export interface LogicResult {
    isFeasible: boolean; // L1をすべて通過しているか
    violations: ConstraintViolation[]; // 制約違反の内訳 (L1, L2, L3)
    score: number; // 決定論的スコア (0-100)
    reason: string[]; // 論理的根拠（日本語）
    propagation?: {
        delayMinutes: number;
        affectedJobIds: string[];
    };
}
