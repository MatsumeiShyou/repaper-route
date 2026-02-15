-- ==========================================
-- RESTORE GENERALIZED MASTER RPC (Force Recovery)
-- ==========================================

-- 1. Aggressive Cleanup
DROP FUNCTION IF EXISTS public.rpc_execute_master_update(text, text, jsonb, jsonb, text, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.rpc_execute_master_update(text, text, jsonb, jsonb, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.rpc_execute_master_update(text, text, jsonb, jsonb, text) CASCADE;
DROP FUNCTION IF EXISTS public.rpc_execute_master_update(text, text, jsonb, jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.rpc_execute_master_update(text, text, jsonb) CASCADE;

-- 2. Define robust generalized RPC
CREATE OR REPLACE FUNCTION public.rpc_execute_master_update(
    p_table_name text,
    p_id text DEFAULT NULL, 
    p_core_data jsonb DEFAULT '{}'::jsonb,
    p_ext_data jsonb DEFAULT '{}'::jsonb,
    p_decision_type text DEFAULT 'MASTER_UPDATE',
    p_reason text DEFAULT 'No reason provided',
    p_user_id text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_proposal_id uuid;
    v_target_id_uuid uuid;
    v_target_id_text text;
BEGIN
    -- [A] ID Normalization
    v_target_id_text := CASE WHEN p_id IS NOT NULL AND p_id <> '' THEN p_id ELSE gen_random_uuid()::text END;

    -- [B] SDR Auditing
    INSERT INTO public.decision_proposals (proposal_type, status, proposed_value, reason, proposer_id, target_id)
    VALUES (p_decision_type, 'APPROVED', (COALESCE(p_core_data, '{}'::jsonb) || COALESCE(p_ext_data, '{}'::jsonb)), p_reason, p_user_id, v_target_id_text)
    RETURNING id INTO v_proposal_id;

    INSERT INTO public.decisions (proposal_id, decision, decider_id)
    VALUES (v_proposal_id, 'APPROVED', p_user_id);

    -- [C] Core Logic
    
    -- 1. VEHICLES
    IF p_table_name = 'vehicles' THEN
        v_target_id_uuid := CASE WHEN v_target_id_text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN v_target_id_text::uuid ELSE gen_random_uuid() END;
        
        INSERT INTO public.master_vehicles (id, number, callsign, is_active, updated_at)
        VALUES (
            v_target_id_uuid,
            p_core_data->>'number',
            p_core_data->>'callsign',
            COALESCE((p_core_data->>'is_active')::boolean, true),
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            number = EXCLUDED.number,
            callsign = EXCLUDED.callsign,
            is_active = EXCLUDED.is_active,
            updated_at = NOW();

        INSERT INTO public.logistics_vehicle_attrs (vehicle_id, max_payload, fuel_type, vehicle_type, updated_at)
        VALUES (
            v_target_id_uuid,
            (p_ext_data->>'max_payload')::numeric,
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
        v_target_id_uuid := CASE WHEN v_target_id_text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN v_target_id_text::uuid ELSE gen_random_uuid() END;

        INSERT INTO public.master_items (id, name, unit, display_order, is_active, updated_at)
        VALUES (
            v_target_id_uuid,
            p_core_data->>'name',
            p_core_data->>'unit',
            COALESCE((p_core_data->>'display_order')::integer, 0),
            COALESCE((p_core_data->>'is_active')::boolean, true),
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
        INSERT INTO public.master_collection_points (location_id, name, address, contractor_id, note, is_active, updated_at)
        VALUES (
            v_target_id_text,
            p_core_data->>'name',
            p_core_data->>'address',
            p_core_data->>'contractor_id',
            p_core_data->>'note',
            COALESCE((p_core_data->>'is_active')::boolean, true),
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
        INSERT INTO public.drivers (id, driver_name, display_order, user_id, updated_at)
        VALUES (
            v_target_id_text,
            COALESCE(p_core_data->>'name', p_core_data->>'driver_name'),
            COALESCE((p_core_data->>'display_order')::integer, 999),
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
        v_target_id_text := v_target_id_text::text; -- Profiles can be text IDs
        INSERT INTO public.profiles (id, name, role, vehicle_info, updated_at)
        VALUES (
            v_target_id_text,
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

GRANT EXECUTE ON FUNCTION public.rpc_execute_master_update TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_execute_master_update TO anon;
GRANT EXECUTE ON FUNCTION public.rpc_execute_master_update TO service_role;
NOTIFY pgrst, 'reload schema';
