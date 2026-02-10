-- ==========================================
-- Business OS Compliance Migration (Phase 9)
-- SDR Implementation & Strict RLS
-- ==========================================

-- 1. SDR Core Tables
CREATE TABLE IF NOT EXISTS decision_proposals (
    proposal_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status TEXT NOT NULL CHECK (status IN ('pending', 'rejected', 'approved')),
    proposed_data JSONB NOT NULL,
    applicant_id TEXT DEFAULT auth.uid(),
    reason_description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by TEXT
);

CREATE TABLE IF NOT EXISTS reasons (
    reason_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_code TEXT,
    description_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS decisions (
    decision_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id UUID REFERENCES decision_proposals(proposal_id),
    reason_id UUID REFERENCES reasons(reason_id),
    decision_type TEXT NOT NULL,
    actor_id TEXT DEFAULT auth.uid(),
    executed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    decision_id UUID REFERENCES decisions(decision_id),
    state_before JSONB,
    state_after JSONB,
    table_name TEXT DEFAULT 'routes',
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Strict RLS Policies
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;

-- Allow SELECT for Authenticated Users
DROP POLICY IF EXISTS "Allow Select Authenticated" ON routes;
CREATE POLICY "Allow Select Authenticated" ON routes
    FOR SELECT TO authenticated USING (true);

-- Explicitly BLOCK INSERT/UPDATE/DELETE by NOT creating policies for them
-- (Supabase default is DENY ALL if RLS enabled and no policy matches)
-- However, we must ensure no "Enable all access" policy exists from previous phases.
DROP POLICY IF EXISTS "Enable all access for all users" ON routes;

-- Allow RLS to be bypassed by SECURITY DEFINER functions (RPCs) - this is implicit in Postgres

-- 3. Transactional RPC (The "Wrapper")
CREATE OR REPLACE FUNCTION rpc_execute_board_update(
    p_date TEXT,
    p_new_state JSONB,
    p_decision_type TEXT,
    p_reason TEXT
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_proposal_id UUID;
    v_decision_id UUID;
    v_current_user TEXT;
BEGIN
    v_current_user := auth.uid();
    
    -- 1. Create Proposal (Auto-Approve for MVP)
    INSERT INTO decision_proposals (status, proposed_data, reason_description, applicant_id, reviewed_at, reviewed_by)
    VALUES ('approved', p_new_state, p_reason, v_current_user, NOW(), v_current_user)
    RETURNING proposal_id INTO v_proposal_id;

    -- 2. Create Decision
    INSERT INTO decisions (proposal_id, decision_type, actor_id)
    VALUES (v_proposal_id, p_decision_type, v_current_user)
    RETURNING decision_id INTO v_decision_id;

    -- 3. Log Event
    INSERT INTO event_logs (decision_id, state_after, table_name)
    VALUES (v_decision_id, p_new_state, 'routes');

    -- 4. Update Actual State (Snapshot)
    -- This runs with SECURITY DEFINER privileges, bypassing RLS on routes table
    INSERT INTO routes (date, jobs, drivers, splits, pending, updated_at, last_activity_at, edit_locked_by, edit_locked_at)
    VALUES (
        p_date,
        p_new_state->'jobs',
        p_new_state->'drivers',
        p_new_state->'splits',
        p_new_state->'pending',
        NOW(),
        NOW(),
        (p_new_state->>'edit_locked_by'),
        (p_new_state->>'edit_locked_at')::TIMESTAMPTZ
    )
    ON CONFLICT (date) DO UPDATE SET
        jobs = EXCLUDED.jobs,
        drivers = EXCLUDED.drivers,
        splits = EXCLUDED.splits,
        pending = EXCLUDED.pending,
        updated_at = NOW(),
        last_activity_at = NOW(),
        edit_locked_by = EXCLUDED.edit_locked_by,
        edit_locked_at = EXCLUDED.edit_locked_at;
END;
$$;

-- 4. Grant Execute Check
GRANT EXECUTE ON FUNCTION rpc_execute_board_update TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_execute_board_update TO service_role;

-- 5. RLS for new tables (Open for MVP, but explicit)
ALTER TABLE decision_proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow All decision_proposals" ON decision_proposals FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow All decisions" ON decisions FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE event_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow All event_logs" ON event_logs FOR ALL USING (true) WITH CHECK (true);
