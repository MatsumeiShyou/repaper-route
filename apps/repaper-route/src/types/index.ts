/**
 * Core Application Domain Types (Unified & Extended for useBoardData)
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

// Supabase 'jobs' table record (Legacy/Sync form)
export interface SupabaseJob {
    id: string;
    job_title: string;
    bucket_type: string | null;
    duration_minutes: number | null;
    area: string | null;
    customer_name: string | null;
    required_vehicle: string | null;
    start_time: string | null;
    visit_slot?: string | null;
    weighing_site_id?: string | null;
    company_phone?: string | null;
    manager_phone?: string | null;
    recurrence_pattern?: string | null;
    driver_id: string | null;
    updated_at: string;
}

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
    driverId?: string;
    startTime?: string; // Legacy/Internal compatibility for rendering
    visitSlot?: string;    // Soft Validation: Slot constraint (AM, PM, etc.)
    warningMessage?: string; // Soft Validation: Detailed reason for warning
    item_category?: string; // Dominant item category
    location_id?: string; // Traceability: Reference to master_collection_points
    address?: string;     // Traceability: Static snapshot of address at time of creation
    creation_reason?: string; // Double Loop: Reason for manual injection
    version?: number; // Optimistic Lock (jobs_v4.version)
    status: 'planned' | 'confirmed';
    is_admin_forced?: boolean;
    is_skipped?: boolean;
    actual_time?: string; // Phase 12+: Driver-reported time
    weight_kg?: number;   // Phase 12+: Driver-reported weight
}

export interface BoardDriver {
    id: string;
    name: string;
    driverName: string;
    currentVehicle: string;
    course: string;
    color: string;
    vehicleCallsign?: string; // Added for display parity with JS
    vehicleNumber?: string;   // LogicBase 用に追加
    max_payload?: number;     // 物理同期用追加
}

export interface BoardSplit {
    id: string;
    jobId: string;
    startTime: string;
    endTime: string;
}

export interface BoardHistoryEntry {
    jobs: BoardJob[];
    pendingJobs: BoardJob[];
    splits: BoardSplit[];
    drivers: BoardDriver[];
}

// Exception Recording Types (Phase 12: Data Governance)
export interface ExceptionReasonMaster {
    id: string;
    label: string;
    is_active: boolean;
}

export interface BoardException {
    id: string;
    route_date: string;
    job_id: string;
    exception_type: 'MOVE' | 'REASSIGN' | 'SWAP' | 'CANCEL' | 'ADD';
    before_state: any;
    after_state: any;
    reason_master_id?: string;
    reason_free_text?: string;
    promote_requested?: boolean;
    actor_id?: string;
    created_at?: string;
}

export interface BoardHistory {
    past: BoardHistoryEntry[];
    future: BoardHistoryEntry[];
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
    max_payload?: number; // 物理同期用追加
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
    latitude?: number;  // 物理同期用追加 (view_master_points.latitude)
    longitude?: number; // 物理同期用追加 (view_master_points.longitude)
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
