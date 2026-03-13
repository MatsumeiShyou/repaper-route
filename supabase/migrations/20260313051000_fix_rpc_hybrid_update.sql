-- Phase 104: Fix hybrid ID lookup in rpc_execute_master_update
-- Date: 2026-03-13
-- Target: Ensure UPDATE matches either id (UUID) or location_id (Text)

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
    v_is_archive boolean;
    v_exists boolean;
BEGIN
    -- [1] Intent Analysis & ID Normalization
    v_is_archive := COALESCE((p_core_data->>'is_active')::boolean = false, false);
    v_target_id_text := CASE WHEN p_id IS NOT NULL AND p_id <> '' THEN p_id ELSE NULL END;

    -- [2] Logical Validation
    IF v_target_id_text IS NULL THEN
        -- 新規作成 (CREATE)
        IF v_is_archive THEN
            RAISE EXCEPTION 'Cannot create an archived record.';
        END IF;
        
        v_target_id_text := gen_random_uuid()::text;
    ELSE
        -- 更新 or 削除 (UPDATE/ARCHIVE)
        IF p_table_name IN ('points', 'master_collection_points') THEN
            IF v_target_id_text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
                SELECT EXISTS(SELECT 1 FROM public.master_collection_points WHERE id = v_target_id_text::uuid) INTO v_exists;
            ELSE
                SELECT EXISTS(SELECT 1 FROM public.master_collection_points WHERE location_id = v_target_id_text) INTO v_exists;
            END IF;
        ELSE
            EXECUTE format('SELECT EXISTS(SELECT 1 FROM public.%I WHERE %I = $1)', 
                CASE 
                    WHEN p_table_name = 'contractors' THEN 'master_contractors'
                    WHEN p_table_name = 'items' THEN 'master_items'
                    WHEN p_table_name = 'vehicles' THEN 'master_vehicles'
                    ELSE p_table_name 
                END,
                CASE 
                    WHEN p_table_name IN ('contractors', 'master_contractors') THEN 'contractor_id'
                    ELSE 'id'
                END
            ) INTO v_exists USING v_target_id_text;
        END IF;

        IF NOT v_exists THEN
            RAISE EXCEPTION 'Target record % not found in %', v_target_id_text, p_table_name;
        END IF;
    END IF;

    -- [3] SDR Auditing
    INSERT INTO public.decision_proposals (proposal_type, status, proposed_value, reason, proposer_id, target_id)
    VALUES (p_decision_type, 'APPROVED', (COALESCE(p_core_data, '{}'::jsonb) || COALESCE(p_ext_data, '{}'::jsonb)), p_reason, p_user_id, v_target_id_text)
    RETURNING id INTO v_proposal_id;

    INSERT INTO public.decisions (proposal_id, decision, decider_id)
    VALUES (v_proposal_id, 'APPROVED', p_user_id);

    -- [4] Final Execution
    
    -- 1. VEHICLES
    IF p_table_name = 'vehicles' OR p_table_name = 'master_vehicles' THEN
        v_target_id_uuid := v_target_id_text::uuid;
        INSERT INTO public.master_vehicles (id, number, callsign, is_active, updated_at)
        VALUES (v_target_id_uuid, p_core_data->>'number', p_core_data->>'callsign', COALESCE((p_core_data->>'is_active')::boolean, true), NOW())
        ON CONFLICT (id) DO UPDATE SET
            number = COALESCE(p_core_data->>'number', public.master_vehicles.number),
            callsign = COALESCE(p_core_data->>'callsign', public.master_vehicles.callsign),
            is_active = COALESCE((p_core_data->>'is_active')::boolean, public.master_vehicles.is_active),
            updated_at = NOW();

        IF NOT v_is_archive AND p_core_data ? 'vehicle_type' THEN
            INSERT INTO public.logistics_vehicle_attrs (vehicle_id, vehicle_type, updated_at)
            VALUES (v_target_id_uuid, p_core_data->>'vehicle_type', NOW())
            ON CONFLICT (vehicle_id) DO UPDATE SET
                vehicle_type = COALESCE(p_core_data->>'vehicle_type', public.logistics_vehicle_attrs.vehicle_type),
                updated_at = NOW();
        END IF;

    -- 2. ITEMS
    ELSIF p_table_name = 'items' OR p_table_name = 'master_items' THEN
        v_target_id_uuid := v_target_id_text::uuid;
        INSERT INTO public.master_items (id, name, unit, display_order, is_active, updated_at)
        VALUES (v_target_id_uuid, p_core_data->>'name', COALESCE(p_core_data->>'unit', '袋'), COALESCE((p_core_data->>'display_order')::integer, 0), COALESCE((p_core_data->>'is_active')::boolean, true), NOW())
        ON CONFLICT (id) DO UPDATE SET
            name = COALESCE(p_core_data->>'name', public.master_items.name),
            unit = COALESCE(p_core_data->>'unit', public.master_items.unit),
            display_order = COALESCE((p_core_data->>'display_order')::integer, public.master_items.display_order),
            is_active = COALESCE((p_core_data->>'is_active')::boolean, public.master_items.is_active),
            updated_at = NOW();

    -- 3. POINTS (IMPROVED HYBRID UPDATE)
    ELSIF p_table_name = 'points' OR p_table_name = 'master_collection_points' THEN
        -- 共通の更新処理を定義
        UPDATE public.master_collection_points SET
            display_name = COALESCE(p_core_data->>'display_name', display_name),
            furigana = COALESCE(p_core_data->>'furigana', furigana),
            address = COALESCE(p_core_data->>'address', address),
            area = COALESCE(p_core_data->>'area', area),
            contractor_id = COALESCE(p_core_data->>'contractor_id', contractor_id),
            visit_slot = COALESCE(p_core_data->>'visit_slot', visit_slot),
            vehicle_restriction_type = COALESCE(p_core_data->>'vehicle_restriction_type', vehicle_restriction_type),
            restricted_vehicle_id = CASE 
                WHEN p_core_data ? 'restricted_vehicle_id' THEN (CASE WHEN p_core_data->>'restricted_vehicle_id' = '' THEN NULL ELSE (p_core_data->>'restricted_vehicle_id')::uuid END)
                ELSE restricted_vehicle_id
            END,
            collection_days = COALESCE(p_core_data->'collection_days', collection_days),
            target_item_category = COALESCE(p_core_data->>'target_item_category', target_item_category),
            weighing_site_id = COALESCE(p_core_data->>'weighing_site_id', weighing_site_id),
            time_constraint_type = COALESCE(p_core_data->>'time_constraint_type', time_constraint_type),
            is_spot_only = COALESCE((p_core_data->>'is_spot_only')::boolean, is_spot_only),
            company_phone = COALESCE(p_core_data->>'company_phone', company_phone),
            manager_phone = COALESCE(p_core_data->>'manager_phone', manager_phone),
            special_type = COALESCE(p_core_data->>'special_type', special_type),
            recurrence_pattern = COALESCE(p_core_data->>'recurrence_pattern', recurrence_pattern),
            site_contact_phone = COALESCE(p_core_data->>'site_contact_phone', site_contact_phone),
            internal_note = COALESCE(p_core_data->>'internal_note', internal_note),
            is_active = COALESCE((p_core_data->>'is_active')::boolean, is_active),
            updated_at = NOW()
        WHERE 
            (v_target_id_text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' AND id = v_target_id_text::uuid) 
            OR 
            (NOT v_target_id_text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' AND location_id = v_target_id_text);
        
        -- IF NOT FOUND (Create)
        IF NOT FOUND AND NOT v_target_id_text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
            INSERT INTO public.master_collection_points (
                location_id, display_name, furigana, name, address, area, contractor_id, visit_slot,
                vehicle_restriction_type, restricted_vehicle_id, collection_days, target_item_category,
                weighing_site_id, time_constraint_type, is_spot_only,
                company_phone, manager_phone, special_type, recurrence_pattern,
                site_contact_phone, internal_note, is_active, updated_at
            )
            VALUES (
                v_target_id_text, 
                p_core_data->>'display_name', 
                p_core_data->>'furigana',
                COALESCE(p_core_data->>'name', p_core_data->>'display_name'), 
                p_core_data->>'address', 
                p_core_data->>'area',
                p_core_data->>'contractor_id', 
                COALESCE(p_core_data->>'visit_slot', 'FREE'), 
                COALESCE(p_core_data->>'vehicle_restriction_type', 'NONE'), 
                CASE WHEN p_core_data->>'restricted_vehicle_id' IS NULL OR p_core_data->>'restricted_vehicle_id' = '' THEN NULL ELSE (p_core_data->>'restricted_vehicle_id')::uuid END, 
                COALESCE(p_core_data->'collection_days', '{}'::jsonb),
                p_core_data->>'target_item_category',
                p_core_data->>'weighing_site_id',
                COALESCE(p_core_data->>'time_constraint_type', 'NONE'),
                COALESCE((p_core_data->>'is_spot_only')::boolean, false),
                p_core_data->>'company_phone',
                p_core_data->>'manager_phone',
                COALESCE(p_core_data->>'special_type', 'NONE'),
                p_core_data->>'recurrence_pattern',
                p_core_data->>'site_contact_phone',
                p_core_data->>'internal_note',
                COALESCE((p_core_data->>'is_active')::boolean, true), 
                NOW()
            );
        END IF;

    -- 4. DRIVERS
    ELSIF p_table_name = 'drivers' THEN
        INSERT INTO public.drivers (id, driver_name, display_order, user_id, is_active, updated_at)
        VALUES (v_target_id_text, COALESCE(p_core_data->>'name', p_core_data->>'driver_name'), COALESCE((p_core_data->>'display_order')::integer, 999), p_core_data->>'user_id', COALESCE((p_core_data->>'is_active')::boolean, true), NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            driver_name = COALESCE(p_core_data->>'name', p_core_data->>'driver_name', public.drivers.driver_name),
            is_active = COALESCE((p_core_data->>'is_active')::boolean, public.drivers.is_active),
            updated_at = NOW();

    -- 5. CONTRACTORS
    ELSIF p_table_name = 'contractors' OR p_table_name = 'master_contractors' THEN
        INSERT INTO public.master_contractors (contractor_id, name, payee_id, is_active, updated_at)
        VALUES (v_target_id_text, p_core_data->>'name', p_core_data->>'payee_id', COALESCE((p_core_data->>'is_active')::boolean, true), NOW()
        )
        ON CONFLICT (contractor_id) DO UPDATE SET
            name = COALESCE(p_core_data->>'name', public.master_contractors.name),
            is_active = COALESCE((p_core_data->>'is_active')::boolean, public.master_contractors.is_active),
            updated_at = NOW();
    
    ELSE
        RAISE EXCEPTION 'Unknown table name: %', p_table_name;
    END IF;
END;
$$;
