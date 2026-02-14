-- ==========================================
-- EMERGENCY FULL RECOVERY: Core/Ext + RPC Fix
-- ==========================================

-- 1. Ensure Core/Extension Tables Exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vehicles' AND table_type = 'BASE TABLE') THEN
        ALTER TABLE vehicles RENAME TO master_vehicles;
    END IF;
END $$;

ALTER TABLE master_vehicles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE master_vehicles ADD COLUMN IF NOT EXISTS callsign TEXT;
ALTER TABLE master_vehicles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS logistics_vehicle_attrs (
    vehicle_id UUID PRIMARY KEY REFERENCES master_vehicles(id) ON DELETE CASCADE,
    max_payload NUMERIC,
    fuel_type TEXT,
    vehicle_type TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Ensure Compatibility View
CREATE OR REPLACE VIEW vehicles AS
SELECT 
    v.id,
    v.number,
    v.callsign,
    v.is_active,
    v.created_at,
    v.updated_at,
    a.max_payload,
    a.fuel_type,
    a.vehicle_type
FROM master_vehicles v
LEFT JOIN logistics_vehicle_attrs a ON v.id = a.vehicle_id;

-- 3. Clean up old function signatures
DROP FUNCTION IF EXISTS rpc_execute_master_update(TEXT, UUID, JSONB, JSONB, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS rpc_execute_master_update(TEXT, TEXT, JSONB, JSONB, TEXT, TEXT, TEXT);

-- 4. Unified Robust RPC (Aligned with SDR Schema)
CREATE OR REPLACE FUNCTION rpc_execute_master_update(
    p_table_name TEXT,
    p_id TEXT DEFAULT NULL, 
    p_core_data JSONB DEFAULT '{}'::JSONB,
    p_ext_data JSONB DEFAULT '{}'::JSONB,
    p_decision_type TEXT DEFAULT 'MASTER_UPDATE',
    p_reason TEXT DEFAULT 'No reason provided',
    p_user_id TEXT DEFAULT NULL
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_proposal_id UUID;
    v_target_id UUID;
BEGIN
    -- Cast target ID
    v_target_id := CASE WHEN p_id IS NOT NULL AND p_id <> '' THEN CAST(p_id AS UUID) ELSE gen_random_uuid() END;

    -- A. Record Proposal (Using actual schema: proposal_type, status, proposed_value, reason, proposer_id)
    INSERT INTO decision_proposals (proposal_type, status, proposed_value, reason, proposer_id, target_id)
    VALUES (p_decision_type, 'APPROVED', p_core_data || p_ext_data, p_reason, p_user_id, v_target_id::TEXT)
    RETURNING id INTO v_proposal_id;

    -- B. Record Decision (Using actual schema: proposal_id, decision, decider_id)
    INSERT INTO decisions (proposal_id, decision, decider_id)
    VALUES (v_proposal_id, 'APPROVED', p_user_id);

    -- C. Update Core (master_vehicles)
    IF p_table_name = 'vehicles' THEN
        INSERT INTO master_vehicles (id, number, callsign, is_active, updated_at)
        VALUES (
            v_target_id,
            p_core_data->>'number',
            p_core_data->>'callsign',
            COALESCE((p_core_data->>'is_active')::BOOLEAN, true),
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            number = EXCLUDED.number,
            callsign = EXCLUDED.callsign,
            is_active = EXCLUDED.is_active,
            updated_at = NOW();

        -- D. Update Extension (logistics_vehicle_attrs)
        INSERT INTO logistics_vehicle_attrs (vehicle_id, max_payload, fuel_type, vehicle_type, updated_at)
        VALUES (
            v_target_id,
            (p_ext_data->>'max_payload')::NUMERIC,
            p_ext_data->>'fuel_type',
            p_ext_data->>'vehicle_type',
            NOW()
        )
        ON CONFLICT (vehicle_id) DO UPDATE SET
            max_payload = EXCLUDED.max_payload,
            fuel_type = EXCLUDED.fuel_type,
            vehicle_type = EXCLUDED.vehicle_type,
            updated_at = NOW();
    END IF;
END;
$$;

-- 5. Final Permission Check
GRANT EXECUTE ON FUNCTION rpc_execute_master_update TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_execute_master_update TO anon;

-- Force Cache Refresh
NOTIFY pgrst, 'reload schema';
