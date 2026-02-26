-- Phase 102: Add missing columns for comprehensive master data
-- Date: 2026-02-26

BEGIN;

-- 1. master_collection_points に不足カラムを追加
ALTER TABLE public.master_collection_points 
    ADD COLUMN IF NOT EXISTS company_phone TEXT,
    ADD COLUMN IF NOT EXISTS manager_phone TEXT,
    ADD COLUMN IF NOT EXISTS special_type TEXT DEFAULT 'NONE',
    ADD COLUMN IF NOT EXISTS recurrence_pattern TEXT;

COMMENT ON COLUMN public.master_collection_points.company_phone IS '会社電話番号';
COMMENT ON COLUMN public.master_collection_points.manager_phone IS '担当者電話番号';
COMMENT ON COLUMN public.master_collection_points.special_type IS '特殊案件フラグ (NONE, SITE_WORK, MAINTENANCE 等)';
COMMENT ON COLUMN public.master_collection_points.recurrence_pattern IS '回収タイミング（その他・特殊パターン）';

-- 2. view_master_points の更新 (新規カラムを含める)
DROP VIEW IF EXISTS public.view_master_points CASCADE;
CREATE VIEW public.view_master_points AS
SELECT 
    p.location_id as id,
    p.name,
    p.display_name,
    p.furigana,
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
    p.company_phone,      -- 追加
    p.manager_phone,      -- 追加
    p.special_type,       -- 追加
    p.recurrence_pattern, -- 追加
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
