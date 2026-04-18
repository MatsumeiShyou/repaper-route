-- ==========================================
-- 20260419_00_foundational_repair.sql
-- Description: 基礎カラムの追加と過去の不整合（internal_note）の救済
-- ==========================================

BEGIN;

-- 1. master_collection_points に地理データと救済用カラムを追加
ALTER TABLE public.master_collection_points 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(12, 9),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(12, 9),
ADD COLUMN IF NOT EXISTS internal_note TEXT;

-- 2. 既存の note を internal_note にコピー（歴史の矛盾を吸収）
UPDATE public.master_collection_points 
SET internal_note = note 
WHERE internal_note IS NULL;

-- 3. master_vehicles に物理スペックカラムを追加
ALTER TABLE public.master_vehicles 
ADD COLUMN IF NOT EXISTS max_payload DECIMAL(10, 2);

-- 4. jobs に日付管理用物理カラムを追加（同期エンジンのアンカー）
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS scheduled_date DATE;

COMMIT;
