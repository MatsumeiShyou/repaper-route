-- ================================================
-- Phase 3.2: バケットシステム再設計 (Blueprint v2.1)
-- ================================================
-- 作成日: 2026-02-06
-- 目的: 制約ベースの4バケット分類のためのデータモデル拡張

-- ----------------------------------------
-- 1. jobs テーブルに新カラム追加
-- ----------------------------------------

-- スポット案件フラグ（既存: bucketType からの移行）
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS is_spot BOOLEAN DEFAULT false;

-- 時間制約情報（JSONB形式）
-- 構造: { "type": "RANGE"|"FIXED", "range": {...}, "fixed": "HH:MM", "label": "AM"|"PM"|"Custom" }
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS time_constraint JSONB DEFAULT NULL;

-- タスク種別（collection: 回収業務, special: 特殊案件）
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS task_type TEXT DEFAULT 'collection';

-- 車両固定制約（Hard Lock用、将来実装）
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS vehicle_lock TEXT DEFAULT NULL;

COMMENT ON COLUMN jobs.is_spot IS 'スポット案件フラグ（true: 臨時・不定期案件）';
COMMENT ON COLUMN jobs.time_constraint IS '時間制約情報 (RANGE: 範囲指定, FIXED: 時刻固定)';
COMMENT ON COLUMN jobs.task_type IS 'タスク種別 (collection: 回収業務, special: 特殊作業)';
COMMENT ON COLUMN jobs.vehicle_lock IS '車両固定制約 (指定車両以外への配置を禁止)';

-- ----------------------------------------
-- 2. 既存データの移行
-- ----------------------------------------

-- 既存の bucketType='spot' を is_spot=true に移行
UPDATE jobs 
SET is_spot = true 
WHERE bucket_type = 'spot';

-- ----------------------------------------
-- 3. インデックス作成（パフォーマンス最適化）
-- ----------------------------------------

CREATE INDEX IF NOT EXISTS idx_jobs_is_spot ON jobs(is_spot) 
WHERE is_spot = true;

CREATE INDEX IF NOT EXISTS idx_jobs_task_type ON jobs(task_type);

CREATE INDEX IF NOT EXISTS idx_jobs_time_constraint ON jobs 
USING GIN (time_constraint) 
WHERE time_constraint IS NOT NULL;

-- ----------------------------------------
-- 4. サンプルデータ（テスト用）
-- ----------------------------------------

-- 時間指定案件のサンプル（AM指定）
COMMENT ON COLUMN jobs.time_constraint IS 
'例: AM指定 -> {"type":"RANGE","range":{"start":"06:00","end":"12:00"},"label":"AM"}
例: PM指定 -> {"type":"RANGE","range":{"start":"12:00","end":"18:00"},"label":"PM"}
例: 時刻固定 -> {"type":"FIXED","fixed":"14:00"}';

-- ----------------------------------------
-- 完了
-- ----------------------------------------
