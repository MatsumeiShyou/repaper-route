-- ==========================================
-- Migration: 20260426000000_db_audit_fixes
-- Description: Fix 5 structural defects identified in DB deep audit
-- ==========================================

BEGIN;

-- 欠陥1 (P0): event_logs テーブルの作成
CREATE TABLE IF NOT EXISTS public.event_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    decision_id UUID REFERENCES public.decisions(id) ON DELETE CASCADE,
    table_name TEXT NOT NULL,
    state_before JSONB,
    state_after JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);
ALTER TABLE public.event_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.event_logs FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.event_logs FOR INSERT TO authenticated WITH CHECK (true);

-- 欠陥2 (P1): 3引数版 RPC のドロップ
DROP FUNCTION IF EXISTS public.rpc_execute_board_update(date, jsonb, jsonb);

-- 欠陥5 (P1): routes の anon ALL ポリシー削除
DROP POLICY IF EXISTS "Enable all access for anon" ON public.routes;

-- 欠陥3 (P2): staffs の重複 SELECT ポリシー整理
-- (Keep 'staffs_select_all_authenticated', drop the others)
DROP POLICY IF EXISTS "Allow Auth Select" ON public.staffs;
DROP POLICY IF EXISTS "Staffs are viewable by all authenticated users" ON public.staffs;
DROP POLICY IF EXISTS "staffs_select_own" ON public.staffs;
DROP POLICY IF EXISTS "staffs_select_self" ON public.staffs;

-- 欠陥4 (P2): 開発管理者 の auth_uid / allowed_apps 修正
UPDATE public.staffs 
SET auth_uid = id, 
    allowed_apps = '["repaper-route", "repaper-route-admin", "dxos-board"]'::jsonb 
WHERE name = '開発管理者';

COMMIT;
