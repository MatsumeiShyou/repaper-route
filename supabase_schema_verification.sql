-- ==========================================
-- Supabase スキーマ検証クエリ集
-- Phase 2.5 完了確認用（実構造反映版）
-- ==========================================

-- 1. テーブル存在確認
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'drivers', 'jobs', 'splits', 'items', 'customers', 'customer_item_defaults', 'job_contents', 'routes')
ORDER BY table_name;

-- 期待される結果: 9行（customer_item_defaults, customers, drivers, items, job_contents, jobs, profiles, routes, splits）

-- ==========================================
-- 2. データ件数確認
-- ==========================================

-- プロファイル（3件）
SELECT COUNT(*) as profile_count FROM profiles;

-- 品目マスタ（6件）
SELECT COUNT(*) as item_count FROM items;

-- 顧客マスタ（7件）
SELECT COUNT(*) as customer_count FROM customers;

-- 顧客-品目関連（実際は2カラムのみ）
SELECT COUNT(*) as relation_count FROM customer_item_defaults;

-- ==========================================
-- 3. サンプルデータ詳細確認
-- ==========================================

-- プロファイル一覧
SELECT id, name, role, vehicle_info 
FROM profiles 
ORDER BY role, name;

-- 品目一覧
SELECT id, name, unit 
FROM items 
ORDER BY name;

-- 顧客一覧（重要項目のみ）
SELECT 
  id, 
  name, 
  area, 
  default_duration, 
  address,
  lat,
  lng
FROM customers 
ORDER BY name;

-- 顧客-品目マッピング（シンプル版: customer_id, item_id のみ）
SELECT 
  c.name as customer_name,
  i.name as item_name
FROM customer_item_defaults ci
JOIN customers c ON ci.customer_id = c.id
JOIN items i ON ci.item_id = i.id
ORDER BY c.name, i.name;

-- ==========================================
-- 4. routes テーブル確認（Phase 2.5追加）
-- ==========================================

-- routesテーブルの存在確認
SELECT COUNT(*) as routes_count FROM routes;

-- routesテーブルの構造確認
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'routes' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 期待されるカラム: date, jobs, drivers, splits, pending, created_at, updated_at

-- ==========================================
-- 5. インデックス確認
-- ==========================================

SELECT 
  indexname, 
  tablename, 
  indexdef 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('customer_item_defaults', 'job_contents', 'customers', 'routes')
ORDER BY tablename, indexname;

-- 期待されるインデックス:
-- - idx_customer_item_defaults_customer_id
-- - idx_customer_item_defaults_item_id
-- - idx_job_contents_job_id
-- - idx_job_contents_item_id
-- - idx_customers_area
-- - idx_routes_date

-- ==========================================
-- 6. RLSポリシー確認
-- ==========================================

SELECT 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'drivers', 'jobs', 'splits', 'items', 'customers', 'customer_item_defaults', 'job_contents', 'routes')
ORDER BY tablename;

-- 期待される結果: 各テーブルに "Enable all access for all users" ポリシー

-- ==========================================
-- 7. 外部キー制約確認
-- ==========================================

SELECT
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('customer_item_defaults', 'job_contents')
ORDER BY tc.table_name;

-- 注意: supabase_schema_actual.sql では外部キー制約を明示的に設定していません
-- 将来のPhaseで追加予定

-- ==========================================
-- 8. UNIQUE制約確認
-- ==========================================

SELECT 
  tc.table_name, 
  kcu.column_name 
FROM information_schema.table_constraints tc 
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'UNIQUE' 
  AND tc.table_name = 'customer_item_defaults'
ORDER BY kcu.ordinal_position;

-- 期待される結果: (customer_id, item_id) のPRIMARY KEY制約（UNIQUE含む）

-- ==========================================
-- 9. 既存テーブルへの影響確認
-- ==========================================

-- 既存テーブル（profiles, drivers, jobs, splits）が無傷か確認
SELECT COUNT(*) FROM profiles;
SELECT COUNT(*) FROM drivers;
SELECT COUNT(*) FROM jobs;
SELECT COUNT(*) FROM splits;

-- これらのカウントが変化していないことを確認
