-- Database View Repair: view_master_points
-- Description: Adds missing columns (location_id, collection_days, area) to enable proper persistence and display in Master UI.
-- Date: 2026-03-13

BEGIN;

DROP VIEW IF EXISTS public.view_master_points CASCADE;

CREATE VIEW public.view_master_points AS
SELECT 
    p.location_id,        -- UI Schema が期待するプライマリキー (ID名)
    p.location_id as id,   -- 既存の UUID 依存関係への互換性保持
    p.name,
    p.display_name,
    p.furigana,
    p.address,
    p.area,               -- 欠落していたカラム：地域
    p.note,
    p.note as internal_note,
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
    p.collection_days,     -- 欠落していたカラム：曜日設定（JSONB）
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

-- 権限の再割当て
GRANT SELECT ON public.view_master_points TO authenticated;
GRANT SELECT ON public.view_master_points TO anon;

COMMIT;
