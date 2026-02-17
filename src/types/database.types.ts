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
                    role: string | null
                    vehicle_info: string | null
                    can_edit_board: boolean | null
                    updated_at: string
                }
                Insert: {
                    id: string
                    name: string
                    role?: string | null
                    vehicle_info?: string | null
                    can_edit_board?: boolean | null
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    role?: string | null
                    vehicle_info?: string | null
                    can_edit_board?: boolean | null
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
                    job_title: string
                    bucket_type: string | null
                    duration_minutes: number | null
                    area: string | null
                    customer_name: string | null
                    required_vehicle: string | null
                    start_time: string | null
                    note: string | null
                    special_notes: string | null
                    driver_id: string | null
                    updated_at: string
                }
            }
            master_items: {
                Row: {
                    id: string
                    name: string
                    unit: string | null
                    display_order: number | null
                }
            }
        }
    }
}
