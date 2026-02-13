-- Migration: Add status column and clean up data
-- Timestamp: 20260211070500

-- 1. Add status column to jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS status TEXT DEFAULT '未配車';

-- 2. Add check constraint for status (optional, but good practice)
-- ALTER TABLE jobs ADD CONSTRAINT check_status CHECK (status IN ('未配車', '配車済み', '完了', 'キャンセル'));

-- 3. Clean up old data (Truncate)
TRUNCATE TABLE jobs;

-- 4. Seed new test data
INSERT INTO jobs (
  id, 
  job_title, 
  status, 
  bucket_type, 
  customer_name, 
  item_category, 
  start_time, 
  duration_minutes, 
  special_notes
) VALUES
('job_test_01', '定期回収A', '未配車', '定期', '富士ロジ長沼', '燃えるゴミ', NULL, 15, 'テストデータ1'),
('job_test_02', '定期回収B', '未配車', '定期', 'リバークレイン', '段ボール', NULL, 30, 'テストデータ2'),
('job_test_03', 'スポット回収C', '未配車', 'スポット', 'ESPOT(スポット)', '金属くず', '09:00', 45, '午前指定'),
('job_test_04', '定期回収D', '未配車', '定期', 'ユニマット', 'プラスチック', NULL, 15, 'テストデータ4'),
('job_test_05', '特別回収E', '未配車', '特殊', '特別工場A', '発泡スチロール', '13:00', 60, '要事前連絡');
