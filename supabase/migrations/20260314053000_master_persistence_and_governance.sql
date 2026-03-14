-- Database Migration: Master Persistence & Governance (Phase 23)
-- Description: 
--   1. Adds UNIQUE constraint to location_id to prevent duplicates.
--   2. Repairs view_master_points to map 'id' to the actual physical UUID.
--   3. Exposes 'note' and keeps 'internal_note' for compatibility.
-- Date: 2026-03-14

BEGIN;

-- 1. 物理テーブルの制約強化
-- 重複がないことは事前チェック済み。空文字をNULLとして扱うなどの処理はせず、現状の文字列でユニーク性を担保。
ALTER TABLE public.master_collection_points 
ADD CONSTRAINT master_collection_points_location_id_key UNIQUE (location_id);

-- 2. View の完全修正
DROP VIEW IF EXISTS public.view_master_points CASCADE;

CREATE VIEW public.view_master_points AS
SELECT 
    p.id as id,                   -- 物理的な UUID (Deep Fetch 用)
    p.location_id as location_id, -- 管理番号 (TEXT)
    p.name,
    p.display_name,
    p.furigana,
    p.address,
    p.area,
    p.note,                       -- 本来のカラム名
    p.note as internal_note,      -- UI Schema 互換用 (ALIAS)
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

-- 3. 権限の再割当て
GRANT SELECT ON public.view_master_points TO authenticated;
GRANT SELECT ON public.view_master_points TO anon;

COMMIT;
