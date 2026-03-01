-- ==========================================
-- Shadow Move: Initial Data Migration (v1.2)
-- Phase: 2.4 (Data Migration)
-- Overview: Copy existing jobs into jobs_v4 while establishing the Append-Only structure
-- ==========================================

DO $$
DECLARE
    v_job RECORD;
    v_new_job_id UUID;
    v_vehicle_id UUID;
BEGIN
    FOR v_job IN (SELECT * FROM public.jobs) LOOP
        -- 1. UUID for the logical job identity
        v_new_job_id := extensions.uuid_generate_v4();
        
        -- 2. Try to find the vehicle UUID
        SELECT id INTO v_vehicle_id 
        FROM public.master_vehicles 
        WHERE number = v_job.vehicle_name OR number = v_job.required_vehicle OR callsign = v_job.vehicle_name
        LIMIT 1;

        -- 3. Insert into jobs_v4 with safe time casting
        INSERT INTO public.jobs_v4 (
            job_id,
            version,
            is_latest,
            point_id,
            driver_id,
            vehicle_id,
            preferred_start_time,
            actual_start_time,
            duration_minutes,
            status,
            is_admin_forced,
            created_at
        )
        VALUES (
            v_new_job_id,
            1,
            true,
            v_job.customer_id,
            v_job.driver_id,
            v_vehicle_id,
            (CASE WHEN v_job.start_time ~ '^[0-2][0-9]:[0-5][0-9]' THEN v_job.start_time::TIME ELSE NULL END),
            (CASE WHEN v_job.start_time ~ '^[0-2][0-9]:[0-5][0-9]' THEN v_job.start_time::TIME ELSE NULL END),
            COALESCE(v_job.duration_minutes, 15),
            'confirmed',
            false,
            v_job.created_at
        );
    END LOOP;
END $$;
