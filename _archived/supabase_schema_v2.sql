-- ==========================================
-- RePaper Route - Extended Schema v2.0
-- 要件定義書 ver 6.0 対応: 品目管理機能の追加
-- ==========================================

-- ==========================================
-- 1. 品目マスタ (items)
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
-- 2. 顧客マスタ (customers)
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
-- 3. 顧客-品目 関連テーブル (customer_items)
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
-- 4. 回収実績-品目 関連テーブル (job_items)
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
-- 5. 既存テーブル（参照用・変更なし）
-- ==========================================
-- drivers, jobs, splits テーブルは supabase_schema.sql で定義済み
-- このスキーマは既存テーブルに追加する形で適用

-- ==========================================
-- 6. インデックス（パフォーマンス最適化）
-- ==========================================
create index idx_customer_items_customer_id on customer_items(customer_id);
create index idx_customer_items_item_id on customer_items(item_id);
create index idx_job_items_job_id on job_items(job_id);
create index idx_job_items_item_id on job_items(item_id);
create index idx_customers_area on customers(area);

-- ==========================================
-- 7. 権限設定 (RLS)
-- ==========================================
alter table items enable row level security;
alter table customers enable row level security;
alter table customer_items enable row level security;
alter table job_items enable row level security;

-- 全開放設定 (開発用・本番環境では適切なポリシーに変更)
create policy "Enable all access for all users" on items for all using (true) with check (true);
create policy "Enable all access for all users" on customers for all using (true) with check (true);
create policy "Enable all access for all users" on customer_items for all using (true) with check (true);
create policy "Enable all access for all users" on job_items for all using (true) with check (true);

-- ==========================================
-- 8. 初期データ投入（サンプル）
-- ==========================================

-- 品目マスタのサンプルデータ
insert into items (id, item_name, unit, description) values
('item_burnable', '燃えるゴミ', 'kg', '一般廃棄物（可燃）'),
('item_cardboard', '段ボール', 'kg', '古紙・段ボール'),
('item_styrofoam', '発泡スチロール', 'kg', '発泡スチロール・緩衝材'),
('item_plastic', 'プラスチック', 'kg', '廃プラスチック'),
('item_metal', '金属くず', 'kg', '鉄くず・非鉄金属'),
('item_paper', '紙くず', 'kg', '古紙・雑がみ');

-- 顧客マスタのサンプルデータ（masters.js からの移行）
insert into customers (id, customer_name, area, default_duration_minutes, schedule_type, holiday_handling) values
('c1', '富士ロジ長沼', '厚木', 45, 'regular', 'shift_next'),
('c2', 'ESPOT(スポット)', '伊勢原', 30, 'irregular', 'skip'),
('c3', 'リバークレイン', '横浜', 45, 'regular', 'shift_next'),
('c4', 'ユニマット', '厚木', 15, 'regular', 'skip'),
('c5', '特別工場A', '海老名', 60, 'spot', 'skip'),
('c99', '富士電線', '厚木', 30, 'regular', 'shift_next'),
('c98', '厚木事業所', '厚木', 60, 'regular', 'shift_next');

-- 顧客-品目関連のサンプルデータ
-- 例: 富士ロジ長沼は 燃えるゴミ、段ボール、発泡スチロール を回収
insert into customer_items (id, customer_id, item_id, is_default) values
('ci_c1_burnable', 'c1', 'item_burnable', true),
('ci_c1_cardboard', 'c1', 'item_cardboard', true),
('ci_c1_styrofoam', 'c1', 'item_styrofoam', true),
-- ESPOTは プラスチック、段ボール
('ci_c2_plastic', 'c2', 'item_plastic', true),
('ci_c2_cardboard', 'c2', 'item_cardboard', true),
-- リバークレインは 金属くず、段ボール
('ci_c3_metal', 'c3', 'item_metal', true),
('ci_c3_cardboard', 'c3', 'item_cardboard', true);

-- ==========================================
-- 9. マイグレーション完了確認用ビュー
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
