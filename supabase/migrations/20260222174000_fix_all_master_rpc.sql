-- 20260222174000_fix_all_master_rpc.sql
-- 全マスタ不整合解消のための RPC 関数拡張

CREATE OR REPLACE FUNCTION "public"."rpc_execute_master_update"(
    "p_table_name" "text", 
    "p_id" "text" DEFAULT NULL::"text", 
    "p_core_data" "jsonb" DEFAULT '{}'::"jsonb", 
    "p_ext_data" "jsonb" DEFAULT '{}'::"jsonb", 
    "p_decision_type" "text" DEFAULT 'MASTER_UPDATE'::"text", 
    "p_reason" "text" DEFAULT 'No reason provided'::"text", 
    "p_user_id" "text" DEFAULT NULL::"text"
) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
        
        -- master_vehicles INSERT/UPDATE
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

        -- logistics_vehicle_attrs INSERT/UPDATE (Phase B-1)
        INSERT INTO public.logistics_vehicle_attrs (vehicle_id, vehicle_type, updated_at)
        VALUES (
            v_target_id_uuid,
            p_core_data->>'vehicle_type',
            NOW()
        )
        ON CONFLICT (vehicle_id) DO UPDATE SET
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
    ELSIF p_table_name = 'points' OR p_table_name = 'master_collection_points' THEN
        INSERT INTO public.master_collection_points (
            location_id, 
            name, 
            display_name,
            address, 
            contractor_id, 
            visit_slot,
            vehicle_restriction_type,
            restricted_vehicle_id,
            target_item_category,
            entry_instruction,
            safety_note,
            site_contact_phone,
            note, 
            is_active, 
            updated_at
        )
        VALUES (
            v_target_id_text,
            COALESCE(p_core_data->>'name', p_core_data->>'display_name'),
            p_core_data->>'display_name',
            p_core_data->>'address',
            p_core_data->>'contractor_id',
            COALESCE(p_core_data->>'visit_slot', 'FREE'),
            COALESCE(p_core_data->>'vehicle_restriction_type', 'NONE'),
            CASE WHEN p_core_data->>'restricted_vehicle_id' IS NULL OR p_core_data->>'restricted_vehicle_id' = '' THEN NULL ELSE (p_core_data->>'restricted_vehicle_id')::uuid END,
            p_core_data->>'target_item_category',
            p_core_data->>'entry_instruction',
            p_core_data->>'safety_note',
            p_core_data->>'site_contact_phone',
            p_core_data->>'note',
            COALESCE((p_core_data->>'is_active')::boolean, true),
            NOW()
        )
        ON CONFLICT (location_id) DO UPDATE SET
            name = EXCLUDED.name,
            display_name = EXCLUDED.display_name,
            address = EXCLUDED.address,
            contractor_id = EXCLUDED.contractor_id,
            visit_slot = EXCLUDED.visit_slot,
            vehicle_restriction_type = EXCLUDED.vehicle_restriction_type,
            restricted_vehicle_id = EXCLUDED.restricted_vehicle_id,
            target_item_category = EXCLUDED.target_item_category,
            entry_instruction = EXCLUDED.entry_instruction,
            safety_note = EXCLUDED.safety_note,
            site_contact_phone = EXCLUDED.site_contact_phone,
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
            
    -- 6. CONTRACTORS (Master Contractors) (Phase C-1)
    ELSIF p_table_name = 'contractors' OR p_table_name = 'master_contractors' THEN
        INSERT INTO public.master_contractors (contractor_id, name, payee_id, updated_at)
        VALUES (
            v_target_id_text,
            p_core_data->>'name',
            p_core_data->>'payee_id',
            NOW()
        )
        ON CONFLICT (contractor_id) DO UPDATE SET
            name = EXCLUDED.name,
            payee_id = EXCLUDED.payee_id,
            updated_at = NOW();
    
    ELSE
        RAISE EXCEPTION 'Unknown table name: %', p_table_name;
    END IF;
END;
$$;
