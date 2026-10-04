import { BoardJob, BoardDriver, BoardSplit } from '../../types/index';

export interface LogicJob {
    id: string;
    pointId: string;
    weight: number;
    preferredStartTime?: string;
    actualStartTime?: string;
    durationMinutes: number;
    targetDate: string;
    // Scoring engine location
    location?: {
        lat: number;
        lng: number;
    };
}

export interface LogicVehicle {
    id: string;
    name: string;
    capacityWeight: number;
    inspectionExpiry?: string;
}

export interface LogicResult {
    isFeasible: boolean;
    violations: ConstraintViolation[];
    score: number;
    reason: string[];
    propagation?: {
        delayMinutes: number;
        affectedJobIds: string[];
    };
}

export interface ConstraintViolation {
    tier: 'L1' | 'L2' | 'L3';
    type: string;
    message: string;
    currentValue?: any;
    limitValue?: any;
}

export interface PointAccessPermission {
    point_id: string;
    driver_id: string;
    vehicle_id: string;
    is_active: boolean;
}

export interface BoardState {
    drivers: BoardDriver[];
    jobs: BoardJob[];
    pendingJobs: BoardJob[];
    splits: BoardSplit[];
}
