-- ==========================================
-- Supabase スキーマ検証クエリ集
-- Phase 1.5 完了確認用
-- ==========================================

-- 1. テーブル存在確認
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'drivers', 'jobs', 'splits', 'items', 'customers', 'customer_items', 'job_items')
ORDER BY table_name;

-- 期待される結果: 8行（customer_items, customers, drivers, items, job_items, jobs, profiles, splits）

-- ==========================================
-- 2. データ件数確認
-- ==========================================

-- プロファイル（3件）
SELECT COUNT(*) as profile_count FROM profiles;

-- 品目マスタ（6件）
SELECT COUNT(*) as item_count FROM items;

-- 顧客マスタ（7件）
SELECT COUNT(*) as customer_count FROM customers;

-- 顧客-品目関連（7件）
SELECT COUNT(*) as relation_count FROM customer_items;

-- ==========================================
-- 3. サンプルデータ詳細確認
-- ==========================================

-- プロファイル一覧
SELECT id, name, role, vehicle_info 
FROM profiles 
ORDER BY role, name;

-- 品目一覧
SELECT id, item_name, unit, description 
FROM items 
ORDER BY item_name;

-- 顧客一覧（重要項目のみ）
SELECT 
  id, 
  customer_name, 
  area, 
  default_duration_minutes, 
  schedule_type, 
  holiday_handling 
FROM customers 
ORDER BY customer_name;

-- 顧客-品目マッピング
SELECT 
  c.customer_name,
  i.item_name,
  ci.is_default,
  ci.estimated_quantity
FROM customer_items ci
JOIN customers c ON ci.customer_id = c.id
JOIN items i ON ci.item_id = i.id
ORDER BY c.customer_name, i.item_name;

-- ==========================================
-- 4. ビュー動作確認
-- ==========================================

-- 顧客ごとの品目サマリー
SELECT * FROM v_customer_items_summary ORDER BY customer_name;

-- 期待される結果:
-- customer_name | area | item_count | items
-- 富士ロジ長沼  | 厚木 | 3          | 燃えるゴミ, 段ボール, 発泡スチロール
-- ESPOT         | 伊勢原| 2         | プラスチック, 段ボール
-- リバークレイン | 横浜 | 2          | 金属くず, 段ボール

-- ==========================================
-- 5. インデックス確認
-- ==========================================

SELECT 
  indexname, 
  tablename, 
  indexdef 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('customer_items', 'job_items', 'customers')
ORDER BY tablename, indexname;

-- 期待されるインデックス:
-- - idx_customer_items_customer_id
-- - idx_customer_items_item_id
-- - idx_job_items_job_id
-- - idx_job_items_item_id
-- - idx_customers_area

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
  AND tablename IN ('profiles', 'drivers', 'jobs', 'splits', 'items', 'customers', 'customer_items', 'job_items')
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
  AND tc.table_name IN ('customer_items', 'job_items')
ORDER BY tc.table_name;

-- 期待される制約:
-- customer_items.customer_id -> customers.id
-- customer_items.item_id -> items.id
-- job_items.item_id -> items.id

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
  AND tc.table_name = 'customer_items'
ORDER BY kcu.ordinal_position;

-- 期待される結果: (customer_id, item_id) のUNIQUE制約

-- ==========================================
-- 9. 既存テーブルへの影響確認
-- ==========================================

-- 既存テーブル（profiles, drivers, jobs, splits）が無傷か確認
SELECT COUNT(*) FROM profiles;
SELECT COUNT(*) FROM drivers;
SELECT COUNT(*) FROM jobs;
SELECT COUNT(*) FROM splits;

-- これらのカウントが変化していないことを確認
