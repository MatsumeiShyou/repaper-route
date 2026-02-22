/**
 * Supabase Database Types (Draft Based on Schema Analysis)
 */
export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    name: string
                    role: string
                    vehicle_info: string | null
                    user_id: string | null
                    can_edit_board: boolean | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    name: string
                    role: string
                    vehicle_info?: string | null
                    user_id?: string | null
                    can_edit_board?: boolean | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    role?: string
                    vehicle_info?: string | null
                    user_id?: string | null
                    can_edit_board?: boolean | null
                    created_at?: string
                    updated_at?: string
                }
            }
            routes: {
                Row: {
                    date: string
                    jobs: Json | null
                    drivers: Json | null
                    splits: Json | null
                    pending: Json | null
                    edit_locked_by: string | null
                    edit_locked_at: string | null
                    last_activity_at: string | null
                    updated_at: string
                }
                Insert: {
                    date: string
                    jobs?: Json | null
                    drivers?: Json | null
                    splits?: Json | null
                    pending?: Json | null
                    edit_locked_by?: string | null
                    edit_locked_at?: string | null
                    last_activity_at?: string | null
                    updated_at?: string
                }
                Update: {
                    date?: string
                    jobs?: Json | null
                    drivers?: Json | null
                    splits?: Json | null
                    pending?: Json | null
                    edit_locked_by?: string | null
                    edit_locked_at?: string | null
                    last_activity_at?: string | null
                    updated_at?: string
                }
            }
            jobs: {
                Row: {
                    id: string
                    job_title: string | null
                    driver_id: string | null
                    start_time: string | null
                    duration_minutes: number
                    bucket_type: string | null
                    customer_id: string | null
                    required_vehicle: string | null
                    area: string | null
                    note: string | null
                    created_at: string
                    updated_at: string
                    special_notes: string | null
                    is_spot: boolean
                    work_type: string | null
                    task_details: Json | null
                    time_constraint: Json | null
                    vehicle_lock: string | null
                }
                Insert: {
                    id?: string
                    job_title?: string | null
                    driver_id?: string | null
                    start_time?: string | null
                    duration_minutes?: number
                    bucket_type?: string | null
                    customer_id?: string | null
                    required_vehicle?: string | null
                    area?: string | null
                    note?: string | null
                    is_spot?: boolean
                    special_notes?: string | null
                    work_type?: string | null
                    task_details?: Json | null
                    time_constraint?: Json | null
                    vehicle_lock?: string | null
                }
                Update: {
                    job_title?: string | null
                    driver_id?: string | null
                    start_time?: string | null
                    duration_minutes?: number
                    bucket_type?: string | null
                    customer_id?: string | null
                    required_vehicle?: string | null
                    area?: string | null
                    note?: string | null
                    is_spot?: boolean
                    special_notes?: string | null
                    work_type?: string | null
                    task_details?: Json | null
                    time_constraint?: Json | null
                    vehicle_lock?: string | null
                }
            }
            drivers: {
                Row: {
                    id: string
                    driver_name: string
                    vehicle_number: string | null
                    route_name: string | null
                    display_color: string | null
                    display_order: number
                    user_id: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    driver_name: string
                    vehicle_number?: string | null
                    route_name?: string | null
                    display_color?: string | null
                    display_order?: number
                    user_id?: string | null
                }
                Update: {
                    driver_name?: string
                    vehicle_number?: string | null
                    route_name?: string | null
                    display_color?: string | null
                    display_order?: number
                    user_id?: string | null
                }
            }
            items: {
                Row: {
                    id: string
                    name: string
                    unit: string | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    name: string
                    unit?: string | null
                    created_at?: string | null
                }
                Update: {
                    name?: string
                    unit?: string | null
                }
            }
            vehicles: {
                Row: {
                    id: string
                    number: string
                    callsign: string | null
                    vehicle_type: string | null
                    display_order: number
                    is_active: boolean
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    number: string
                    callsign?: string | null
                    vehicle_type?: string | null
                    display_order?: number
                    is_active?: boolean
                }
                Update: {
                    number?: string
                    callsign?: string | null
                    vehicle_type?: string | null
                    display_order?: number
                    is_active?: boolean
                }
            }
            master_items: {
                Row: {
                    id: string
                    name: string
                    unit: string
                    display_order: number
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    unit?: string
                    display_order?: number
                    is_active?: boolean
                }
                Update: {
                    id?: string
                    name?: string
                    unit?: string
                    display_order?: number
                    is_active?: boolean
                }
            }
            master_collection_points: {
                Row: {
                    id: string
                    location_id: string
                    name: string
                    display_name: string | null
                    address: string | null
                    contractor_id: string | null
                    visit_slot: string | null
                    vehicle_restriction_type: string | null
                    restricted_vehicle_id: string | null
                    target_item_category: string | null
                    internal_note: string | null
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    location_id: string
                    name: string
                    display_name?: string | null
                    address?: string | null
                    contractor_id?: string | null
                    visit_slot?: string | null
                    vehicle_restriction_type?: string | null
                    restricted_vehicle_id?: string | null
                    target_item_category?: string | null
                    internal_note?: string | null
                    is_active?: boolean
                }
                Update: {
                    id?: string
                    location_id?: string
                    name?: string
                    display_name?: string | null
                    address?: string | null
                    contractor_id?: string | null
                    visit_slot?: string | null
                    vehicle_restriction_type?: string | null
                    restricted_vehicle_id?: string | null
                    target_item_category?: string | null
                    internal_note?: string | null
                    is_active?: boolean
                }
            }
            master_contractors: {
                Row: {
                    contractor_id: string
                    name: string
                    payee_id: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    contractor_id: string
                    name: string
                    payee_id?: string | null
                }
                Update: {
                    contractor_id?: string
                    name?: string
                    payee_id?: string | null
                }
            }
        },
        Views: {
            view_master_points: {
                Row: {
                    id: string
                    location_code: string
                    name: string
                    display_name: string | null
                    address: string | null
                    visit_slot: string | null
                    vehicle_restriction_type: string | null
                    restricted_vehicle_id: string | null
                    target_item_category: string | null
                    internal_note: string | null
                    site_contact_phone: string | null
                    contractor_id: string | null
                    contractor_name: string | null
                    payee_id: string | null
                    payee_name: string | null
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
            }
        },
        Functions: {
            rpc_execute_master_update: {
                Args: {
                    p_table_name: string
                    p_id?: string | number
                    p_core_data: Json
                    p_reason: string
                }
                Returns: Json
            }
        }
    }
}
