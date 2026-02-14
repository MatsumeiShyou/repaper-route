-- ==========================================
-- Phase 5: Generalized Master RPC & Schema Polish
-- ==========================================

-- 1. Ensure updated_at exists for all masters
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE master_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE master_collection_points ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Define robust generalized RPC
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
    v_target_id_uuid UUID;
    v_target_id_text TEXT;
BEGIN
    -- [A] Target ID Normalization
    -- UUID: vehicles, items(master_items), users(profiles)
    -- TEXT: points(master_collection_points), drivers
    
    IF p_table_name IN ('vehicles', 'items', 'users') THEN
        v_target_id_uuid := CASE WHEN p_id IS NOT NULL AND p_id <> '' THEN CAST(p_id AS UUID) ELSE gen_random_uuid() END;
        v_target_id_text := v_target_id_uuid::TEXT;
    ELSE
        v_target_id_text := CASE WHEN p_id IS NOT NULL AND p_id <> '' THEN p_id ELSE gen_random_uuid()::TEXT END;
    END IF;

    -- [B] SDR Auditing
    INSERT INTO decision_proposals (proposal_type, status, proposed_value, reason, proposer_id, target_id)
    VALUES (p_decision_type, 'APPROVED', (COALESCE(p_core_data, '{}'::JSONB) || COALESCE(p_ext_data, '{}'::JSONB)), p_reason, p_user_id, v_target_id_text)
    RETURNING id INTO v_proposal_id;

    INSERT INTO decisions (proposal_id, decision, decider_id)
    VALUES (v_proposal_id, 'APPROVED', p_user_id);

    -- [C] Table Updates
    
    -- 1. VEHICLES
    IF p_table_name = 'vehicles' THEN
        INSERT INTO master_vehicles (id, number, callsign, is_active, updated_at)
        VALUES (
            v_target_id_uuid,
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

        INSERT INTO logistics_vehicle_attrs (vehicle_id, max_payload, fuel_type, vehicle_type, updated_at)
        VALUES (
            v_target_id_uuid,
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

    -- 2. ITEMS
    ELSIF p_table_name = 'items' THEN
        INSERT INTO master_items (id, name, unit, display_order, is_active, updated_at)
        VALUES (
            v_target_id_uuid,
            p_core_data->>'name',
            p_core_data->>'unit',
            COALESCE((p_core_data->>'display_order')::INTEGER, 0),
            COALESCE((p_core_data->>'is_active')::BOOLEAN, true),
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            unit = EXCLUDED.unit,
            display_order = EXCLUDED.display_order,
            is_active = EXCLUDED.is_active,
            updated_at = NOW();

    -- 3. POINTS (Collection Points)
    ELSIF p_table_name = 'points' THEN
        INSERT INTO master_collection_points (location_id, name, address, contractor_id, note, is_active, updated_at)
        VALUES (
            v_target_id_text,
            p_core_data->>'name',
            p_core_data->>'address',
            p_core_data->>'contractor_id',
            p_core_data->>'note',
            COALESCE((p_core_data->>'is_active')::BOOLEAN, true),
            NOW()
        )
        ON CONFLICT (location_id) DO UPDATE SET
            name = EXCLUDED.name,
            address = EXCLUDED.address,
            contractor_id = EXCLUDED.contractor_id,
            note = EXCLUDED.note,
            is_active = EXCLUDED.is_active,
            updated_at = NOW();

    -- 4. DRIVERS
    ELSIF p_table_name = 'drivers' THEN
        INSERT INTO drivers (id, driver_name, display_order, user_id, updated_at)
        VALUES (
            v_target_id_text,
            p_core_data->>'driver_name',
            COALESCE((p_core_data->>'display_order')::INTEGER, 999),
            p_core_data->>'user_id',
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            driver_name = EXCLUDED.driver_name,
            display_order = EXCLUDED.display_order,
            user_id = EXCLUDED.user_id,
            updated_at = NOW();

    -- 5. USERS (Profiles)
    ELSIF p_table_name = 'users' THEN
        INSERT INTO profiles (id, name, role, vehicle_info, updated_at)
        VALUES (
            v_target_id_uuid,
            p_core_data->>'name',
            p_core_data->>'role',
            p_core_data->>'vehicle_info',
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            role = EXCLUDED.role,
            vehicle_info = EXCLUDED.vehicle_info,
            updated_at = NOW();
    END IF;
END;
$$;

-- 3. Final Permissions Consistency
GRANT EXECUTE ON FUNCTION rpc_execute_master_update TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_execute_master_update TO anon;
NOTIFY pgrst, 'reload schema';
