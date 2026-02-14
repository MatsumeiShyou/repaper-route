-- ==========================================
-- Phase 2.2: Exclusive Edit Lock Migration
-- 排他的編集ロック機構の追加
-- ==========================================
-- 実行日: 2026-02-06
-- 目的: routesテーブルに編集権管理カラムを追加

-- カラム追加（冪等性対応）
ALTER TABLE routes 
ADD COLUMN IF NOT EXISTS edit_locked_by TEXT,
ADD COLUMN IF NOT EXISTS edit_locked_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP WITH TIME ZONE;

-- デフォルト値設定（既存レコード用）
UPDATE routes 
SET edit_locked_by = NULL,
    edit_locked_at = NULL,
    last_activity_at = NULL
WHERE edit_locked_by IS NULL;

-- インデックス追加（タイムアウト判定の高速化）
CREATE INDEX IF NOT EXISTS idx_routes_edit_lock ON routes(edit_locked_by, last_activity_at);
