-- ==========================================
-- RePaper Route - Unified Database Schema
-- 統合スキーマファイル（全テーブル定義）
-- ==========================================
-- 
-- 【目次 - Table of Contents】
-- 1. profiles         - 認証・プロファイル管理（ユーザーマスタ）
-- 2. drivers          - ドライバー管理（運転手、車番、コース）
-- 3. jobs             - 業務・案件管理（回収時間、所要時間）
-- 4. splits           - 車両交代・中継管理（乗り換え、スライド）
-- 5. items            - 品目マスタ（回収品目）
-- 6. customers        - 顧客マスタ（取引先、回収先）
-- 7. customer_items   - 顧客-品目関連（回収品目設定）
-- 8. job_items        - 回収実績-品目関連（実際の回収記録）
-- 9. Indexes          - パフォーマンス最適化
-- 10. RLS Policies    - セキュリティ設定
-- 11. Initial Data    - サンプルデータ投入
-- 12. Views           - 集計ビュー
-- 
-- 【実行方法】
-- このファイル1つを Supabase SQL Editor で実行すれば全テーブルが作成されます
-- 
-- 【依存関係】
-- profiles → drivers → jobs → splits
--         → items → customers → customer_items → job_items
-- 
-- 【履歴】
-- 拡張履歴の詳細は SCHEMA_HISTORY.md を参照してください
-- 
-- ==========================================

