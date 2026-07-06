/**
 * Core Application Domain Types (Unified & Extended)
 */

export type UserRole = 'admin' | 'driver';

export interface Profile {
    id: string;
    name: string;
    role: UserRole;
    vehicle_info?: string;
    can_edit_board: boolean;
    updated_at: string;
}

export * from './master';

// Unified Board Job
export interface BoardJob {
    id: string;
    title: string;
    bucket: string;
    duration: number;
    area: string;
    requiredVehicle?: string;
    note?: string;
    isSpot: boolean;
    timeConstraint?: string;
    taskType: 'collection' | 'special';
    courseId?: string; // Reference to course
    startTime?: string;
    visitSlot?: string;
    warningMessage?: string;
    item_category?: string;
    location_id?: string;
    address?: string;
    creation_reason?: string;
    status: 'planned' | 'confirmed';
    is_admin_forced?: boolean;
    is_skipped?: boolean;
    actual_time?: string;
    weight_kg?: number;
}

export interface BoardCourse {
    id: string;
    name: string;
    displayColor: string;
    displayOrder: number;
    staffId?: string | null;
    vehicleId?: string | null;
}

export interface BoardState {
    courses: BoardCourse[];
    jobs: BoardJob[];
}

export interface AppUser {
    id: string;
    name: string;
    role: UserRole;
    allowedApps: string[];
    vehicle?: string;
}

// Master Data Types
export interface MasterVehicle {
    id: string;
    number: string;
    callsign?: string;
    max_payload?: number;
    name?: string;
}

export interface MasterCustomer {
    id: string;
    location_id: string;
    name: string;
    display_name?: string;
    furigana?: string;
    address?: string;
    area?: string;
    latitude?: number;
    longitude?: number;
    company_phone?: string;
    manager_phone?: string;
    recurrence_pattern?: string;
    time_constraint?: string;
}

export interface MasterItem {
    id: string;
    name: string;
    unit: string | null;
    display_order: number | null;
}

export interface CustomerItemDefault {
    id: string;
    customer_id: string;
    item_id: string;
    default_quantity: number | null;
}
