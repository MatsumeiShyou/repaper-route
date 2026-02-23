-- ==========================================
-- Update RPC for Board Save (SDR Model)
-- Phase: 12 (Data Governance)
-- Overview: Add SDR logging (decision_proposals, decisions, event_logs) to rpc_execute_board_update
-- ==========================================

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
    v_proposal_id UUID;
    v_decision_id UUID;
BEGIN
    v_current_user_id := auth.uid();

    -- 1. Record Proposal (Auto-approve for Board updates)
    INSERT INTO decision_proposals (status, proposed_data, reason_description, applicant_id, reviewed_at, reviewed_by)
    VALUES ('approved', p_new_state, COALESCE(p_reason, 'Manual Save'), v_current_user_id, NOW(), v_current_user_id)
    RETURNING proposal_id INTO v_proposal_id;

    -- 2. Record Decision
    INSERT INTO decisions (proposal_id, decision_type, actor_id)
    VALUES (v_proposal_id, COALESCE(p_decision_type, 'BOARD_UPDATE'), v_current_user_id)
    RETURNING decision_id INTO v_decision_id;

    -- 3. Update State (routes)
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
        v_current_user_id
    )
    ON CONFLICT (date) DO UPDATE SET
        jobs = EXCLUDED.jobs,
        drivers = EXCLUDED.drivers,
        splits = EXCLUDED.splits,
        pending = EXCLUDED.pending,
        updated_at = NOW(),
        last_activity_at = NOW(),
        edit_locked_by = v_current_user_id;

    -- 4. Log Event (Append-only)
    INSERT INTO event_logs (decision_id, state_after, table_name)
    VALUES (v_decision_id, p_new_state, 'routes');

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
