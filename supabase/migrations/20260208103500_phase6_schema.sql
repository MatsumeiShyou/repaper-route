-- Phase 6: Multi-Item Management
-- 1. Create master_items table
create table if not exists public.master_items (
  id uuid not null default gen_random_uuid (),
  name text not null,
  unit text not null default '個',
  display_order integer not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint master_items_pkey primary key (id)
);

-- 2. Create customer_item_defaults table
create table if not exists public.customer_item_defaults (
  customer_id text not null, -- Corrected to TEXT (to match master_collection_points.location_id)
  item_id uuid not null,
  created_at timestamp with time zone not null default now(),
  constraint customer_item_defaults_pkey primary key (customer_id, item_id),
  constraint customer_item_defaults_customer_id_fkey foreign key (customer_id) references master_collection_points (location_id) on delete cascade,
  constraint customer_item_defaults_item_id_fkey foreign key (item_id) references master_items (id) on delete cascade
);

-- 3. RLS Policies
alter table public.master_items enable row level security;
alter table public.customer_item_defaults enable row level security;

-- Drop existing policies if they exist (for idempotency)
drop policy if exists "Enable read access for all users" on public.master_items;
drop policy if exists "Enable insert for authenticated users only" on public.master_items;
drop policy if exists "Enable update for authenticated users only" on public.master_items;
drop policy if exists "Enable delete for authenticated users only" on public.master_items;

drop policy if exists "Enable read access for all users" on public.customer_item_defaults;
drop policy if exists "Enable insert for authenticated users only" on public.customer_item_defaults;
drop policy if exists "Enable update for authenticated users only" on public.customer_item_defaults;
drop policy if exists "Enable delete for authenticated users only" on public.customer_item_defaults;

-- Create Policies
create policy "Enable read access for all users" on public.master_items for select using (true);
create policy "Enable insert for authenticated users only" on public.master_items for insert with check (auth.role() = 'authenticated');
create policy "Enable update for authenticated users only" on public.master_items for update using (auth.role() = 'authenticated');
create policy "Enable delete for authenticated users only" on public.master_items for delete using (auth.role() = 'authenticated');

create policy "Enable read access for all users" on public.customer_item_defaults for select using (true);
create policy "Enable insert for authenticated users only" on public.customer_item_defaults for insert with check (auth.role() = 'authenticated');
create policy "Enable update for authenticated users only" on public.customer_item_defaults for update using (auth.role() = 'authenticated');
create policy "Enable delete for authenticated users only" on public.customer_item_defaults for delete using (auth.role() = 'authenticated');

-- 4. Initial Data (Upsert to avoid duplicates)
insert into public.master_items (name, unit, display_order) values
('古紙', 'kg', 10),
('段ボール', 'kg', 20),
('雑誌', 'kg', 30),
('新聞', 'kg', 40),
('アルミ缶', '袋', 50),
('スチール缶', '袋', 60),
('ペットボトル', '袋', 70)
on conflict do nothing;
