-- Drop table to fix wrong FK reference
drop table if exists public.customer_item_defaults;

-- Recreate table with correct reference to master_collection_points
create table public.customer_item_defaults (
  customer_id text not null,
  item_id uuid not null,
  created_at timestamp with time zone not null default now(),
  constraint customer_item_defaults_pkey primary key (customer_id, item_id),
  constraint customer_item_defaults_customer_id_fkey foreign key (customer_id) references master_collection_points (location_id) on delete cascade,
  constraint customer_item_defaults_item_id_fkey foreign key (item_id) references master_items (id) on delete cascade
);

-- Enable RLS
alter table public.customer_item_defaults enable row level security;

-- Recreate policies
create policy "Enable read access for all users" on public.customer_item_defaults for select using (true);
create policy "Enable insert for authenticated users only" on public.customer_item_defaults for insert with check (auth.role() = 'authenticated');
create policy "Enable update for authenticated users only" on public.customer_item_defaults for update using (auth.role() = 'authenticated');
create policy "Enable delete for authenticated users only" on public.customer_item_defaults for delete using (auth.role() = 'authenticated');
