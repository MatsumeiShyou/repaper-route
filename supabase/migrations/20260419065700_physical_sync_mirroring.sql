-- ==========================================
-- Phase 7: Physical-Logical Mirroring Sync Engine
-- Overview: Adds scheduled_date to jobs and ensures persistence of board jobs/contents.
-- ==========================================

-- 1. Extend jobs table with date axis
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS scheduled_date DATE;

-- 2. Refactor Board Save RPC to Mirroring Sync
CREATE OR REPLACE FUNCTION public.rpc_execute_board_update(
    p_date DATE,
    p_new_state JSONB,
    p_decision_type TEXT DEFAULT NULL,
    p_reason TEXT DEFAULT NULL,
    p_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_user_id UUID;
    v_result JSONB;
    v_proposal_id UUID;
    v_decision_id UUID;
BEGIN
    v_current_user_id := COALESCE(p_user_id, auth.uid());

    -- 1. Record SDR Proposal (Audit Log)
    INSERT INTO decision_proposals (status, proposed_data, reason_description, applicant_id, reviewed_at, reviewed_by)
    VALUES ('approved', p_new_state, COALESCE(p_reason, 'Board Sync'), v_current_user_id, NOW(), v_current_user_id)
    RETURNING proposal_id INTO v_proposal_id;

    -- 2. Record SDR Decision
    INSERT INTO decisions (proposal_id, decision_type, actor_id)
    VALUES (v_proposal_id, COALESCE(p_decision_type, 'BOARD_UPDATE'), v_current_user_id)
    RETURNING decision_id INTO v_decision_id;

    -- 3. Update Sync State (routes table JSONB)
    INSERT INTO public.routes (date, jobs, drivers, splits, pending, updated_at, last_activity_at, edit_locked_by)
    VALUES (
        p_date,
        COALESCE(p_new_state->'jobs', '[]'::jsonb),
        COALESCE(p_new_state->'drivers', '[]'::jsonb),
        COALESCE(p_new_state->'splits', '[]'::jsonb),
        COALESCE(p_new_state->'pending', '[]'::jsonb),
        NOW(), NOW(), v_current_user_id
    )
    ON CONFLICT (date) DO UPDATE SET
        jobs = EXCLUDED.jobs,
        drivers = EXCLUDED.drivers,
        splits = EXCLUDED.splits,
        pending = EXCLUDED.pending,
        updated_at = NOW(),
        last_activity_at = NOW(),
        edit_locked_by = v_current_user_id;

    -- 4. Mirroring Sync: jobs table (Physical Column Sync)
    
    -- 4a. DELETE Orphans (Orphan Cleanup logic)
    -- Remove jobs from physical table that are NOT in the new JSONB state for this date.
    DELETE FROM public.jobs
    WHERE scheduled_date = p_date
    AND id NOT IN (
        SELECT (j->>'id') FROM jsonb_array_elements(COALESCE(p_new_state->'jobs', '[]'::jsonb)) AS j
    );

    -- 4b. UPSERT Active Jobs
    INSERT INTO public.jobs (
        id, 
        job_title, 
        driver_id, 
        start_time, 
        duration_minutes, 
        customer_id, 
        weight_kg, 
        area, 
        note, 
        scheduled_date,
        item_category,
        task_type,
        is_spot
    )
    SELECT 
        (j->>'id'),
        COALESCE(j->>'title', j->>'job_title'),
        (j->>'driverId'),
        (j->>'startTime'),
        COALESCE((j->>'duration')::integer, (j->>'duration_minutes')::integer, 15),
        COALESCE(j->>'location_id', j->>'customer_id'),
        (j->>'weight_kg')::numeric,
        (j->>'area'),
        (j->>'note'),
        p_date,
        (j->>'item_category'),
        COALESCE(j->>'taskType', j->>'task_type', 'collection'),
        COALESCE((j->>'isSpot')::boolean, (j->>'is_spot')::boolean, false)
    FROM jsonb_array_elements(COALESCE(p_new_state->'jobs', '[]'::jsonb)) AS j
    ON CONFLICT (id) DO UPDATE SET
        job_title = EXCLUDED.job_title,
        driver_id = EXCLUDED.driver_id,
        start_time = EXCLUDED.start_time,
        duration_minutes = EXCLUDED.duration_minutes,
        customer_id = EXCLUDED.customer_id,
        weight_kg = EXCLUDED.weight_kg,
        area = EXCLUDED.area,
        note = EXCLUDED.note,
        scheduled_date = EXCLUDED.scheduled_date,
        item_category = EXCLUDED.item_category,
        task_type = EXCLUDED.task_type,
        is_spot = EXCLUDED.is_spot;

    -- 5. Mirroring Sync: job_contents (Physical Detail Sync)
    
    -- 5a. DELETE Orphans for job_contents (Cascade is common but explicit delete for SSOT)
    -- This ensures details that were removed in the UI are also removed from DB.
    DELETE FROM public.job_contents
    WHERE job_id IN (
        SELECT id FROM public.jobs WHERE scheduled_date = p_date
    )
    AND id NOT IN (
        SELECT (c->>'id')::uuid 
        FROM jsonb_array_elements(COALESCE(p_new_state->'jobs', '[]'::jsonb)) AS j,
             jsonb_array_elements(COALESCE(j->'contents', '[]'::jsonb)) AS c
        WHERE c->>'id' IS NOT NULL
    );

    -- 5b. UPSERT Details
    -- Map JSONB contents array to job_contents physical table
    INSERT INTO public.job_contents (id, job_id, item_id, expected_weight, actual_weight)
    SELECT 
        (c->>'id')::uuid,
        (j->>'id'),
        (c->>'item_id')::uuid,
        (c->>'expected_weight')::numeric,
        (c->>'actual_weight')::numeric
    FROM jsonb_array_elements(COALESCE(p_new_state->'jobs', '[]'::jsonb)) AS j,
         jsonb_array_elements(COALESCE(j->'contents', '[]'::jsonb)) AS c
    ON CONFLICT (id) DO UPDATE SET
        item_id = EXCLUDED.item_id,
        expected_weight = EXCLUDED.expected_weight,
        actual_weight = EXCLUDED.actual_weight;

    -- 6. Log Event
    INSERT INTO event_logs (decision_id, state_after, table_name)
    VALUES (v_decision_id, p_new_state, 'routes');

    -- Return success
    v_result := jsonb_build_object(
        'success', true,
        'message', 'Physical mirroring sync complete',
        'updated_at', NOW()
    );

    RETURN v_result;

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$;
