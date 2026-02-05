-- ==========================================
-- 1. ドライバー管理 (drivers)
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
-- 2. 業務・案件管理 (jobs)
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
-- 3. 車両交代・中継管理 (splits)
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
-- 4. 権限設定 (RLS) - 必要に応じて有効化
-- ==========================================
alter table drivers enable row level security;
alter table jobs enable row level security;
alter table splits enable row level security;

-- 全開放設定 (開発用)
create policy "Enable all access for all users" on drivers for all using (true) with check (true);
create policy "Enable all access for all users" on jobs for all using (true) with check (true);
create policy "Enable all access for all users" on splits for all using (true) with check (true);
