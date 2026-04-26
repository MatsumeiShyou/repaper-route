-- ==========================================
-- 20260419_01_view_opening.sql
-- Description: マスタ座標 View の刷新（地理データの全開通）
-- ==========================================

BEGIN;

DROP VIEW IF EXISTS public.view_master_points CASCADE;

CREATE VIEW public.view_master_points AS
SELECT 
    p.location_id,
    p.location_id as id,
    p.name,
    p.display_name,
    p.furigana,
    p.address,
    p.latitude,           -- 先行追加した物理座標
    p.longitude,          -- 先行追加した物理座標
    p.area,
    p.note,
    p.internal_note,      -- 物理カラム化した内部メモ
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
    p.collection_days,
    p.target_item_category,
    p.site_contact_phone,
    p.company_phone,
    p.manager_phone,
    p.special_type,
    p.recurrence_pattern,
    p.created_at,
    p.updated_at
FROM 
    public.master_collection_points p
LEFT JOIN 
    public.master_contractors c ON p.contractor_id = c.contractor_id;

GRANT SELECT ON public.view_master_points TO authenticated;
GRANT SELECT ON public.view_master_points TO anon;

COMMIT;
