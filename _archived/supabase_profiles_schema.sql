-- ==========================================
-- 認証・プロファイル管理 (profiles)
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

-- RLS有効化
alter table profiles enable row level security;

-- 全開放設定 (開発用)
create policy "Enable all access for all users" on profiles for all using (true) with check (true);

-- 初期データ投入 (サンプル)
insert into profiles (id, name, role, vehicle_info) values
('admin1', '管理者', 'ADMIN', null),
('driver1', 'ドライバーA', 'DRIVER', '2025PK'),
('driver2', 'ドライバーB', 'DRIVER', '2026TK');
