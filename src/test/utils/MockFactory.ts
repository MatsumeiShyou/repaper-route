import { Database } from '../../types/database.types';

export type JobTarget = Database['public']['Tables']['jobs']['Row'];
export type DriverTarget = Database['public']['Tables']['drivers']['Row'];
export type PointTarget = Database['public']['Tables']['master_collection_points']['Row'];
export type VehicleTarget = Database['public']['Tables']['master_vehicles']['Row'];

/**
 * データベーススキーマ（v4.0正典）に完全に準拠したモックデータを生成するファクトリ。
 * 一切の @ts-ignore を許容せず、必須プロパティの欠落をコンパイルレベルで防ぐ。
 */
export const MockFactory = {
    createDriver: (overrides?: Partial<DriverTarget>): DriverTarget => ({
        id: `driver_${Date.now()}_${Math.random()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        driver_name: 'Test Driver',
        is_active: true,
        display_color: '#000000',
        display_order: 1,
        default_split_driver_name: null,
        default_split_time: null,
        default_split_vehicle_number: null,
        route_name: null,
        user_id: null,
        vehicle_number: null,
        ...overrides,
    }),

    createPoint: (overrides?: Partial<PointTarget>): PointTarget => ({
        location_id: `point_${Date.now()}_${Math.random()}`,
        id: `point_${Date.now()}_${Math.random()}`,
        name: 'Test Point',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        address: 'Tokyo',
        collection_days: null,
        contractor_id: null,
        default_route_code: null,
        display_name: 'T. Point',
        entry_instruction: null,
        internal_note: null,
        is_active: true,
        is_spot: false,
        furigana: 'てすと ぽいんと',
        latitude: 35.0,
        longitude: 139.0,
        note: null,
        restricted_vehicle_id: null,
        safety_note: null,
        site_contact_phone: null,
        target_item_category: null,
        time_constraint: null,
        time_constraint_type: null,
        time_range_end: null,
        time_range_start: null,
        vehicle_restriction_type: null,
        visit_slot: null,
        weighing_site_id: null,
        company_phone: null,
        is_spot_only: false,
        manager_phone: null,
        recurrence_pattern: null,
        special_type: null,
        ...overrides,
    }),

    createVehicle: (overrides?: Partial<VehicleTarget>): VehicleTarget => ({
        id: `vehicle_${Date.now()}_${Math.random()}`,
        number: '品川100あ1234',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        callsign: 'Car A',
        is_active: true,
        ...overrides,
    }),

    createJob: (overrides?: Partial<JobTarget>): JobTarget => ({
        id: `job_${Date.now()}_${Math.random()}`,
        created_at: new Date().toISOString(),
        duration_minutes: 15,
        area: 'Test Area',
        bucket_type: null,
        customer_id: null,
        customer_name: 'Test Customer',
        driver_id: null,
        driver_name: null,
        is_spot: false,
        is_synced_to_sheet: false,
        item_category: null,
        job_title: 'Test Job',
        note: null,
        required_vehicle: null,
        special_notes: null,
        start_time: '10:00',
        status: 'pending',
        task_details: null,
        task_type: 'collection',
        time_constraint: null,
        vehicle_lock: null,
        vehicle_name: null,
        weight_kg: null,
        work_type: null,
        ...overrides,
    })
};
