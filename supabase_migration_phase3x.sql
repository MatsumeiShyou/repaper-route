-- ==========================================
-- Phase 3.X: Master Data Normalization
-- Created: 2026-02-06
-- Purpose: Migrate master data from code (MASTER_CONFIG.js) to DB
-- ==========================================

-- 1. Create 'vehicles' table
CREATE TABLE IF NOT EXISTS vehicles (
  id TEXT PRIMARY KEY, -- Maintaining 'v1', 'v_seino' etc. to minimize code changes
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- '2t', 'external', 'spare', 'rental'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Create 'customers' table
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY, -- Maintaining 'c1' etc.
  name TEXT NOT NULL,
  default_duration INTEGER DEFAULT 30,
  area TEXT,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Seed Data: Vehicles (from MASTER_CONFIG.js)
INSERT INTO vehicles (id, name, type) VALUES
  ('v1', '2025PK', '2t'),
  ('v2', '2267PK', '2t'),
  ('v3', '2618PK', '2t'),
  ('v4', '5122PK', '2t'),
  ('v5', '1111PK', '2t'),
  ('v_seino', '西濃運輸', 'external'),
  ('v_spare', '予備車', 'spare'),
  ('v_rental', 'レンタカー', 'rental')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  type = EXCLUDED.type;

-- 4. Seed Data: Customers (from MASTER_CONFIG.js)
INSERT INTO customers (id, name, default_duration, area) VALUES
  ('c1', '富士ロジ長沼', 45, '厚木'),
  ('c2', 'ESPOT(スポット)', 30, '伊勢原'),
  ('c3', 'リバークレイン', 45, '横浜'),
  ('c4', 'ユニマット', 15, '厚木'),
  ('c5', '特別工場A', 60, '海老名'),
  ('c99', '富士電線', 30, '厚木'),
  ('c98', '厚木事業所', 60, '厚木')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  default_duration = EXCLUDED.default_duration,
  area = EXCLUDED.area;

-- 5. Force refresh schema cache (optional but good practice)
NOTIFY pgrst, 'reload schema';
