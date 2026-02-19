export interface LogicConstraint {
    maxWeight: number; // kg
    maxWorkTimeMinutes: number; // 分
    requiredLicenses: string[]; // 免許
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
    type: 'WEIGHT_OVER' | 'TIME_OVER' | 'LICENSE_MISSING';
    message: string;
    currentValue: number | string;
    limitValue: number | string;
}

export interface LogicResult {
    isFeasible: boolean;
    violations: ConstraintViolation[];
    score: number;
    reason: string[]; // 計算根拠のテキストリスト
}
