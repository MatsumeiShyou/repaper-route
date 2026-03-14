-- Database Migration: Recover SSOT View (view_master_points)
-- Description:
--   1. Purges all temporary/ghost views (v1-v4).
--   2. Re-establishes view_master_points as the Single Source of Truth (SSOT).
--   3. Maps all physical columns required by the UI for search and display.
-- Date: 2026-03-14

BEGIN;

-- 1. 旧世代の View を抹消
DROP VIEW IF EXISTS public.view_master_points_v2 CASCADE;
DROP VIEW IF EXISTS public.view_master_points_v3 CASCADE;
DROP VIEW IF EXISTS public.view_master_points_v4 CASCADE;
DROP VIEW IF EXISTS public.view_master_points CASCADE;

-- 2. SSOT View の定義 (物理テーブルの全27+カラムを網羅)
CREATE VIEW public.view_master_points AS
SELECT 
    p.id,                               -- 物理 UUID
    p.location_id,                      -- 管理番号
    p.name,
    p.display_name,
    p.furigana,
    p.address,
    p.area,
    p.note,                             -- オリジナル備考
    p.note as internal_note,            -- 旧UI互換用エイリアス
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
    p.default_route_code,               -- 欠落していた検索対象カラム
    p.created_at,
    p.updated_at
FROM 
    public.master_collection_points p
LEFT JOIN 
    public.master_contractors c ON p.contractor_id = c.contractor_id;

-- 3. 権限の厳正な再定義
GRANT SELECT ON public.view_master_points TO authenticated;
GRANT SELECT ON public.view_master_points TO anon;
GRANT SELECT ON public.view_master_points TO service_role;

-- 4. インフラリフレッシュのヒント (コメントポーク)
COMMENT ON VIEW public.view_master_points IS 'SSOT for Master Collection Points (v3.1 Recovery)';

COMMIT;
