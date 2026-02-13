-- Fix Persistence Issue: Create routes table and RPC
-- Phase: 11 (Stabilization)
-- Reason: Fix 400 Bad Request on save due to missing table/function

-- 1. Create routes table if not exists
CREATE TABLE IF NOT EXISTS public.routes (
    date DATE PRIMARY KEY,
    jobs JSONB DEFAULT '[]'::jsonb,
    drivers JSONB DEFAULT '[]'::jsonb,
    splits JSONB DEFAULT '[]'::jsonb,
    pending JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Edit Lock Columns (Phase 2.2)
    edit_locked_by UUID REFERENCES auth.users(id),
    edit_locked_at TIMESTAMPTZ,
    last_activity_at TIMESTAMPTZ
);

-- RLS
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON public.routes
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert/update for authenticated users" ON public.routes
    FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- 2. Create RPC function for board updates
CREATE OR REPLACE FUNCTION public.rpc_execute_board_update(
    p_date DATE,
    p_new_state JSONB,
    p_decision_type TEXT DEFAULT NULL,
    p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_user_id UUID;
    v_result JSONB;
BEGIN
    v_current_user_id := auth.uid();

    -- Extract data from p_new_state
    -- Expected structure: { jobs: [], drivers: [], splits: [], pending: [], ... }
    
    INSERT INTO public.routes (
        date,
        jobs,
        drivers,
        splits,
        pending,
        updated_at,
        last_activity_at,
        edit_locked_by
    )
    VALUES (
        p_date,
        COALESCE(p_new_state->'jobs', '[]'::jsonb),
        COALESCE(p_new_state->'drivers', '[]'::jsonb),
        COALESCE(p_new_state->'splits', '[]'::jsonb),
        COALESCE(p_new_state->'pending', '[]'::jsonb),
        NOW(),
        NOW(),
        v_current_user_id -- Extend lock if saving
    )
    ON CONFLICT (date) DO UPDATE SET
        jobs = EXCLUDED.jobs,
        drivers = EXCLUDED.drivers,
        splits = EXCLUDED.splits,
        pending = EXCLUDED.pending,
        updated_at = NOW(),
        last_activity_at = NOW(),
        edit_locked_by = v_current_user_id; -- Extend lock on save

    -- Return success
    v_result := jsonb_build_object(
        'success', true,
        'message', 'Board updated successfully',
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
