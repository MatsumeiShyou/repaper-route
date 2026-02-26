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
    special_type?: string | null;
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
    item_category?: string; // Dominant item category
    location_id?: string; // Traceability: Reference to master_collection_points
    address?: string;     // Traceability: Static snapshot of address at time of creation
    creation_reason?: string; // Double Loop: Reason for manual injection
}

export interface BoardDriver {
    id: string;
    name: string;
    driverName: string;
    currentVehicle: string;
    course: string;
    color: string;
    vehicleCallsign?: string; // Added for display parity with JS
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
    name?: string;
}

export interface MasterCustomer {
    id: string;
    location_id: string;
    name: string;
    display_name?: string;
    furigana?: string;
    area?: string;
    company_phone?: string;
    manager_phone?: string;
    special_type?: string;
    recurrence_pattern?: string;
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
