-- Protocol: SDR (State / Decision / Reason) Initial Schema
-- Author: Antigravity Agent
-- Date: 2026-02-10

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Core SDR Log Table (Immutable)
create table event_logs (
    id uuid default gen_random_uuid() primary key,
    actor_id uuid not null, -- references staffs(id) (to be added after staffs table creation)
    decision_code text not null,
    reason_code text not null,
    reason_note text,
    is_admin_forced boolean default false,
    target_table text not null, -- e.g., 'locations', 'payers'
    target_id uuid not null,
    payload jsonb not null, -- The core decision content
    snapshot_before jsonb,
    snapshot_after jsonb,
    created_at timestamptz default now() not null
);

-- 2. Staffs Table (Users)
create table staffs (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    role text default 'staff', -- 'admin', 'staff', etc.
    allowed_apps jsonb default '[]', -- e.g. ["app_logistics", "app_weighing"]
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    last_event_id uuid references event_logs(id)
);

-- 3. Master Data Triad: Payers (Billing)
create table payers (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    code text unique not null,
    closing_date integer, -- e.g. 20, 31(end of month)
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    last_event_id uuid references event_logs(id)
);

-- 4. Master Data Triad: Suppliers (Contracts)
create table suppliers (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    code text unique not null,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    last_event_id uuid references event_logs(id)
);

-- 5. Master Data Triad: Locations (Physical Sites)
create table locations (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    address text,
    weighing_allowed boolean default false,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    last_event_id uuid references event_logs(id)
);

-- 6. Vehicles (Resources)
create table vehicles (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    number_plate text not null,
    max_loading_capacity integer not null, -- kg
    is_active boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    last_event_id uuid references event_logs(id)
);

-- 7. Routes (Repaper Route Module)
create table routes (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    driver_id uuid references staffs(id),
    vehicle_id uuid references vehicles(id),
    departure_time time,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    last_event_id uuid references event_logs(id)
);

-- Add Foreign Key Constraint for actor_id in event_logs (Circular dependency resolution)
alter table event_logs add constraint fk_event_actor foreign key (actor_id) references staffs(id);

-- RLS (Row Level Security) - Explicitly enabled
alter table event_logs enable row level security;
alter table staffs enable row level security;
alter table payers enable row level security;
alter table suppliers enable row level security;
alter table locations enable row level security;
alter table vehicles enable row level security;
alter table routes enable row level security;

-- Basic Policies (To be refined in later phases, currently open for authenticated users for development)
create policy "Enable read access for all users" on event_logs for select using (true);
create policy "Enable insert for authenticated users only" on event_logs for insert with check (auth.role() = 'authenticated');
