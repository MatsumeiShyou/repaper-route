-- ==========================================
-- 20260426_drop_rpc_overload_5arg.sql
-- Description: RPC オーバーロード競合 (PGRST203) の解消
-- Root Cause: rpc_execute_board_update が 5引数版と7引数版で並存しており、
--             PostgREST が曖昧性解消に失敗する。
-- Action: 5引数版を DROP し、7引数版のみを残す。
-- ==========================================

-- 5引数版のシグネチャ（PGRST203で確認済み）:
-- public.rpc_execute_board_update(p_date => date, p_new_state => jsonb, p_decision_type => text, p_reason => text, p_user_id => uuid)
DROP FUNCTION IF EXISTS public.rpc_execute_board_update(date, jsonb, text, text, uuid);
