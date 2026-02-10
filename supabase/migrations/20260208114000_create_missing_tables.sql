-- Create master_payees table
create table if not exists public.master_payees (
  payee_id text not null,
  name text not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint master_payees_pkey primary key (payee_id)
);

-- Create master_contractors table
create table if not exists public.master_contractors (
  contractor_id text not null,
  name text not null,
  payee_id text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint master_contractors_pkey primary key (contractor_id),
  constraint master_contractors_payee_id_fkey foreign key (payee_id) references master_payees (payee_id) on delete set null
);

-- Create master_collection_points table
create table if not exists public.master_collection_points (
  location_id text not null,
  name text not null,
  address text,
  contractor_id text,
  note text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint master_collection_points_pkey primary key (location_id),
  constraint master_collection_points_contractor_id_fkey foreign key (contractor_id) references master_contractors (contractor_id) on delete set null
);

-- Ensure customer_item_defaults exists (in case phase6 failed)
create table if not exists public.customer_item_defaults (
  customer_id text not null,
  item_id uuid not null,
  created_at timestamp with time zone not null default now(),
  constraint customer_item_defaults_pkey primary key (customer_id, item_id),
  constraint customer_item_defaults_customer_id_fkey foreign key (customer_id) references master_collection_points (location_id) on delete cascade,
  constraint customer_item_defaults_item_id_fkey foreign key (item_id) references master_items (id) on delete cascade
);

-- Enable RLS
alter table public.master_payees enable row level security;
alter table public.master_contractors enable row level security;
alter table public.master_collection_points enable row level security;

-- Basic Policies (Adjust as needed, similar to master_items)
create policy "Enable read access for all users" on public.master_payees for select using (true);
create policy "Enable insert for authenticated users only" on public.master_payees for insert with check (auth.role() = 'authenticated');
create policy "Enable update for authenticated users only" on public.master_payees for update using (auth.role() = 'authenticated');

create policy "Enable read access for all users" on public.master_contractors for select using (true);
create policy "Enable insert for authenticated users only" on public.master_contractors for insert with check (auth.role() = 'authenticated');
create policy "Enable update for authenticated users only" on public.master_contractors for update using (auth.role() = 'authenticated');

create policy "Enable read access for all users" on public.master_collection_points for select using (true);
create policy "Enable insert for authenticated users only" on public.master_collection_points for insert with check (auth.role() = 'authenticated');
create policy "Enable update for authenticated users only" on public.master_collection_points for update using (auth.role() = 'authenticated');
