
-- Database Migration: Unified Structural Purge and RPC Standardization (100-Point Sanctuary Fix)
-- Description:
--   1. Drops ALL overloaded versions of rpc_execute_master_update and rpc_execute_board_update.
--   2. Re-creates authoritative 100-point versions with standardized signatures and audit trails.
--   3. Synchronizes redundant fields (is_spot, note, remarks) across all master tables.
-- Date: 2026-03-21
-- Protocol: 厳密アルゴリズム v4.1 / Sanctuary Integrity

BEGIN;

-- ==========================================
-- 1. 旧RPCの全削除 (Signature Clean-sweep)
-- ==========================================
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT p.oid::regprocedure as sig
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.proname IN ('rpc_execute_master_update', 'rpc_execute_board_update')
    ) LOOP
        EXECUTE 'DROP FUNCTION ' || r.sig || ' CASCADE';
    END LOOP;
END $$;

-- ==========================================
-- 2. 正典 RPC の再定義 (Master Data)
-- ==========================================
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
    v_target_id_text text;
    v_exists boolean;
    v_is_archive boolean;
    v_is_spot_val boolean;
BEGIN
    -- ID Normalization
    v_target_id_text := CASE WHEN p_id IS NOT NULL AND p_id <> '' THEN p_id ELSE NULL END;
    v_is_archive := COALESCE((p_core_data->>'is_active')::boolean = false, false);
    
    -- Existence Check or Create ID
    IF v_target_id_text IS NULL THEN
        v_target_id_text := gen_random_uuid()::text;
    ELSE
        -- Existence logic (simplified for multi-table)
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

    -- [AUDIT] Record SDR Proposal
    INSERT INTO public.decision_proposals (proposal_type, status, proposed_value, reason, proposer_id, target_id)
    VALUES (p_decision_type, 'APPROVED', (COALESCE(p_core_data, '{}'::jsonb) || COALESCE(p_ext_data, '{}'::jsonb)), p_reason, p_user_id, v_target_id_text);

    -- [EXECUTE] Unified Table Logic
    
    -- Master Collection Points
    IF p_table_name IN ('points', 'master_collection_points') THEN
        v_is_spot_val := COALESCE((p_core_data->>'is_spot_only')::boolean, (p_core_data->>'is_spot')::boolean);
        
        UPDATE public.master_collection_points SET
            display_name = COALESCE(p_core_data->>'display_name', display_name),
            furigana = COALESCE(p_core_data->>'furigana', furigana),
            address = COALESCE(p_core_data->>'address', address),
            -- Field Sync: is_spot synchronization
            is_spot_only = COALESCE(v_is_spot_val, is_spot_only),
            is_spot = COALESCE(v_is_spot_val, is_spot),
            -- Field Sync: note/internal_note synchronization
            note = COALESCE(p_core_data->>'note', p_core_data->>'internal_note', note),
            is_active = COALESCE((p_core_data->>'is_active')::boolean, is_active),
            updated_at = NOW()
        WHERE (v_target_id_text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' AND id = v_target_id_text::uuid) 
           OR location_id = v_target_id_text;
           
        IF NOT FOUND THEN
            INSERT INTO public.master_collection_points (location_id, display_name, furigana, name, address, is_spot_only, is_spot, note, is_active, updated_at)
            VALUES (v_target_id_text, p_core_data->>'display_name', p_core_data->>'furigana', COALESCE(p_core_data->>'name', p_core_data->>'display_name'), p_core_data->>'address', COALESCE(v_is_spot_val, false), COALESCE(v_is_spot_val, false), COALESCE(p_core_data->>'note', p_core_data->>'internal_note'), COALESCE((p_core_data->>'is_active')::boolean, true), NOW());
        END IF;

    -- Master Vehicles
    ELSIF p_table_name IN ('vehicles', 'master_vehicles') THEN
        UPDATE public.master_vehicles SET
            callsign = COALESCE(p_core_data->>'callsign', callsign),
            number = COALESCE(p_core_data->>'number', number),
            furigana = COALESCE(p_core_data->>'furigana', furigana),
            -- Field Sync: note/internal_note synchronization
            note = COALESCE(p_core_data->>'note', p_core_data->>'internal_note', note),
            is_active = COALESCE((p_core_data->>'is_active')::boolean, is_active),
            updated_at = NOW()
        WHERE id = v_target_id_text::uuid;
        
        IF NOT FOUND THEN
            INSERT INTO public.master_vehicles (id, number, callsign, furigana, note, is_active, updated_at)
            VALUES (v_target_id_text::uuid, p_core_data->>'number', p_core_data->>'callsign', p_core_data->>'furigana', COALESCE(p_core_data->>'note', p_core_data->>'internal_note'), COALESCE((p_core_data->>'is_active')::boolean, true), NOW());
        END IF;

    -- Drivers
    ELSIF p_table_name IN ('drivers') THEN
        UPDATE public.drivers SET
            driver_name = COALESCE(p_core_data->>'name', p_core_data->>'driver_name', driver_name),
            furigana = COALESCE(p_core_data->>'furigana', furigana),
            -- Field Sync: note/remarks synchronization
            note = COALESCE(p_core_data->>'note', p_core_data->>'remarks', note),
            is_active = COALESCE((p_core_data->>'is_active')::boolean, is_active),
            updated_at = NOW()
        WHERE id = v_target_id_text;
        
        IF NOT FOUND THEN
            INSERT INTO public.drivers (id, driver_name, furigana, note, is_active, updated_at)
            VALUES (v_target_id_text, COALESCE(p_core_data->>'name', p_core_data->>'driver_name'), p_core_data->>'furigana', COALESCE(p_core_data->>'note', p_core_data->>'remarks'), COALESCE((p_core_data->>'is_active')::boolean, true), NOW());
        END IF;
    END IF;
END;
$$;

-- ==========================================
-- 3. 正典 RPC の再定義 (Board Update)
-- ==========================================
CREATE OR REPLACE FUNCTION "public"."rpc_execute_board_update"(
    "p_date" "date", 
    "p_new_state" "jsonb", 
    "p_ext_data" "jsonb" DEFAULT '{}'::"jsonb", 
    "p_decision_type" "text" DEFAULT 'BOARD_SAVE'::"text", 
    "p_reason" "text" DEFAULT 'Board manual update'::"text", 
    "p_user_id" "text" DEFAULT NULL::"text",
    "p_client_meta" "jsonb" DEFAULT '{}'::"jsonb"
) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_result jsonb;
    v_proposal_id uuid;
BEGIN
    -- [AUDIT] Record SDR Proposal
    INSERT INTO public.decision_proposals (proposal_type, status, proposed_value, reason, proposer_id, target_id)
    VALUES (p_decision_type, 'APPROVED', (p_new_state || p_ext_data), p_reason, p_user_id, p_date::text)
    RETURNING id INTO v_proposal_id;

    -- [EXECUTE] Atomic Board Save
    INSERT INTO public.routes (date, jobs, drivers, splits, pending, updated_at, last_activity_at, edit_locked_by)
    VALUES (
        p_date,
        COALESCE(p_new_state->'jobs', '[]'::jsonb),
        COALESCE(p_new_state->'drivers', '[]'::jsonb),
        COALESCE(p_new_state->'splits', '[]'::jsonb),
        COALESCE(p_new_state->'pending', '[]'::jsonb),
        NOW(), NOW(), p_user_id::uuid
    )
    ON CONFLICT (date) DO UPDATE SET
        jobs = EXCLUDED.jobs,
        drivers = EXCLUDED.drivers,
        splits = EXCLUDED.splits,
        pending = EXCLUDED.pending,
        updated_at = NOW(),
        last_activity_at = NOW(),
        edit_locked_by = EXCLUDED.edit_locked_by;

    v_result := jsonb_build_object(
        'success', true,
        'proposal_id', v_proposal_id,
        'updated_at', NOW()
    );
    RETURN v_result;
END;
$$;

-- Permissions
GRANT EXECUTE ON FUNCTION public.rpc_execute_master_update TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.rpc_execute_board_update TO authenticated, anon, service_role;

COMMIT;
