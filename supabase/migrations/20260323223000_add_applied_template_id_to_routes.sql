-- routes テーブルに適用済みテンプレート ID を保持するカラムを追加
-- これにより、セッションやユーザーを跨いで「どのテンプレートに基づく変更か」を追跡可能にする

ALTER TABLE routes ADD COLUMN IF NOT EXISTS applied_template_id UUID REFERENCES board_templates(id) ON DELETE SET NULL;

COMMENT ON COLUMN routes.applied_template_id IS 'この配車日付に最後に適用されたテンプレートのID。差分マージ（Update）機能で使用。';

-- RPC の再定義（applied_template_id を含める）
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
    v_applied_tpl_id uuid;
BEGIN
    -- Extract applied_template_id from p_new_state or p_ext_data
    v_applied_tpl_id := COALESCE(
        (p_new_state->>'applied_template_id')::uuid,
        (p_ext_data->>'applied_template_id')::uuid
    );

    -- [AUDIT] Record SDR Proposal
    INSERT INTO public.decision_proposals (proposal_type, status, proposed_value, reason, proposer_id, target_id)
    VALUES (p_decision_type, 'APPROVED', (p_new_state || p_ext_data), p_reason, p_user_id, p_date::text)
    RETURNING id INTO v_proposal_id;

    -- [EXECUTE] Atomic Board Save (with applied_template_id)
    INSERT INTO public.routes (date, jobs, drivers, splits, pending, applied_template_id, updated_at, last_activity_at, edit_locked_by)
    VALUES (
        p_date,
        COALESCE(p_new_state->'jobs', '[]'::jsonb),
        COALESCE(p_new_state->'drivers', '[]'::jsonb),
        COALESCE(p_new_state->'splits', '[]'::jsonb),
        COALESCE(p_new_state->'pending', '[]'::jsonb),
        v_applied_tpl_id,
        NOW(), NOW(), p_user_id::uuid
    )
    ON CONFLICT (date) DO UPDATE SET
        jobs = EXCLUDED.jobs,
        drivers = EXCLUDED.drivers,
        splits = EXCLUDED.splits,
        pending = EXCLUDED.pending,
        applied_template_id = COALESCE(EXCLUDED.applied_template_id, routes.applied_template_id),
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
