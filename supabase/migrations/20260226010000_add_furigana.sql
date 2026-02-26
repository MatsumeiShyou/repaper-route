-- Phase 101: Add furigana column for enhanced search and sorting
-- Date: 2026-02-26

BEGIN;

-- 1. master_collection_points テーブルに furigana カラムを追加
ALTER TABLE public.master_collection_points 
    ADD COLUMN IF NOT EXISTS furigana TEXT;

COMMENT ON COLUMN public.master_collection_points.furigana IS '地点名のふりがな（検索・ソート用）';

-- 2. view_master_points の更新 (furigana を含める)
DROP VIEW IF EXISTS public.view_master_points CASCADE;
CREATE VIEW public.view_master_points AS
SELECT 
    p.location_id as id,
    p.name,
    p.display_name,
    p.furigana, -- 追加
    p.address,
    p.note,
    p.internal_note,
    p.is_active,
    p.contractor_id,
    c.name as contractor_name,
    c.payee_id,
    p.weighing_site_id,
    p.time_constraint_type,
    p.is_spot_only,
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
