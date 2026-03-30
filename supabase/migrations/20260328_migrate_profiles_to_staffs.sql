-- Migration: profiles to staffs (SDR Transition)
-- Target Project: TBNY DXOS
-- Date: 2026-03-28

-- 1. Create staffs table if not exists (Duplicate protection)
create table if not exists staffs (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    role text default 'driver',
    allowed_apps jsonb default '["repaper-route"]',
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 2. Migrate existing profiles to staffs
-- We assume profiles.id matches auth.users.id
insert into staffs (id, name, role)
select id::uuid, name, role
from profiles
on conflict (id) do update 
set 
    name = excluded.name,
    role = excluded.role,
    updated_at = now();

-- 3. Update staff metadata for OS access
-- (Note: This is illustrative, actual metadata update happens via Auth API)
-- update auth.users set raw_user_metadata = raw_user_metadata || '{"allowed_apps": ["repaper-route"]}' where id in (select id from staffs);
