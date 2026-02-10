-- Create vehicles table if not exists
create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.vehicles enable row level security;

-- Policy
create policy "Enable read access for all users" on public.vehicles for select using (true);

-- Insert data
insert into public.vehicles (number) values
('2267PK'),
('2025PK'),
('5122PK'),
('2618PK'),
('1㌧6902')
on conflict (number) do nothing;