-- ==========================================
-- 1. 認証・プロファイル管理 (profiles)
-- 現場用語: ユーザーマスタ、ログイン用データ
-- ==========================================
create table profiles (
  id text primary key, -- 'u1', 'u2' or UUID
  name text not null, -- ユーザー名
  role text not null, -- 'ADMIN' | 'DRIVER'
  vehicle_info text, -- ドライバーの場合、車両情報
  user_id text unique, -- 将来の認証システム用 (現時点は未使用)
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==========================================
-- 2. ドライバー管理 (drivers)
-- 現場用語: 運転手, 車番, コース, 色分け
-- ==========================================
create table drivers (
  id text primary key, -- 'd1', 'd2' or UUID
  driver_name text not null,
  vehicle_number text, -- '2025PK' etc
  route_name text, -- 'A', 'B' etc
  display_color text, -- Tailwind class string
  
  -- デフォルトの交代設定 (存在する場合)
  default_split_time text, -- '13:00'
  default_split_driver_name text,
  default_split_vehicle_number text,

  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==========================================
-- 3. 業務・案件管理 (jobs)
-- 現場用語: 案件名, 回収時間, 所要時間, バケツ(AM/PM/Free)
-- ==========================================
create table jobs (
  id text primary key, -- 'j1' or UUID
  job_title text not null,
  
  -- 担当ドライバー (NULLの場合は「未配車」= Pending)
  driver_id text references drivers(id),
  
  start_time text, -- '06:30' (HH:MM形式)
  duration_minutes integer not null default 15,
  
  bucket_type text, -- 'AM', 'PM', 'Free'
  
  -- 顧客・制約情報
  customer_id text, -- 'c1' etc
  required_vehicle text, -- 車両指定がある場合
  
  -- 以下、PendingJob由来の追加情報
  area text, -- '厚木', '横浜' etc
  note text, -- '要電話' etc

  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==========================================
-- 4. 車両交代・中継管理 (splits)
-- 現場用語: 乗り換え, スライド
-- ==========================================
create table splits (
  id text primary key, -- UUID recommended
  driver_id text not null references drivers(id) on delete cascade,
  
  split_time text not null, -- '13:00'
  replacement_driver_name text not null, -- 交代後のドライバー名
  replacement_vehicle_number text not null, -- 交代後の車番

  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==========================================
-- 5. 品目マスタ (items)
-- 現場用語: 品目、素材、回収品
-- ==========================================
create table items (
  id text primary key, -- 'item_1', 'item_2' or UUID
  item_name text not null, -- '燃えるゴミ', '段ボール', '発泡スチロール' etc
  unit text not null default 'kg', -- '袋', 'kg', '個' etc
  description text, -- 備考・説明
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==========================================
-- 6. 顧客マスタ (customers)
-- 現場用語: 取引先、回収先
-- ==========================================
create table customers (
  id text primary key, -- 'c1', 'c2' or UUID
  customer_name text not null,
  area text, -- '厚木', '横浜', '海老名' etc
  address text,
  phone text,
  default_duration_minutes integer not null default 30,
  
  -- 回収スケジュール設定
  schedule_type text, -- 'regular' (定期), 'irregular' (不定期), 'spot' (スポット)
  regular_schedule jsonb, -- { "monday": true, "tuesday": false, ...} または詳細設定
  
  -- 祝日対応
  holiday_handling text, -- 'skip' (回収なし), 'shift_next' (翌営業日), 'shift_prev' (前営業日)
  
  -- 特記事項
  note text, -- '駐車場狭い', '要電話' etc
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==========================================
-- 7. 顧客-品目 関連テーブル (customer_items)
-- 現場用語: 回収品目設定
-- ==========================================
create table customer_items (
  id text primary key, -- UUID recommended
  customer_id text not null references customers(id) on delete cascade,
  item_id text not null references items(id) on delete cascade,
  
  is_default boolean not null default true, -- デフォルトで回収対象か
  estimated_quantity decimal, -- 概算数量（任意）
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  unique(customer_id, item_id) -- 同一顧客-品目の重複を防ぐ
);

-- ==========================================
-- 8. 回収実績-品目 関連テーブル (job_items)
-- 現場用語: 実際に回収した品目記録
-- ==========================================
create table job_items (
  id text primary key, -- UUID recommended
  job_id text not null, -- jobs.id への参照（外部キー制約は routes テーブル移行後に追加）
  item_id text not null references items(id),
  
  estimated_weight decimal, -- 現場での概算重量
  actual_weight decimal, -- 帰社後の正味重量（割り振り後）
  note text, -- 特記事項
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==========================================
-- 9. インデックス（パフォーマンス最適化）
-- ==========================================
create index idx_customer_items_customer_id on customer_items(customer_id);
create index idx_customer_items_item_id on customer_items(item_id);
create index idx_job_items_job_id on job_items(job_id);
create index idx_job_items_item_id on job_items(item_id);
create index idx_customers_area on customers(area);

-- ==========================================
-- 10. 権限設定 (RLS)
-- ==========================================
alter table profiles enable row level security;
alter table drivers enable row level security;
alter table jobs enable row level security;
alter table splits enable row level security;
alter table items enable row level security;
alter table customers enable row level security;
alter table customer_items enable row level security;
alter table job_items enable row level security;

-- 全開放設定 (開発用・本番環境では適切なポリシーに変更)
create policy "Enable all access for all users" on profiles for all using (true) with check (true);
create policy "Enable all access for all users" on drivers for all using (true) with check (true);
create policy "Enable all access for all users" on jobs for all using (true) with check (true);
create policy "Enable all access for all users" on splits for all using (true) with check (true);
create policy "Enable all access for all users" on items for all using (true) with check (true);
create policy "Enable all access for all users" on customers for all using (true) with check (true);
create policy "Enable all access for all users" on customer_items for all using (true) with check (true);
create policy "Enable all access for all users" on job_items for all using (true) with check (true);

-- ==========================================
-- 11. 初期データ投入（サンプル）
-- ==========================================

-- Profiles (ユーザーマスタ)
insert into profiles (id, name, role, vehicle_info) values
('admin1', '管理者', 'ADMIN', null),
('driver1', 'ドライバーA', 'DRIVER', '2025PK'),
('driver2', 'ドライバーB', 'DRIVER', '2026TK');

-- Items (品目マスタ)
insert into items (id, item_name, unit, description) values
('item_burnable', '燃えるゴミ', 'kg', '一般廃棄物（可燃）'),
('item_cardboard', '段ボール', 'kg', '古紙・段ボール'),
('item_styrofoam', '発泡スチロール', 'kg', '発泡スチロール・緩衝材'),
('item_plastic', 'プラスチック', 'kg', '廃プラスチック'),
('item_metal', '金属くず', 'kg', '鉄くず・非鉄金属'),
('item_paper', '紙くず', 'kg', '古紙・雑がみ');

-- Customers (顧客マスタ)
insert into customers (id, customer_name, area, default_duration_minutes, schedule_type, holiday_handling) values
('c1', '富士ロジ長沼', '厚木', 45, 'regular', 'shift_next'),
('c2', 'ESPOT(スポット)', '伊勢原', 30, 'irregular', 'skip'),
('c3', 'リバークレイン', '横浜', 45, 'regular', 'shift_next'),
('c4', 'ユニマット', '厚木', 15, 'regular', 'skip'),
('c5', '特別工場A', '海老名', 60, 'spot', 'skip'),
('c99', '富士電線', '厚木', 30, 'regular', 'shift_next'),
('c98', '厚木事業所', '厚木', 60, 'regular', 'shift_next');

-- Customer Items (顧客-品目関連)
insert into customer_items (id, customer_id, item_id, is_default) values
('ci_c1_burnable', 'c1', 'item_burnable', true),
('ci_c1_cardboard', 'c1', 'item_cardboard', true),
('ci_c1_styrofoam', 'c1', 'item_styrofoam', true),
('ci_c2_plastic', 'c2', 'item_plastic', true),
('ci_c2_cardboard', 'c2', 'item_cardboard', true),
('ci_c3_metal', 'c3', 'item_metal', true),
('ci_c3_cardboard', 'c3', 'item_cardboard', true);

-- ==========================================
-- 12. マイグレーション完了確認用ビュー
-- ==========================================
create or replace view v_customer_items_summary as
select 
  c.id as customer_id,
  c.customer_name,
  c.area,
  count(ci.item_id) as item_count,
  string_agg(i.item_name, ', ' order by i.item_name) as items
from customers c
left join customer_items ci on c.id = ci.customer_id
left join items i on ci.item_id = i.id
where ci.is_default = true
group by c.id, c.customer_name, c.area;
