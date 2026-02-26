-- Phase 100: Extend master_collection_points with physical constraints and operational attributes
-- Date: 2026-02-24

BEGIN;

-- 1. master_collection_points テーブルの拡張
ALTER TABLE public.master_collection_points 
    ADD COLUMN IF NOT EXISTS weighing_site_id TEXT,
    ADD COLUMN IF NOT EXISTS time_constraint_type TEXT CHECK (time_constraint_type IN ('NONE', 'RANGE', 'FIXED')) DEFAULT 'NONE',
    ADD COLUMN IF NOT EXISTS is_spot_only BOOLEAN DEFAULT FALSE;

-- コメント追加
COMMENT ON COLUMN public.master_collection_points.weighing_site_id IS '計量場所ID (将来的に master_weighing_sites.id を参照予定)';
COMMENT ON COLUMN public.master_collection_points.time_constraint_type IS '時間制約の厳格度 (NONE:なし, RANGE:枠, FIXED:固定)';
COMMENT ON COLUMN public.master_collection_points.is_spot_only IS '定期回収リストから除外するスポット専用フラグ';

-- 2. view_master_points の更新 (新カラムを含め、既存の構造を維持)
DROP VIEW IF EXISTS public.view_master_points CASCADE;
CREATE VIEW public.view_master_points AS
SELECT 
    p.location_id as id,
    p.name,
    p.display_name,
    p.address,
    p.note,
    p.internal_note,
    p.is_active,
    p.contractor_id,
    c.name as contractor_name,
    c.payee_id,
    -- 新規追加カラム
    p.weighing_site_id,
    p.time_constraint_type,
    p.is_spot_only,
    -- 既存カラムの継承
    p.visit_slot,
    p.vehicle_restriction_type,
    p.restricted_vehicle_id,
    p.target_item_category,
    p.site_contact_phone,
    p.created_at,
    p.updated_at
FROM 
    public.master_collection_points p
LEFT JOIN 
    public.master_contractors c ON p.contractor_id = c.contractor_id;

-- 3. 権限の再設定
GRANT SELECT ON public.view_master_points TO authenticated;
GRANT SELECT ON public.view_master_points TO anon;

COMMIT;
