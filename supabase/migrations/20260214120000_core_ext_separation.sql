-- ==========================================
-- DX OS Base/Extension Separation Model (Phase 4)
-- Core: master_vehicles
-- Extension: logistics_vehicle_attrs
-- ==========================================

-- 1. Rename existing 'vehicles' to 'master_vehicles' (Core Layer)
-- Note: Re-runnable check
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vehicles' AND table_type = 'BASE TABLE') THEN
        ALTER TABLE vehicles RENAME TO master_vehicles;
    END IF;
END $$;

-- 2. Ensure Core Columns
ALTER TABLE master_vehicles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE master_vehicles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Create Extension Table (Logistics Layer)
CREATE TABLE IF NOT EXISTS logistics_vehicle_attrs (
    vehicle_id UUID PRIMARY KEY REFERENCES master_vehicles(id) ON DELETE CASCADE,
    max_payload NUMERIC,
    fuel_type TEXT,
    vehicle_type TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Compatibility View
-- This allows existing code to keep using 'from(vehicles)' for Read operations
CREATE OR REPLACE VIEW vehicles AS
SELECT 
    v.id,
    v.number,
    v.is_active,
    v.created_at,
    v.updated_at,
    a.max_payload,
    a.fuel_type,
    a.vehicle_type
FROM master_vehicles v
LEFT JOIN logistics_vehicle_attrs a ON v.id = a.vehicle_id;

-- 5. SDR Master Update RPC (Atomic Proposal/Decision/State Update)
CREATE OR REPLACE FUNCTION rpc_execute_master_update(
    p_table_name TEXT,
    p_id UUID,
    p_core_data JSONB,
    p_ext_data JSONB,
    p_decision_type TEXT,
    p_reason TEXT,
    p_user_id TEXT
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_proposal_id UUID;
    v_decision_id UUID;
BEGIN
    -- 1. Record Proposal (Auto-approve for Master updates)
    INSERT INTO decision_proposals (status, proposed_data, reason_description, applicant_id, reviewed_at, reviewed_by)
    VALUES ('approved', p_core_data || p_ext_data, p_reason, p_user_id, NOW(), p_user_id)
    RETURNING proposal_id INTO v_proposal_id;

    -- 2. Record Decision
    INSERT INTO decisions (proposal_id, decision_type, actor_id)
    VALUES (v_proposal_id, p_decision_type, p_user_id)
    RETURNING decision_id INTO v_decision_id;

    -- 3. Update Core (master_vehicles)
    IF p_table_name = 'vehicles' THEN
        INSERT INTO master_vehicles (id, number, is_active, updated_at)
        VALUES (
            COALESCE(p_id, gen_random_uuid()),
            p_core_data->>'number',
            (p_core_data->>'is_active')::BOOLEAN,
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            number = EXCLUDED.number,
            is_active = EXCLUDED.is_active,
            updated_at = NOW()
        RETURNING id INTO p_id;

        -- 4. Update Extension (logistics_vehicle_attrs)
        INSERT INTO logistics_vehicle_attrs (vehicle_id, max_payload, fuel_type, vehicle_type, updated_at)
        VALUES (
            p_id,
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

    -- 5. Log Event
    INSERT INTO event_logs (decision_id, state_after, table_name)
    VALUES (v_decision_id, p_core_data || p_ext_data, p_table_name);
END;
$$;

-- 6. RLS Policies
ALTER TABLE master_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE logistics_vehicle_attrs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read for authenticated" ON master_vehicles;
CREATE POLICY "Enable read for authenticated" ON master_vehicles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable read for authenticated" ON logistics_vehicle_attrs;
CREATE POLICY "Enable read for authenticated" ON logistics_vehicle_attrs FOR SELECT TO authenticated USING (true);

-- RPC Permission
GRANT EXECUTE ON FUNCTION rpc_execute_master_update TO authenticated;
