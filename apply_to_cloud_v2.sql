-- RePaper Route: 実務者向け高度化マイグレーション (Area追加 & View拡張) [修正版]
-- ※Supabase Dashboard (SQL Editor) にて本内容を貼り付けて【RUN】を実行してください

BEGIN;

---------------------------------------------------------------------------------
-- 1. master_collection_points テーブルへの Area カラム追加
---------------------------------------------------------------------------------
ALTER TABLE public.master_collection_points 
    ADD COLUMN IF NOT EXISTS area TEXT;

COMMENT ON COLUMN public.master_collection_points.area IS '地域・エリア (例: 中央区, 南区など)';

---------------------------------------------------------------------------------
-- 2. view_master_points の拡張 (一度削除して再作成することでカラム変更を許容)
---------------------------------------------------------------------------------
DROP VIEW IF EXISTS public.view_master_points;

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
    p.weighing_site_id,
    p.time_constraint_type,
    p.is_spot_only,
    p.visit_slot,
    p.vehicle_restriction_type,
    p.restricted_vehicle_id,
    p.target_item_category,
    p.site_contact_phone,
    -- 実務で必要な追加項目
    p.area,
    p.collection_days,
    p.default_route_code,
    p.created_at,
    p.updated_at
FROM 
    public.master_collection_points p
LEFT JOIN 
    public.master_contractors c ON p.contractor_id = c.contractor_id;

GRANT SELECT ON public.view_master_points TO authenticated;
GRANT SELECT ON public.view_master_points TO anon;

---------------------------------------------------------------------------------
-- 3. PostgREST のキャッシュクリア
---------------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';

COMMIT;
