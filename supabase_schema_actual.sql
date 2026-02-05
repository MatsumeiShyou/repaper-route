-- ==========================================
-- RePaper Route - Actual Database Schema
-- 実際のSupabase構造を反映した統合スキーマ
-- ==========================================
-- 
-- 【このファイルの成り立ち】
-- Phase 0   : drivers, jobs, splits（基盤構築）
-- Phase 1   : items, customers, customer_item_defaults, job_contents（品目・顧客管理拡張）
-- Phase 1.5 : profiles（認証追加）
-- Phase 2.5 : routes（配車計画保存用）← 新規追加
-- 
-- 【目次 - Quick Reference】
-- [1] profiles               - 認証・ユーザーマスタ
-- [2] drivers                - ドライバー管理
-- [3] jobs                   - 業務・回収実績管理（20カラム版）
-- [4] splits                 - 車両交代管理
-- [5] items                  - 品目マスタ
-- [6] customers              - 顧客マスタ（地図機能含む）
-- [7] customer_item_defaults - 顧客-品目関連（シンプル版）
-- [8] job_contents           - 回収実績-品目記録
-- [9] routes                 - 配車計画保存（日付ごとのスナップショット）
-- 
-- ==========================================

-- ==========================================
-- [1] Authentication - profiles
-- Phase 1.5: 認証・ユーザーマスタ
-- ==========================================
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  vehicle_info TEXT,
  user_id TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==========================================
-- [2] Core - drivers
-- Phase 0: ドライバー管理（運転手、車番、コース）
-- ==========================================
CREATE TABLE IF NOT EXISTS drivers (
  id TEXT PRIMARY KEY,
  driver_name TEXT NOT NULL,
  vehicle_number TEXT,
  route_name TEXT,
  display_color TEXT,
  default_split_time TEXT,
  default_split_driver_name TEXT,
  default_split_vehicle_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==========================================
-- [3] Core - jobs (Extended 20-column version)
-- Phase 0 + Extensions: 業務・回収実績管理
-- ==========================================
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  job_title TEXT,
  driver_id TEXT,
  start_time TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 15,
  bucket_type TEXT,
  customer_id TEXT,
  required_vehicle TEXT,
  area TEXT,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  
  -- 追加カラム（実績記録用）
  driver_name TEXT,
  vehicle_name TEXT,
  customer_name TEXT,
  item_category TEXT,
  weight_kg NUMERIC,
  special_notes TEXT,
  is_synced_to_sheet BOOLEAN,
  work_type TEXT,
  task_details JSONB
);

-- ==========================================
-- [4] Core - splits
-- Phase 0: 車両交代・中継管理
-- ==========================================
CREATE TABLE IF NOT EXISTS splits (
  id TEXT PRIMARY KEY,
  driver_id TEXT NOT NULL,
  split_time TEXT NOT NULL,
  replacement_driver_name TEXT NOT NULL,
  replacement_vehicle_number TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==========================================
-- [5] Master - items
-- Phase 1: 品目マスタ（回収品目）
-- ==========================================
CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'kg',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==========================================
-- [6] Master - customers
-- Phase 1: 顧客マスタ（地図機能含む）
-- ==========================================
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  area TEXT,
  default_duration INTEGER NOT NULL DEFAULT 30,
  address TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==========================================
-- [7] Relations - customer_item_defaults
-- Phase 1: 顧客-品目関連（シンプル版）
-- ==========================================
CREATE TABLE IF NOT EXISTS customer_item_defaults (
  customer_id TEXT NOT NULL,
  item_id UUID NOT NULL,
  PRIMARY KEY (customer_id, item_id)
);

-- ==========================================
-- [8] Relations - job_contents
-- Phase 1: 回収実績-品目記録
-- ==========================================
CREATE TABLE IF NOT EXISTS job_contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id TEXT NOT NULL,
  item_id UUID NOT NULL,
  expected_weight_kg INTEGER,
  actual_weight_kg INTEGER,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==========================================
-- [9] Application State - routes
-- Phase 2.5: 配車計画保存（日付ごとのスナップショット）
-- ==========================================
CREATE TABLE IF NOT EXISTS routes (
  date TEXT PRIMARY KEY,
  jobs JSONB,
  drivers JSONB,
  splits JSONB,
  pending JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==========================================
-- Indexes
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_customer_item_defaults_customer_id ON customer_item_defaults(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_item_defaults_item_id ON customer_item_defaults(item_id);
CREATE INDEX IF NOT EXISTS idx_job_contents_job_id ON job_contents(job_id);
CREATE INDEX IF NOT EXISTS idx_job_contents_item_id ON job_contents(item_id);
CREATE INDEX IF NOT EXISTS idx_customers_area ON customers(area);
CREATE INDEX IF NOT EXISTS idx_routes_date ON routes(date);

-- ==========================================
-- RLS Policies
-- ==========================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_item_defaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;

-- 全開放設定 (開発用)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Enable all access for all users') THEN
    CREATE POLICY "Enable all access for all users" ON profiles FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'drivers' AND policyname = 'Enable all access for all users') THEN
    CREATE POLICY "Enable all access for all users" ON drivers FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'jobs' AND policyname = 'Enable all access for all users') THEN
    CREATE POLICY "Enable all access for all users" ON jobs FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'splits' AND policyname = 'Enable all access for all users') THEN
    CREATE POLICY "Enable all access for all users" ON splits FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'items' AND policyname = 'Enable all access for all users') THEN
    CREATE POLICY "Enable all access for all users" ON items FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customers' AND policyname = 'Enable all access for all users') THEN
    CREATE POLICY "Enable all access for all users" ON customers FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customer_item_defaults' AND policyname = 'Enable all access for all users') THEN
    CREATE POLICY "Enable all access for all users" ON customer_item_defaults FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'job_contents' AND policyname = 'Enable all access for all users') THEN
    CREATE POLICY "Enable all access for all users" ON job_contents FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'routes' AND policyname = 'Enable all access for all users') THEN
    CREATE POLICY "Enable all access for all users" ON routes FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ==========================================
-- Initial Data (Idempotent)
-- ==========================================

-- Profiles
INSERT INTO profiles (id, name, role, vehicle_info) VALUES
('admin1', '管理者', 'ADMIN', NULL),
('driver1', 'ドライバーA', 'DRIVER', '2025PK'),
('driver2', 'ドライバーB', 'DRIVER', '2026TK')
ON CONFLICT (id) DO NOTHING;

-- Items
INSERT INTO items (id, name, unit) VALUES
('11111111-1111-1111-1111-111111111111'::UUID, '燃えるゴミ', 'kg'),
('22222222-2222-2222-2222-222222222222'::UUID, '段ボール', 'kg'),
('33333333-3333-3333-3333-333333333333'::UUID, '発泡スチロール', 'kg'),
('44444444-4444-4444-4444-444444444444'::UUID, 'プラスチック', 'kg'),
('55555555-5555-5555-5555-555555555555'::UUID, '金属くず', 'kg'),
('66666666-6666-6666-6666-666666666666'::UUID, '紙くず', 'kg')
ON CONFLICT (id) DO NOTHING;

-- Customers
INSERT INTO customers (id, name, area, default_duration) VALUES
('c1', '富士ロジ長沼', '厚木', 45),
('c2', 'ESPOT(スポット)', '伊勢原', 30),
('c3', 'リバークレイン', '横浜', 45),
('c4', 'ユニマット', '厚木', 15),
('c5', '特別工場A', '海老名', 60),
('c99', '富士電線', '厚木', 30),
('c98', '厚木事業所', '厚木', 60)
ON CONFLICT (id) DO NOTHING;
