-- Phase 11: Fix drivers table schema
-- 欠落していた display_order カラムを追加し、400 Bad Request を解消する

ALTER TABLE drivers ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 999;

-- 既存データの並び順をID順に初期化
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY id) as rn
  FROM drivers
)
UPDATE drivers
SET display_order = ranked.rn
FROM ranked
WHERE drivers.id = ranked.id;
