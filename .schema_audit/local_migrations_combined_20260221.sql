-- Drop existing tables to force schema refresh
DROP TABLE IF EXISTS public.reasons;
DROP TABLE IF EXISTS public.decisions;
DROP TABLE IF EXISTS public.decision_proposals;

-- Recreate decision_proposals
CREATE TABLE public.decision_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    proposal_type TEXT NOT NULL,
    target_id TEXT,
    current_value JSONB,
    proposed_value JSONB,
    status TEXT DEFAULT 'PENDING',
    proposer_id TEXT,
    reason TEXT
);

-- Recreate decisions
CREATE TABLE public.decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    proposal_id UUID REFERENCES public.decision_proposals(id),
    decider_id TEXT,
    decision TEXT,
    comment TEXT
);

-- Test Data
INSERT INTO public.decision_proposals (proposal_type, status, reason)
VALUES ('TEST_PROPOSAL', 'PENDING', 'Created by System Verification');

-- RLS (Permissive for Dev)
ALTER TABLE public.decision_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for all users" ON public.decision_proposals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for all users" ON public.decisions FOR ALL USING (true) WITH CHECK (true);

-- Grants
GRANT ALL ON TABLE public.decision_proposals TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.decisions TO anon, authenticated, service_role;

-- Force Schema Reload
NOTIFY pgrst, 'reload schema';
-- Add decided_at column to decisions table
ALTER TABLE public.decisions ADD COLUMN IF NOT EXISTS decided_at TIMESTAMPTZ DEFAULT NOW();

-- Force Schema Reload
NOTIFY pgrst, 'reload schema';
-- Phase 6: Multi-Item Management
-- 1. Create master_items table
create table if not exists public.master_items (
  id uuid not null default gen_random_uuid (),
  name text not null,
  unit text not null default '蛟・,
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
('蜿､邏・, 'kg', 10),
('谿ｵ繝懊・繝ｫ', 'kg', 20),
('髮題ｪ・, 'kg', 30),
('譁ｰ閨・, 'kg', 40),
('繧｢繝ｫ繝溽ｼｶ', '陲・, 50),
('繧ｹ繝√・繝ｫ郛ｶ', '陲・, 60),
('繝壹ャ繝医・繝医Ν', '陲・, 70)
on conflict do nothing;
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
-- Auto-generated CSV Import Script
-- Generated at: 2026-02-08T02:12:33.837Z

-- 1. Master Items
DO $$
DECLARE
  new_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・) THEN
    INSERT INTO master_items (name, unit, display_order) VALUES ('谿ｵ・趣ｾ橸ｽｰ・・, 'kg', 1);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM master_items WHERE name = '閾ｭ莉俶ｮｵ') THEN
    INSERT INTO master_items (name, unit, display_order) VALUES ('閾ｭ莉俶ｮｵ', 'kg', 2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM master_items WHERE name = '髮代′縺ｿ') THEN
    INSERT INTO master_items (name, unit, display_order) VALUES ('髮代′縺ｿ', 'kg', 3);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM master_items WHERE name = '髮題ｪ・) THEN
    INSERT INTO master_items (name, unit, display_order) VALUES ('髮題ｪ・, 'kg', 4);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM master_items WHERE name = '髮第腐邏・) THEN
    INSERT INTO master_items (name, unit, display_order) VALUES ('髮第腐邏・, 'kg', 5);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM master_items WHERE name = '・搾ｾ滂ｽｯ・・) THEN
    INSERT INTO master_items (name, unit, display_order) VALUES ('・搾ｾ滂ｽｯ・・, 'kg', 6);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM master_items WHERE name = '蟒・ｾ鯉ｾ滂ｾ苓ｻ溯ｳｪ') THEN
    INSERT INTO master_items (name, unit, display_order) VALUES ('蟒・ｾ鯉ｾ滂ｾ苓ｻ溯ｳｪ', 'kg', 7);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM master_items WHERE name = '・ｽ・・ｾ夲ｽｯ・・) THEN
    INSERT INTO master_items (name, unit, display_order) VALUES ('・ｽ・・ｾ夲ｽｯ・・, 'kg', 8);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM master_items WHERE name = '・具ｾ橸ｾ・ｽｰ・呻ｾ奇ｾ橸ｾ・) THEN
    INSERT INTO master_items (name, unit, display_order) VALUES ('・具ｾ橸ｾ・ｽｰ・呻ｾ奇ｾ橸ｾ・, 'kg', 9);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM master_items WHERE name = '・撰ｽｯ・ｸ・ｽ邏・) THEN
    INSERT INTO master_items (name, unit, display_order) VALUES ('・撰ｽｯ・ｸ・ｽ邏・, 'kg', 10);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM master_items WHERE name = '邏咏ｮ｡') THEN
    INSERT INTO master_items (name, unit, display_order) VALUES ('邏咏ｮ｡', 'kg', 11);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM master_items WHERE name = '荳奇ｽｹ・晢ｾ・) THEN
    INSERT INTO master_items (name, unit, display_order) VALUES ('荳奇ｽｹ・晢ｾ・, 'kg', 12);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM master_items WHERE name = '・ｼ・ｭ・夲ｽｯ・・・) THEN
    INSERT INTO master_items (name, unit, display_order) VALUES ('・ｼ・ｭ・夲ｽｯ・・・, 'kg', 13);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM master_items WHERE name = '髮題｢・) THEN
    INSERT INTO master_items (name, unit, display_order) VALUES ('髮題｢・, 'kg', 14);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM master_items WHERE name = 'R蟾ｻ蜿・) THEN
    INSERT INTO master_items (name, unit, display_order) VALUES ('R蟾ｻ蜿・, 'kg', 15);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM master_items WHERE name = '讓｡騾・奇ｾ橸ｾ・) THEN
    INSERT INTO master_items (name, unit, display_order) VALUES ('讓｡騾・奇ｾ橸ｾ・, 'kg', 16);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM master_items WHERE name = '・擾ｾ呻ｾ・ｾ奇ｾ滂ｽｯ・ｸ・･・奇ｾ橸ｾ・) THEN
    INSERT INTO master_items (name, unit, display_order) VALUES ('・擾ｾ呻ｾ・ｾ奇ｾ滂ｽｯ・ｸ・･・奇ｾ橸ｾ・, 'kg', 17);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM master_items WHERE name = '・ｱ・呻ｾ千ｼｶ') THEN
    INSERT INTO master_items (name, unit, display_order) VALUES ('・ｱ・呻ｾ千ｼｶ', 'kg', 18);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM master_items WHERE name = '讖溷ｯ・嶌鬘・) THEN
    INSERT INTO master_items (name, unit, display_order) VALUES ('讖溷ｯ・嶌鬘・, 'kg', 19);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM master_items WHERE name = 'PP・奇ｾ橸ｾ晢ｾ・ｾ・) THEN
    INSERT INTO master_items (name, unit, display_order) VALUES ('PP・奇ｾ橸ｾ晢ｾ・ｾ・, 'kg', 20);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM master_items WHERE name = '譁ｰ閨・) THEN
    INSERT INTO master_items (name, unit, display_order) VALUES ('譁ｰ閨・, 'kg', 21);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM master_items WHERE name = '髮題ｪ・・ｼ・ｭ・夲ｽｯ・・・) THEN
    INSERT INTO master_items (name, unit, display_order) VALUES ('髮題ｪ・・ｼ・ｭ・夲ｽｯ・・・, 'kg', 22);
  END IF;
END $$;

-- 2. Master Payees
INSERT INTO master_payees (payee_id, name) VALUES ('1709000', '(蜷・繝昴ず繝・ぅ繝・) ON CONFLICT (payee_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO master_payees (payee_id, name) VALUES ('1075000', '繹ｲ繝繧､繧ｳ繝ｼ蝠・ｺ・) ON CONFLICT (payee_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO master_payees (payee_id, name) VALUES ('1161000', '繹ｱ逕ｰ荳ｸ') ON CONFLICT (payee_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO master_payees (payee_id, name) VALUES ('2000', '繹ｱ繧｢繝ｼ繧ｯ繝ｫ豬ｷ閠∝錐蝟ｶ讌ｭ謇') ON CONFLICT (payee_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO master_payees (payee_id, name) VALUES ('455000', '繧ｫ繝翫く繝ｳ繹ｱ') ON CONFLICT (payee_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO master_payees (payee_id, name) VALUES ('384000', '螟ｧ譛ｬ邏呎侭繹ｱ') ON CONFLICT (payee_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO master_payees (payee_id, name) VALUES ('621000', '繹ｱ繧ｯ繝ｪ繝ｼ繝ｳ繧ｵ繝ｼ繝薙せ') ON CONFLICT (payee_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO master_payees (payee_id, name) VALUES ('1203000', '繝・ぅ繝ｼ繧ｨ繧ｹ繧ｨ繝ｳ繝舌う繝ｭ繹ｱ') ON CONFLICT (payee_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO master_payees (payee_id, name) VALUES ('437000', '繹ｱ繧ｫ繧ｹ繧ｿ繝髮ｻ蟄・) ON CONFLICT (payee_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO master_payees (payee_id, name) VALUES ('1205000', '繹ｱ・､・ｳ・ｰ') ON CONFLICT (payee_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO master_payees (payee_id, name) VALUES ('2042000', '繹ｱ繝ｭ繧ｸ繧ｹ繝・ぅ繧ｯ繧ｹ繝ｻ繝阪ャ繝医Ρ繝ｼ繧ｯ') ON CONFLICT (payee_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO master_payees (payee_id, name) VALUES ('1968000', '・包ｽｱ・ｻ・鯉ｾ・ｽｼ・ｮ・ｸ繹ｱ蜴壽惠迚ｩ豬・ｽｾ・晢ｾ・ｰ') ON CONFLICT (payee_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO master_payees (payee_id, name) VALUES ('346000', '繹ｱ螟ｧ荵・ｿ・) ON CONFLICT (payee_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO master_payees (payee_id, name) VALUES ('1036000', '繹ｱ繧ｻ繝輔ユ繧｣') ON CONFLICT (payee_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO master_payees (payee_id, name) VALUES ('1130000', '繧ｿ繧ｭ繧ｲ繝ｳ陬ｽ騾繹ｱ蜴壽惠謾ｯ蠎・) ON CONFLICT (payee_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO master_payees (payee_id, name) VALUES ('1038000', '・ｪ・ｳ・ｲ・搾ｼｮ・･・ｴ') ON CONFLICT (payee_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO master_payees (payee_id, name) VALUES ('863000', '謨ｷ蟲ｶ陬ｽ繝代Φ繹ｱ') ON CONFLICT (payee_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO master_payees (payee_id, name) VALUES ('1535000', '繹ｱ繝代Ν繧ｷ繧ｹ繝・Β髮ｻ蜉・) ON CONFLICT (payee_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO master_payees (payee_id, name) VALUES ('1551000', '繹ｱ繝薙・繝医Ξ繝ｼ繝・ぅ繝ｳ繧ｰ') ON CONFLICT (payee_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO master_payees (payee_id, name) VALUES ('50000', '繹ｱ譌ｭ驕矩・) ON CONFLICT (payee_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO master_payees (payee_id, name) VALUES ('523000', '髢｢蛹・せ繝√・繝ｫ繹ｱ') ON CONFLICT (payee_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO master_payees (payee_id, name) VALUES ('1784000', '荳ｸ鬧帝°霈ｸ繹ｱ') ON CONFLICT (payee_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO master_payees (payee_id, name) VALUES ('1946000', '繹ｱ螻ｱ蟠取ｭｯ霆願｣ｽ菴懈園') ON CONFLICT (payee_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO master_payees (payee_id, name) VALUES ('1533000', '繹ｱ譏･縺・ｉ繧峨°縺ｪ譖ｸ謌ｿ') ON CONFLICT (payee_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO master_payees (payee_id, name) VALUES ('774000', '繹ｱ繧ｵ繝・ぅ繧ｹ繝輔ぃ繧ｯ繝医Μ繝ｼ') ON CONFLICT (payee_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO master_payees (payee_id, name) VALUES ('530000', '繹ｲ骰帑ｻ｣蝠・ｺ・) ON CONFLICT (payee_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO master_payees (payee_id, name) VALUES ('1556000', '譚ｱ譌･譛ｬ蜊泌酔繝代Ξ繝・ヨ繹ｱ') ON CONFLICT (payee_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO master_payees (payee_id, name) VALUES ('1352000', '繹ｱ繝翫き繝繧､') ON CONFLICT (payee_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO master_payees (payee_id, name) VALUES ('903000', '・ｼ・橸ｽｬ・ｸ・ｿ・晢ｽ･・暦ｾ趣ｾ橸ｾ暦ｾ・ｾ假ｽｰ・･・ｼ・橸ｽｬ・奇ｾ滂ｾ昴鯵') ON CONFLICT (payee_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO master_payees (payee_id, name) VALUES ('1420000', '繝九ャ繝昴Φ繝ｭ繧ｸ繹ｱ') ON CONFLICT (payee_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO master_payees (payee_id, name) VALUES ('33000', '繹ｱ繧｢繧ｪ繧､') ON CONFLICT (payee_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO master_payees (payee_id, name) VALUES ('1975000', '繹ｱ陬墓ｺ・) ON CONFLICT (payee_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO master_payees (payee_id, name) VALUES ('1253000', '譚ｱ莠ｬ繝ｭ繧ｸ繝輔ぃ繧ｯ繝医Μ繝ｼ繹ｱ') ON CONFLICT (payee_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO master_payees (payee_id, name) VALUES ('794000', '繧ｵ繝ｳ繧､繝ｳ繝・Ν繝阪ャ繝亥字譛ｨ隨ｬ荳会ｽｾ・晢ｾ・ｰ') ON CONFLICT (payee_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO master_payees (payee_id, name) VALUES ('382000', '繹ｱ螟ｧ譛ｬ邨・) ON CONFLICT (payee_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO master_payees (payee_id, name) VALUES ('753000', '繹ｲ蝮ら伐莠ｮ菴懷膚蠎・) ON CONFLICT (payee_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO master_payees (payee_id, name) VALUES ('2095000', '繹ｱ荳顔･櫁ｰｷ驕矩∝字譛ｨ') ON CONFLICT (payee_id) DO UPDATE SET name = EXCLUDED.name;

-- 3. Master Contractors
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1709032', '・・ｽｸ・鯉ｾ霸荳頑ｺ昜ｺ区･ｭ謇(・趣ｾ滂ｽｼ・橸ｾ・ｽｨ・鯉ｾ・', '1709000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1709031', '・・ｽｸ・鯉ｾ霸荳贋ｾ晉衍莠区･ｭ謇(・趣ｾ滂ｽｼ・橸ｾ・ｽｨ・鯉ｾ・', '1709000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1075001', '繹ｱ荳蜈ｨ(繝繧､繧ｳ繝ｼ蝠・ｺ・', '1075000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1161004', '・･・ｳ・ｰ・ｯ・ｴ・茨ｾ奇ｾ橸ｽｯ・ｸ・費ｽｰ・・ｾ橸ｼ・逕ｰ荳ｸ)', '1161000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1161003', '・･・ｳ・ｰ・ｯ・ｴ・茨ｾ趣ｾ滂ｽｲ・晢ｾ・ｼ・逕ｰ荳ｸ)', '1161000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('2000', '繹ｱ繧｢繝ｼ繧ｯ繝ｫ豬ｷ閠∝錐蝟ｶ讌ｭ謇', '2000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('455001', '繝ｴ繧｡繝ｬ繧ｪ繧ｫ繝壹ャ繧ｯ(繧ｫ繝翫く繝ｳ)', '455000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('384055', '繧ｦ繧ｨ繝ｫ繧ｷ繧｢逶ｸ讓｡蜴溽伐蜷榊ｺ・螟ｧ譛ｬ)', '384000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('621001', '・ｵ・ｰ・・ｾ奇ｾ橸ｽｯ・ｸ・ｽ莨雁兇蜴溷ｺ・・ｸ・假ｽｰ・晢ｽｻ・ｰ・具ｾ橸ｽｽ)', '621000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1203001', '繧ｪ繝ｼ繝医ヰ繝・け繧ｹ蠎ｧ髢灘ｺ・・・ｽｨ・ｰ・ｴ・ｽ)', '1203000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('437000', '繹ｱ繧ｫ繧ｹ繧ｿ繝髮ｻ蟄・, '437000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1205023', '繧ｫ繝ｳ繝翫Α繧｢繧ｯ繧｢繧ｷ繧ｹ繝・Β(・､・ｳ・ｰ)', '1205000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('2042000', '繹ｱ繝ｭ繧ｸ繧ｹ繝・ぅ繧ｯ繧ｹ繝ｻ繝阪ャ繝医Ρ繝ｼ繧ｯ', '2042000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1205027', '繧ｯ繝ｪ繝翫ャ繝怜漉髢｢譚ｱ繝・け繝・・､・ｳ・ｰ)', '1205000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1161006', '繧ｶ繝ｻ繝薙ャ繧ｰ蜴壽惠譌ｭ逕ｺ蠎・逕ｰ荳ｸ)', '1161000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1968000', '・包ｽｱ・ｻ・鯉ｾ・ｽｼ・ｮ・ｸ繹ｱ蜴壽惠迚ｩ豬・ｽｾ・晢ｾ・ｰ', '1968000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1709022', '・ｼ・ｬ・ｰ・鯉ｾ滂ｽｼ・橸ｽｬ・ｽ・・橸ｾ幢ｽｼ・橸ｽｽ・・ｽｨ・ｸ・ｽ(・趣ｾ滂ｽｼ・橸ｾ・ｽｨ・鯉ｾ・', '1709000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('346004', '・・ｾ橸ｾ暦ｽｯ・ｸ・ｾ・ｲ・托ｽｽ譛ｬ逕ｺ逕ｰ阮ｬ螻(螟ｧ荵・ｿ・', '346000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1036000', '繹ｱ繧ｻ繝輔ユ繧｣', '1036000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1130000', '繧ｿ繧ｭ繧ｲ繝ｳ陬ｽ騾繹ｱ蜴壽惠謾ｯ蠎・, '1130000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('621002', '・・ｷ・幢ｾ晢ｽｼ・ｰ・ｱ・ｲ繹ｱ(・ｸ・假ｽｰ・晢ｽｻ・ｰ・具ｾ橸ｽｽ)', '621000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1038002', '繝・ず繧ｿ繝ｫ繝励Ο繧ｻ繧ｹ(JSE-NET)', '1038000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1709041', '繝上・繝医Ο繧ｸ繧ｹ繝・ぅ繧ｯ繧ｹ(・趣ｾ滂ｽｼ・橸ｾ・ｽｨ・鯉ｾ・', '1709000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('863000', '謨ｷ蟲ｶ陬ｽ繝代Φ繹ｱ', '863000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1535003', '繝代Ν繧ｷ繧ｹ繝・Β逶ｸ讓｡繧ｻ繝ｳ繧ｿ繝ｼ', '1535000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1535002', '繝代Ν繧ｷ繧ｹ繝・Β逶ｸ讓｡髱呈棡繧ｻ繝ｳ繧ｿ繝ｼ', '1535000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1205065', '繝斐い繝朱°騾∝字譛ｨ蜈ｱ驟・・､・ｳ・ｰ)', '1205000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1551001', '繝薙ぐ(繝薙・繝医Ξ繝ｼ繝・ぅ繝ｳ繧ｰ)', '1551000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1205069', '繹ｱ繝悶Μ繝ゅせ繝医Φ讓ｪ豬懷ｷ･蝣ｴ(・､・ｳ・ｰ)', '1205000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1161007', '・擾ｽｯ・ｸ・ｽ・奇ｾ橸ｾ假ｽｭ遘ｦ驥取ｸ区ｲ｢蠎・逕ｰ荳ｸ)', '1161000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1205093', '・包ｾ・ｾ擾ｽｯ・・ｾ暦ｽｲ・悟字譛ｨ蝟ｶ讌ｭ謇(・､・ｳ・ｰ)', '1205000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1205097', '・包ｾ・ｾ擾ｽｯ・・ｾ夲ｾ晢ｾ・吝字譛ｨ(・､・ｳ・ｰ)', '1205000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1205098', '繝ｦ繝九・繝・ヨ繝ｬ繝ｳ繧ｿ繝ｫ阯､豐｢(・､・ｳ・ｰ)', '1205000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('50000', '繹ｱ譌ｭ驕矩・, '50000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('523000', '髢｢蛹・せ繝√・繝ｫ繹ｱ', '523000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1784000', '荳ｸ鬧帝°霈ｸ繹ｱ', '1784000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1205030', '魘ｻ豎驕玖ｼｸ繹ｱ(・､・ｳ・ｰ)', '1205000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1709068', '荳我ｺ募牙ｺｫ・幢ｽｼ・橸ｽｽ・・ｽｨ・ｸ・ｽ繹ｱ(・趣ｾ滂ｽｼ・橸ｾ・ｽｨ・鯉ｾ・', '1709000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1946000', '繹ｱ螻ｱ蟠取ｭｯ霆願｣ｽ菴懈園', '1946000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1533000', '繹ｱ譏･縺・ｉ繧峨°縺ｪ譖ｸ謌ｿ', '1533000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1205034', '蟆丞ｱｱ繹ｱ(・､・ｳ・ｰ)', '1205000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1203003', '荳雁ｷ槫ｱ句ｺｧ髢灘ｺ・・・ｽｨ・ｰ・ｴ・ｽ)', '1203000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1205057', '隘ｿ螟壽束驕矩√鯵(・､・ｳ・ｰ)', '1205000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('774062', '譌ｩ遞ｲ逕ｰ繧｢繧ｫ繝・Α繝ｼ譛ｬ蜴壽惠譬｡(SFI)', '774000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('530000', '繹ｲ骰帑ｻ｣蝠・ｺ・, '530000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1205052', '譚ｱ莠ｬ遐疲枚遉ｾ(・､・ｳ・ｰ)', '1205000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1556000', '譚ｱ譌･譛ｬ蜊泌酔繝代Ξ繝・ヨ繹ｱ', '1556000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1352017', '譚ｱ莠ｬ蜀ｷ讖滓ｹ伜漉(繝翫き繝繧､)', '1352000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1352011', '譚ｱ莠ｬ蜀ｷ讖溽･槫･亥ｷ晢ｼｳ・ｳ(繝翫き繝繧､)', '1352000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1352016', '譚ｱ莠ｬ蜀ｷ讖溽嶌讓｡(繝翫き繝繧､)', '1352000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('903000', '・ｼ・橸ｽｬ・ｸ・ｿ・晢ｽ･・暦ｾ趣ｾ橸ｾ暦ｾ・ｾ假ｽｰ・･・ｼ・橸ｽｬ・奇ｾ滂ｾ昴鯵', '903000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1420000', '繝九ャ繝昴Φ繝ｭ繧ｸ繹ｱ', '1420000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1709064', '蟇悟｣ｫ繝ｭ繧ｸ讓ｪ豬懃伴逕ｰ(・趣ｾ滂ｽｼ・橸ｾ・ｽｨ・鯉ｾ・', '1709000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1709043', '蟇悟｣ｫ繝ｭ繧ｸ蜴壽惠驥醍伐(・趣ｾ滂ｽｼ・橸ｾ・ｽｨ・鯉ｾ・', '1709000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1709054', '蟇悟｣ｫ繝ｭ繧ｸ髟ｷ豐ｼ/逾槫･亥ｷ・・趣ｾ滂ｽｼ・橸ｾ・ｽｨ・鯉ｾ・', '1709000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1709053', '蟇悟｣ｫ繝ｭ繧ｸ譚ｱ蜷榊字譛ｨ(・趣ｾ滂ｽｼ・橸ｾ・ｽｨ・鯉ｾ・', '1709000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1038015', '蟇悟｣ｫ騾夲ｾ茨ｽｯ・・ｾ懶ｽｰ・ｸ・ｿ・假ｽｭ・ｰ・ｼ・ｮ・晢ｽｽ・・JSE-NET)', '1038000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('33001', '蜀ｨ螢ｫ髮ｻ邱・繧｢繧ｪ繧､)', '33000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1205075', '譛ｬ髢薙ざ繝ｫ繝戊陸豐｢蠎・・､・ｳ・ｰ)', '1205000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1205084', '譛蛾團蝣・・､・ｳ・ｰ)', '1205000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1975000', '繹ｱ陬墓ｺ・, '1975000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1253000', '譚ｱ莠ｬ繝ｭ繧ｸ繝輔ぃ繧ｯ繝医Μ繝ｼ繹ｱ', '1253000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('794000', '繧ｵ繝ｳ繧､繝ｳ繝・Ν繝阪ャ繝亥字譛ｨ隨ｬ荳会ｽｾ・晢ｾ・ｰ', '794000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('382001', '・ゑｽｲ・晢ｽｼ・・ｽｨ螟ｧ逾槫慍蛹ｺ譫晉ｷ・螟ｧ譛ｬ邨・', '382000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('753000', '繹ｲ蝮ら伐莠ｮ菴懷膚蠎・, '753000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('2095000', '繹ｱ荳顔･櫁ｰｷ驕矩∝字譛ｨ', '2095000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;

-- 4. Master Collection Points
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('1', '(譬ｪ)・・ｽｸ・鯉ｾ橸ｾ奇ｾ滂ｽｯ・ｹ・ｰ・ｼ・樔ｸ頑ｺ昜ｺ区･ｭ謇', '逶ｸ讓｡蜴溷ｸゆｸｭ螟ｮ蛹ｺ荳頑ｺ・23', '1709032', '荳頑ｺ昜ｺ区･ｭ謇 / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('2', '(譬ｪ)・・ｽｸ・鯉ｾ橸ｾ奇ｾ滂ｽｯ・ｹ・ｰ・ｼ・樔ｸ贋ｾ晉衍莠区･ｭ謇', '蜴壽惠蟶ゆｸ贋ｾ晉衍1495-1', '1709031', '荳贋ｾ晉衍莠区･ｭ謇 / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('3', '(譬ｪ)荳蜈ｨ', '蟷ｳ蝪壼ｸょ屁荵句ｮｮ4-18-14', '1075001', '(譛育↓豌ｴ譛ｨ驥大悄) / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('4', 'ESPOT(・奇ｾ橸ｽｯ・ｸ・費ｽｰ・・ｾ・繽・, '莨雁兇蜴溷ｸよ｡懷床2-28-36', '1161004', '(豈取律) / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('5', 'ESPOT(・趣ｾ滂ｽｲ・晢ｾ・ｽｼ・ｽ・・ｾ・繽・, '莨雁兇蜴溷ｸよ｡懷床2-28-36', '1161003', '(豈取律) / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('6', 'ESPOT(・奇ｾ橸ｽｯ・ｸ・費ｽｰ・・ｾ・繽・, '莨雁兇蜴溷ｸよ｡懷床2-28-36', '1161004', '(豈取律) / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('7', 'ESPOT(・趣ｾ滂ｽｲ・晢ｾ・ｽｼ・ｽ・・ｾ・繽・, '莨雁兇蜴溷ｸよ｡懷床2-28-36', '1161003', '(豈取律) / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('8', 'LIXIL蜴壽惠', '蜴壽惠蟶よ←蜷・-8-1', NULL, '蠑・轣ｫ / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('9', '・ｱ・ｰ・ｸ・・, '豬ｷ閠∝錐蟶る摩豐｢讖・-13-25', '2000', '(譛・蝨・ / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('10', '・ｲ・ｼ・・櫁｣ｽ菴懈園', '蟷ｳ蝪壼ｸよ擲雎顔伐480-51', NULL, '・ｽ・趣ｾ滂ｽｯ・・/ FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('11', '・ｳ・橸ｽｧ・夲ｽｵ・ｶ・搾ｾ滂ｽｯ・ｸ・ｼ・橸ｽｬ・奇ｾ滂ｾ・, '蜴壽惠蟶る｣ｯ螻ｱ2585', '455001', '(驥・ / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('12', '・ｳ・ｪ・呻ｽｼ・ｱ逶ｸ讓｡逕ｰ蜷榊ｺ・, '逶ｸ讓｡蜴溷ｸゆｸｭ螟ｮ蛹ｺ逕ｰ蜷・757', '384055', '・域怦・･豌ｴ・･驥托ｼ・/ FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('13', '・ｵ・ｰ・・ｾ奇ｾ橸ｽｯ・ｸ・ｽ莨雁兇蜴溷ｺ・, '莨雁兇蜴溷ｸよｭ悟ｷ晢ｼ台ｸ∫岼・皮分蝨ｰ・托ｼ・, '621001', '(蝨・ / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('14', '・ｵ・ｰ・・ｾ奇ｾ橸ｽｯ・ｸ・ｽ蠎ｧ髢灘ｺ・, '蠎ｧ髢灘ｸり･ｿ譬怜次・台ｸ∫岼・冷・・・, '1203001', '・亥悄・・/ FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('15', '・ｶ・ｰ・夲ｾ晢ｾ・ｽｻ・ｰ・具ｾ橸ｽｽ', '蜴壽惠蟶よ虻逕ｰ2024?1', NULL, 'FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('16', '・ｶ・ｽ・・鷹崕蟄・, '逕ｺ逕ｰ蟶よ惠譖ｽ隘ｿ2-5-20', '437000', '・磯囈騾ｱ豌ｴ・・/ FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('17', '・ｶ・晢ｾ・ｾ撰ｽｱ・ｸ・ｱ・ｼ・ｽ・・ｾ・, '骼悟牙ｸよ焔蠎・-10-25', '1205023', '(譛・ / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('18', '・幢ｽｼ・橸ｽｽ・・ｽｨ・ｯ・ｸ・茨ｽｯ・・ｾ懶ｽｰ・ｸ(・ｷ・ｮ・ｸ・夲ｽｲ)', '蜴壽惠蟶る聞豐ｼ245', '2042000', '・域惠・・/ FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('19', '・ｸ・假ｾ・ｽｯ・鯉ｾ・, '蜴壽惠蟶よ溜逕ｺ4-11-5', '1205027', '(轣ｫ・･驥・ / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('20', '繧ｶ繝ｻ繝薙ャ繧ｰ蜴壽惠譌ｭ逕ｺ蠎・, '蜴壽惠蟶よ溜逕ｺ5-35-8', '1161006', 'FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('21', '・包ｽｱ・ｻ・･・鯉ｾ・ｽｼ・ｮ・ｸ繹ｱ', '蜴壽惠蟶る・莠・740', '1968000', '(譛・蝨・ / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('22', '・ｻ・晢ｽｲ・晢ｾ・ｾ呻ｾ茨ｽｯ・・ｵｷ閠∝錐', '豬ｷ閠∝錐蟶ゆｻ企㈹3-26-11', NULL, 'FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('23', '・ｼ・ｬ・ｰ・鯉ｾ滂ｽｼ・橸ｽｬ・ｽ・・橸ｾ幢ｽｼ・橸ｽｽ・・ｽｨ・ｸ・ｽ', '螟ｧ蜥悟ｸゆｸｭ螟ｮ譫鈴俣7-12-2', '1709022', 'FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('24', '・ｾ・ｲ・托ｽｽ逕ｺ逕ｰ譛ｨ譖ｽ蠎・, '逕ｺ逕ｰ蟶よ惠譖ｽ逕ｺ493-2', NULL, '(譛茨ｽ･豌ｴ・･驥・ / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('25', '・ｾ・ｲ・托ｽｽ譛ｬ逕ｺ逕ｰ阮ｬ螻', '逕ｺ逕ｰ蟶よ悽逕ｺ逕ｰ2943-1', '346004', '(譛茨ｽ･豌ｴ・･驥・ / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('26', '・ｾ・鯉ｾ・ｽｨ', '蟇貞ｷ晉伴蛟芽ｦ・212', '1036000', '(譛・ / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('27', '・・ｷ・ｹ・橸ｾ晁｣ｽ騾', '蜴壽惠蟶り飴蟄・80-1', '1130000', '(譛茨ｽ･豌ｴ・･驥・ / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('28', '・・ｷ・幢ｾ晢ｽｼ・ｰ・ｱ・ｲ', '蟷ｳ蝪壼ｸら伐譚・-2-1', '621002', '(轣ｫ・･譛ｨ) / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('29', '・・ｾ橸ｽｼ・橸ｾ・呻ｾ鯉ｾ滂ｾ幢ｽｾ・ｽ', '蜴壽惠蟶ゆｸｭ逕ｺ2-9-6    縺ｱ縺・, '1038002', '(隨ｬ1譛域屆譌･) 13:00蜿ｰ謖・ｮ・/ FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('30', '・・ｾ橸ｾ晢ｽｿ・ｰ・・ｾ・, '讓ｪ豬懷ｸる・遲大玄闌・Ω蟠惹ｸｭ螟ｮ24-4', NULL, '・井ｸ榊ｮ壽悄・・/ FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('31', '・奇ｽｰ・・ｾ幢ｽｼ・樒嶌讓｡蜴・, '逶ｸ讓｡蜴溷ｸらｷ大玄讖区悽蜿ｰ3-13', '1709041', '諡・ｽ楢・繧ｵ繧､繝医え讒・/ FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('32', '謨ｷ蟲ｶ陬ｽ・奇ｾ滂ｾ・・奇ｾ滂ｽｽ・ｺ)', '蟇貞ｷ晉伴荳荵句ｮｮ・嶺ｸ∫岼・吮・・・, '863000', '(蝨・ / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('33', '・奇ｾ擾ｽｷ・ｮ・ｳ・夲ｽｯ・ｸ・ｽ', '邯ｾ轢ｬ蟶ょ翠蟯｡2668-4', NULL, 'FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('34', '・奇ｾ滂ｾ呻ｽｼ・ｽ・・ｾ醍嶌讓｡・ｾ・晢ｾ・ｰ', '諢帛ｷ晉伴荳ｭ豢･4036-7', '1535003', '(轣ｫ) / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('35', '・奇ｾ滂ｾ呻ｽｼ・ｽ・・ｾ醍嶌讓｡髱呈棡・ｾ・晢ｾ・ｰ', '諢帛ｷ晉伴荳ｭ豢･4081', '1535002', '(轣ｫ) / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('36', '・具ｾ滂ｽｱ・蛾°騾・蜴壽惠蜈ｱ驟・, '蜴壽惠蟶る・莠・193', '1205065', '(驥・ / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('37', '・具ｾ橸ｽｷ・・, '蜴壽惠蟶ょｲ｡逕ｰ3105', '1551001', 'FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('38', '・鯉ｾ橸ｾ假ｾ・ｾ橸ｽｽ・・ｾ晄ｨｪ豬懷ｷ･蝣ｴ', '讓ｪ豬懷ｸよ虻蝪壼玄譟丞ｰｾ逕ｺ1逡ｪ蝨ｰ', '1205069', '(轣ｫ・･譛ｨ) / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('39', '・搾ｾ滂ｽｱ', '讓ｪ豬懷ｸらｬ隹ｷ蛹ｺ莠碑ｲｫ逶ｮ逕ｺ23-10', NULL, '隲ｸ蜿｣莨晉･ｨ繧剃ｽ懊ｊ謇区嶌縺阪〒縲趣ｾ搾ｾ滂ｽｱ縲上→險伜・ / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('40', '・擾ｽｯ・ｸ・ｽ・奇ｾ橸ｾ假ｽｭ遘ｦ驥取ｸ区ｲ｢蠎・, '逾槫･亥ｷ晉恁遘ｦ驥主ｸょ蟾・19-1', '1161007', 'FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('41', '・擾ｾ呻ｽｲ・・, '蜴壽惠蟶る・莠・162', NULL, 'FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('42', '・包ｾ・ｾ擾ｽｯ・・ｾ暦ｽｲ・悟字譛ｨ蝟ｶ讌ｭ謇', '蜴壽惠蟶ょｲ｡逕ｰ3117', '1205093', '(譛茨ｽ･豌ｴ・･驥・ / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('43', '・包ｾ・ｾ擾ｽｯ・・ｾ夲ｾ晢ｾ・吝字譛ｨ', '蜴壽惠蟶よ・-4-18', '1205097', '(驥・ / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('44', '・包ｾ・ｾ擾ｽｯ・・陸豐｢', '阯､豐｢蟶よ氛豐｢221-3', '1205098', '(譛・ / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('45', '譌ｭ驕矩・, '蟷ｳ蝪壼ｸゆｸ句ｳｶ1022-4', '50000', '・域惠・・/ FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('46', '螳・・螳ｮ陞ｺ蟄・隨ｬ3譛ｨ譖・', '逾槫･亥ｷ晉恁莨雁兇蜴溷ｸる斡蟾・0', NULL, 'FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('47', '・茨ｽｸ・ｽ・・ｽｴ・・ｽｼ・樞⊇・ｱ・晢ｾ・ｾ橸ｾ假ｽｿ・ｰ・ｽ', '逶ｸ讓｡蜴溷ｸゆｸｭ螟ｮ蛹ｺ逋ｽ髮ｨ蜿ｰ3532-9', NULL, '繹ｱ豬懃伐 / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('48', '髢｢蛹・ｽｽ・・ｽｰ・・, '莨雁兇蜴溷ｸる斡蟾・3', '523000', 'FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('49', '荳ｸ鬧帝°霈ｸ', '蟷ｳ蝪壼ｸゆｸ句ｳｶ1022-11', '1784000', '・域惠・・/ FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('50', '辭願ｰｷ邨ДPL蟷ｳ蝪・, '蟷ｳ蝪壼ｸょ､ｧ逾・-1', NULL, '(譛ｨ) / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('51', '蠎・區', '阯､豐｢蟶ょ悄譽・64-2', NULL, '(隨ｬ2譛域屆) / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('52', '魘ｻ豎驕玖ｼｸ', '諢帛ｷ晉伴荳ｭ豢･4009-3縲GLP蜴壽惠6F', '1205030', 'FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('53', '荳我ｺ募牙ｺｫ', '逶ｸ讓｡蜴溷ｸゆｸｭ螟ｮ蛹ｺ逕ｰ蜷崎ｵ､蝮・700-・・, '1709068', 'FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('54', '螻ｱ蟠取ｭｯ霆・莨雁兇蜴溷ｷ･蝣ｴ', '莨雁兇蜴溷ｸよｭ悟ｷ・, '1946000', '(・ｽ・趣ｾ滂ｽｯ・・ / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('55', '螻ｱ蟠取ｭｯ霆翫謌ｸ逕ｰ', '蜴壽惠蟶よ虻逕ｰ674', '1946000', '(・ｽ・趣ｾ滂ｽｯ・・ / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('56', '譏･縺・ｉ繧峨°縺ｪ譖ｸ謌ｿ', '莨雁兇蜴溷ｸょｰ冗ｨｲ闡・58', '1533000', '(譛・ / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('57', '蟆丞ｱｱ', '蜴壽惠蟶ょｲ｡逕ｰ4-5-10', '1205034', '(譛茨ｽ･豌ｴ・･驥・ / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('58', '貉伜漉蛟牙ｺｫ', '蜴壽惠蟶る聞豐ｼ248', NULL, '(轣ｫ) / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('59', '荳雁ｷ槫ｱ句ｺｧ髢灘ｺ・, '蠎ｧ髢灘ｸよ擲蜴・-12-39', '1203003', '(譛・ / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('60', '隘ｿ螟壽束驕矩・, '阯､豐｢蟶ょｮｮ蜴・389', '1205057', '(蝨・ / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('61', '譌ｩ遞ｲ逕ｰ・ｱ・ｶ・・ｾ橸ｾ撰ｽｰ譛ｬ蜴壽惠譬｡', '蜴壽惠荳ｭ逕ｺ3-11-20譛ｬ蜴壽惠・ｹ・ｲ・具ｾ橸ｾ・F', '774062', '(轣ｫ)縲14:00蜿ｰ謖・ｮ・/ FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('62', '螟ｧ隘ｿ驥大ｱ・, '讓ｪ豬懷ｸらｬ隹ｷ蛹ｺ髦ｿ荵・柱蜊・-36-7', NULL, '蜃ｺ闕ｷ / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('63', '骰帑ｻ｣蝠・ｺ・, '蜴壽惠蟶る・莠・045-1?', '530000', 'FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('64', '譚ｱ莠ｬ・ｽ・・ｽｰ・呻ｽｾ・晢ｾ・ｰ', '諢帛ｷ晉伴4020-6', NULL, 'FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('65', '譚ｱ莠ｬ遐疲枚遉ｾ 蝗ｽ蜷牙牙ｺｫ', '讓ｪ豬懷ｸらｷ大玄髱堤･逕ｺ348-3', '1205052', '譚ｱ莠ｬ遐疲枚遉ｾ 驟埼・ｽｾ・晢ｾ・ｰ / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('66', '譚ｱ莠ｬ蜀ｷ讖・蜴壽惠)', '蜴壽惠蟶ょｦｻ逕ｰ蜊・-24-25', NULL, 'FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('67', '譚ｱ譌･譛ｬ蜊泌酔・奇ｾ滂ｾ夲ｽｯ・・, '蜴壽惠蟶る・莠・045-1?ICB 7蜿ｷ', '1556000', 'FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('68', '譚ｱ蜀ｷ・･貉伜漉蝟ｶ讌ｭ謇', '阯､豐｢蟶りｾｻ蝣ら･槫床2-12-15', '1352017', '(譛・ / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('69', '譚ｱ蜀ｷ・･逾槫･亥ｷ抓S', '阯､豐｢蟶ら區譌・-1-8', '1352011', '(譛・ / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('70', '譚ｱ蜀ｷ・･逶ｸ讓｡蝟ｶ讌ｭ謇', '逶ｸ讓｡蜴溷ｸゆｸｭ螟ｮ蛹ｺ豺ｵ驥手ｾｺ譛ｬ逕ｺ2-17-27', '1352016', 'FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('71', '・ｼ・橸ｽｬ・ｸ・ｿ・晢ｽ･・暦ｾ趣ｾ橸ｾ暦ｾ・ｾ假ｽｰ・･・ｼ・橸ｽｬ・奇ｾ滂ｾ・, '蜴壽惠蟶ゆｸ句商豐｢794', '903000', '・ｽ・趣ｾ滂ｽｯ・・/ FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('72', '・・ｽｯ・趣ｾ滂ｾ晢ｾ幢ｽｼ・・, '莨雁兇蜴溷ｸゆｸ玖誠蜷・52-10', '1420000', '(蝨・ / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('73', '蟇悟｣ｫ・幢ｽｼ・樊ｨｪ豬懃伴逕ｰ', '蠎ｧ髢灘ｸよ擲蜴・-1-32', '1709064', '(譛茨ｽ･豌ｴ・･驥・ / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('74', '蟇悟｣ｫ・幢ｽｼ・樣≡逕ｰ', '30蛻・燕髮ｻ隧ｱ046-297-1705', '1709043', '(譛茨ｽ･轣ｫ・･豌ｴ・･譛ｨ・･驥・ / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('75', '蟇悟｣ｫ・幢ｽｼ・樣聞豐ｼ', '蜴壽惠蟶る聞豐ｼ242', '1709054', '(譛茨ｽ･豌ｴ・･驥・ / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('76', '蟇悟｣ｫ・幢ｽｼ・樣聞豐ｼ(莠句漁謇)', '蜴壽惠蟶る聞豐ｼ242', '1709054', '(轣ｫ・･驥・ / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('77', '蟇悟｣ｫ・幢ｽｼ・樊擲蜷榊字譛ｨ', '蜴壽惠蟶る聞隹ｷ6-19', '1709053', '(譛茨ｽ･譛ｨ) / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('78', '蟇悟｣ｫ騾夲ｾ茨ｽｯ・・ｾ懶ｽｰ・ｸ・ｿ・假ｽｭ・ｰ・ｼ・ｮ・・, '讓ｪ豬懷ｸり･ｿ蛹ｺ鬮伜ｳｶ1-1-2', '1038015', '・域ｰｴ・・/ FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('79', '蟇悟｣ｫ騾夲ｾ撰ｾ・ｾ橸ｾ呻ｽｳ・ｪ・ｱ', '讓ｪ豬懷ｸよｸｯ蛹怜玄譁ｰ讓ｪ豬・-15-16', NULL, '(・ｽ・趣ｾ滂ｽｯ・・ / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('80', '蜀ｨ螢ｫ髮ｻ邱・, '莨雁兇蜴溷ｸる斡蟾・0', '33001', '(驥・ / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('81', '譛ｬ髢難ｽｺ・橸ｾ呻ｾ瑚陸豐｢蠎・, '阯､豐｢蟶よｹ伜漉蜿ｰ7-37-8', '1205075', '(譛・ / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('82', '譛蛾團蝣・, '蜴壽惠蟶ゆｸｭ逕ｺ2-6', '1205084', '(轣ｫ・･驥・ / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('83', '陬墓ｺ・, '逶ｸ讓｡蜴溷ｸゆｸｭ螟ｮ蛹ｺ逕ｰ蜷榊｡ｩ逕ｰ1-14-18', '1975000', 'FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('84', '・鯉ｾ暦ｽｲ・ｽ・・ｰ迚ｩ豬∵ｪ蠑丈ｼ夂､ｾ', '蜴壽惠蟶る聞隹ｷ376-1', NULL, '(・ｽ・趣ｾ滂ｽｯ・・ / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('85', '譛蛾剞莨夂､ｾ繧ｸ繝ｼ繧ｹ繧ｫ繧､', '蟷ｳ蝪壼ｸり･ｿ逵溷悄1-6-74', NULL, '(・ｽ・趣ｾ滂ｽｯ・・ / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('86', '・茨ｽｸ・ｽ・・ｽｴ・・ｽｼ・樞⊇・ｱ・晢ｾ・ｾ橸ｾ假ｽｿ・ｰ・ｽ', '蜴壽惠蟶よ｣ｮ縺ｮ驥悟悄蝨ｰ蛹ｺ逕ｻ謨ｴ逅・ｺ区･ｭ蝨ｰ蜀・, NULL, '繹ｱ豬懃伐 / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('87', '・ｾ・ｲ・撰ｾょｹｳ蝪壼ｷ･蝣ｴ', '蟷ｳ蝪壼ｸょ屁荵句ｮｮ7-3-1', NULL, '(・ｽ・趣ｾ滂ｽｯ・・ / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('88', '譚ｱ莠ｬ・幢ｽｼ・橸ｾ鯉ｽｧ・ｸ・・ｾ假ｽｰ', '蜴壽惠蟶ゆｸ贋ｾ晉衍1043-1', '1253000', '・域ｰｴ・・/ FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('89', '繹ｲ蟆乗棊驕矩∝ｺ・, '蟷ｳ蝪壼ｸよ擲蜈ｫ蟷｡3-2-12', NULL, '(・ｽ・趣ｾ滂ｽｯ・・ / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('90', '・ｻ・晢ｽｲ・晢ｾ・ｾ呻ｾ茨ｽｯ・ЙPR', '蜴壽惠蟶る・莠・740', '794000', '・ｽ・趣ｾ滂ｽｯ・・/ FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('91', '逾槫･亥ｷ晢ｾ奇ｾ擾ｾ・ｲ・斐鯵', '蜴壽惠蟶よ虻逕ｰ259-3', NULL, '(・ｽ・趣ｾ滂ｽｯ・・ / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('92', '繹ｱ螟ｧ譛ｬ邨・, '蟷ｳ蝪壼ｸょ､ｧ逾・, '382001', '(・ｽ・趣ｾ滂ｽｯ・・ / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('93', '蝮ら伐濶ｯ菴懷膚蠎・, '邯ｾ轢ｬ蟶ょｰ丞恍841', '753000', '(・ｽ・趣ｾ滂ｽｯ・・ / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('94', '・ｺ窶撰ｾ・ｾ晏､ｧ闊ｹ・難ｽｰ・・, '骼悟牙ｸょ､ｧ闊ｹ1188-1', NULL, '(・ｽ・趣ｾ滂ｽｯ・・ / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('95', '荳顔･櫁ｰｷ驕矩∝字譛ｨ', '蜴壽惠蟶ゆｸ贋ｾ晉衍1086', '2095000', '(驥・ / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;

-- 5. Customer Item Defaults
DO $$
DECLARE
  target_item_id UUID;
BEGIN
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('1', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '髮代′縺ｿ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('1', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '・ｽ・・ｾ夲ｽｯ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('1', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('2', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '閾ｭ莉俶ｮｵ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('2', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '髮題ｪ・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('2', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('3', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('4', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '髮第腐邏・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('5', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('6', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('6', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '髮第腐邏・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('7', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('8', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('9', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('10', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('11', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('12', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('13', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('14', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('15', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('16', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('17', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('18', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('19', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '讓｡騾・奇ｾ橸ｾ・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('19', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '髮第腐邏・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('20', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '・搾ｾ滂ｽｯ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('20', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('21', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '髮第腐邏・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('21', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('22', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '髮第腐邏・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('22', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '髮題ｪ・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('22', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('23', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('24', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('25', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('26', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('27', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '髮題ｪ・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('27', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('28', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('28', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('29', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '・ｱ・呻ｾ千ｼｶ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('29', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '蟒・ｾ鯉ｾ滂ｾ苓ｻ溯ｳｪ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('30', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('31', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '蟒・ｾ鯉ｾ滂ｾ苓ｻ溯ｳｪ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('31', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '髮題｢・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('32', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('33', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '・撰ｽｯ・ｸ・ｽ邏・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('34', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '・ｽ・・ｾ夲ｽｯ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('34', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '・撰ｽｯ・ｸ・ｽ邏・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('35', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '髮題｢・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('35', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('36', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('37', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('38', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '髮題ｪ・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('39', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '髮第腐邏・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('40', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('41', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('42', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('43', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '・ｼ・ｭ・夲ｽｯ・・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('43', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('44', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '・ｽ・・ｾ夲ｽｯ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('44', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('45', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '髮題ｪ・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('45', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '・ｽ・・ｾ夲ｽｯ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('45', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '髮題ｪ・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('46', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '髮題ｪ・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('46', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('47', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('48', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('49', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '髮題ｪ・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('49', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '髮代′縺ｿ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('49', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('50', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('51', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('52', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('53', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('54', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '髮代′縺ｿ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('54', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('55', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '髮題ｪ・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('56', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '髮題ｪ・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('56', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('57', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('57', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('58', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('59', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('60', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('61', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '・ｱ・呻ｾ千ｼｶ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('62', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('63', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('64', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '荳奇ｽｹ・晢ｾ・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('65', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '邏咏ｮ｡' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('65', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('66', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '髮題ｪ・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('66', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('67', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('68', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('69', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '髮題ｪ・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('69', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('70', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '髮題ｪ・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('70', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('71', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '・撰ｽｯ・ｸ・ｽ邏・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('71', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('72', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '・ｽ・・ｾ夲ｽｯ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('72', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('73', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '髮代′縺ｿ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('73', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('74', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '髮代′縺ｿ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('74', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '・ｽ・・ｾ夲ｽｯ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('74', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('75', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '髮代′縺ｿ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('75', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '髮代′縺ｿ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('75', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('76', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '・ｽ・・ｾ夲ｽｯ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('76', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('77', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '髮題ｪ・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('77', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('78', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('79', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('80', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('81', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '・搾ｾ滂ｽｯ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('81', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('82', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '髮代′縺ｿ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('82', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('83', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '・ｽ・・ｾ夲ｽｯ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('83', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('84', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '・具ｾ橸ｾ・ｽｰ・呻ｾ奇ｾ橸ｾ・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('84', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('85', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '髮代′縺ｿ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('85', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('86', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '髮代′縺ｿ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('86', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('87', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('88', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('89', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('90', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('91', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '谿ｵ・趣ｾ橸ｽｰ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('92', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '・ｼ・ｭ・夲ｽｯ・・橸ｽｰ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('92', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '・擾ｾ呻ｾ￣・･・奇ｾ橸ｾ・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('93', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '髮代′縺ｿ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('93', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '讖溷ｯ・嶌鬘・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('94', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '・ｽ・・ｾ夲ｽｯ・・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('95', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '髮題ｪ・ LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('95', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
END $$;
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
('1繻ｧ6902')
on conflict (number) do nothing;
-- Seed drivers data
-- Using INSERT ... SELECT ... WHERE NOT EXISTS to avoid duplicates based on name
INSERT INTO public.drivers (id, driver_name)
SELECT gen_random_uuid()::text, name
FROM (VALUES
  ('蟯ｩ菴・),
  ('闖頑ｱ'),
  ('髢｢蜿｣'),
  ('譚ｾ譏・),
  ('逡第ｾ､'),
  ('鮗ｻ鄒・),
  ('迚・ｱｱ'),
  ('螻ｱ逕ｰ'),
  ('荳・㈹'),
  ('阯､蟾・),
  ('驤ｴ譛ｨ')
) AS t(name)
WHERE NOT EXISTS (
  SELECT 1 FROM public.drivers WHERE driver_name = t.name
);
-- Unify all item units to 'kg'
UPDATE master_items SET unit = 'kg';
-- Migration: Add status column and clean up data
-- Timestamp: 20260211070500

-- 1. Add status column to jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS status TEXT DEFAULT '譛ｪ驟崎ｻ・;

-- 2. Add check constraint for status (optional, but good practice)
-- ALTER TABLE jobs ADD CONSTRAINT check_status CHECK (status IN ('譛ｪ驟崎ｻ・, '驟崎ｻ頑ｸ医∩', '螳御ｺ・, '繧ｭ繝｣繝ｳ繧ｻ繝ｫ'));

-- 3. Clean up old data (Truncate)
TRUNCATE TABLE jobs;

-- 4. Seed new test data
INSERT INTO jobs (
  id, 
  job_title, 
  status, 
  bucket_type, 
  customer_name, 
  item_category, 
  start_time, 
  duration_minutes, 
  special_notes
) VALUES
('job_test_01', '螳壽悄蝗槫庶A', '譛ｪ驟崎ｻ・, '螳壽悄', '蟇悟｣ｫ繝ｭ繧ｸ髟ｷ豐ｼ', '辯・∴繧九ざ繝・, NULL, 15, '繝・せ繝医ョ繝ｼ繧ｿ1'),
('job_test_02', '螳壽悄蝗槫庶B', '譛ｪ驟崎ｻ・, '螳壽悄', '繝ｪ繝舌・繧ｯ繝ｬ繧､繝ｳ', '谿ｵ繝懊・繝ｫ', NULL, 30, '繝・せ繝医ョ繝ｼ繧ｿ2'),
('job_test_03', '繧ｹ繝昴ャ繝亥屓蜿擦', '譛ｪ驟崎ｻ・, '繧ｹ繝昴ャ繝・, 'ESPOT(繧ｹ繝昴ャ繝・', '驥大ｱ槭￥縺・, '09:00', 45, '蜊亥燕謖・ｮ・),
('job_test_04', '螳壽悄蝗槫庶D', '譛ｪ驟崎ｻ・, '螳壽悄', '繝ｦ繝九・繝・ヨ', '繝励Λ繧ｹ繝√ャ繧ｯ', NULL, 15, '繝・せ繝医ョ繝ｼ繧ｿ4'),
('job_test_05', '迚ｹ蛻･蝗槫庶E', '譛ｪ驟崎ｻ・, '迚ｹ谿・, '迚ｹ蛻･蟾･蝣ｴA', '逋ｺ豕｡繧ｹ繝√Ο繝ｼ繝ｫ', '13:00', 60, '隕∽ｺ句燕騾｣邨｡');
-- Phase 11: Fix drivers table schema
-- 谺關ｽ縺励※縺・◆ display_order 繧ｫ繝ｩ繝繧定ｿｽ蜉縺励・00 Bad Request 繧定ｧ｣豸医☆繧・

ALTER TABLE drivers ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 999;

-- 譌｢蟄倥ョ繝ｼ繧ｿ縺ｮ荳ｦ縺ｳ鬆・ｒID鬆・↓蛻晄悄蛹・
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY id) as rn
  FROM drivers
)
UPDATE drivers
SET display_order = ranked.rn
FROM ranked
WHERE drivers.id = ranked.id;
-- Fix Persistence Issue: Create routes table and RPC
-- Phase: 11 (Stabilization)
-- Reason: Fix 400 Bad Request on save due to missing table/function

-- 1. Create routes table if not exists
CREATE TABLE IF NOT EXISTS public.routes (
    date DATE PRIMARY KEY,
    jobs JSONB DEFAULT '[]'::jsonb,
    drivers JSONB DEFAULT '[]'::jsonb,
    splits JSONB DEFAULT '[]'::jsonb,
    pending JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Edit Lock Columns (Phase 2.2)
    edit_locked_by UUID REFERENCES auth.users(id),
    edit_locked_at TIMESTAMPTZ,
    last_activity_at TIMESTAMPTZ
);

-- RLS
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON public.routes
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert/update for authenticated users" ON public.routes
    FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- 2. Create RPC function for board updates
CREATE OR REPLACE FUNCTION public.rpc_execute_board_update(
    p_date DATE,
    p_new_state JSONB,
    p_decision_type TEXT DEFAULT NULL,
    p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_user_id UUID;
    v_result JSONB;
BEGIN
    v_current_user_id := auth.uid();

    -- Extract data from p_new_state
    -- Expected structure: { jobs: [], drivers: [], splits: [], pending: [], ... }
    
    INSERT INTO public.routes (
        date,
        jobs,
        drivers,
        splits,
        pending,
        updated_at,
        last_activity_at,
        edit_locked_by
    )
    VALUES (
        p_date,
        COALESCE(p_new_state->'jobs', '[]'::jsonb),
        COALESCE(p_new_state->'drivers', '[]'::jsonb),
        COALESCE(p_new_state->'splits', '[]'::jsonb),
        COALESCE(p_new_state->'pending', '[]'::jsonb),
        NOW(),
        NOW(),
        v_current_user_id -- Extend lock if saving
    )
    ON CONFLICT (date) DO UPDATE SET
        jobs = EXCLUDED.jobs,
        drivers = EXCLUDED.drivers,
        splits = EXCLUDED.splits,
        pending = EXCLUDED.pending,
        updated_at = NOW(),
        last_activity_at = NOW(),
        edit_locked_by = v_current_user_id; -- Extend lock on save

    -- Return success
    v_result := jsonb_build_object(
        'success', true,
        'message', 'Board updated successfully',
        'updated_at', NOW()
    );

    RETURN v_result;

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$;
-- Fix Jobs Table RLS (Phase 11.2)
-- Reason: Authenticated users getting 400 Bad Request on SELECT

-- 1. Ensure RLS is enabled
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies (Clean slate to remove broken logic)
DROP POLICY IF EXISTS "Enable read access for all users" ON public.jobs;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.jobs;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.jobs;
DROP POLICY IF EXISTS "Enable access for anon" ON public.jobs;

-- 3. Create permissive policies for Authenticated users
-- Read
CREATE POLICY "Enable read access for authenticated users" ON public.jobs
    FOR SELECT TO authenticated USING (true);

-- Write (If needed in future, but safely enabled for now)
CREATE POLICY "Enable insert/update for authenticated users" ON public.jobs
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. Grant access to roles (Just in case)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.jobs TO authenticated;
GRANT SELECT ON TABLE public.jobs TO anon;
-- Phase 3: Data Integrity & Archiving Support
-- 譌･莉・ 2026-02-14
-- 逶ｮ逧・ 螟夜Κ繧ｭ繝ｼ蛻ｶ邏・・蠑ｷ蛹悶♀繧医・迚ｩ逅・炎髯､繧剃ｼｴ繧上↑縺・い繝ｼ繧ｫ繧､繝匁ｩ溯・縺ｮ蝓ｺ逶､讒狗ｯ・

-- 1. drivers 繝・・繝悶Ν縺ｮ謨ｴ蜷域ｧ蠑ｷ蛹・
-- profiles 繝・・繝悶Ν縺ｸ縺ｮ螟夜Κ繧ｭ繝ｼ蛻ｶ邏・ｒ霑ｽ蜉縺吶ｋ縺溘ａ縺ｮ荳区ｺ門ｙ
-- 豕ｨ諢・ profiles.id 縺・TEXT 蝙九・縺溘ａ縲∫ｴ蝉ｻ倥￠蜈医・ user_id 繧・TEXT 蝙九〒菴懈・縺吶ｋ蠢・ｦ√′縺ゅｊ縺ｾ縺吶・
-- 縺吶〒縺ｫ UUID 蝙九〒菴懈・縺輔ｌ縺ｦ縺・ｋ蝣ｴ蜷医・繝ｪ繧ｫ繝舌Μ繧貞性縺ｿ縺ｾ縺吶・
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'drivers' AND column_name = 'user_id' AND data_type = 'uuid'
    ) THEN
        ALTER TABLE drivers ALTER COLUMN user_id TYPE TEXT;
    ELSIF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'drivers' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE drivers ADD COLUMN user_id TEXT;
    END IF;
END $$;

-- profiles 繝・・繝悶Ν縺ｸ縺ｮ螟夜Κ繧ｭ繝ｼ蛻ｶ邏・ｒ霑ｽ蜉・亥ｭ伜惠繝√ぉ繝・け・・
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_drivers_profiles'
    ) THEN
        ALTER TABLE drivers
        ADD CONSTRAINT fk_drivers_profiles
        FOREIGN KEY (user_id) REFERENCES profiles(id)
        ON DELETE SET NULL;
    END IF;
END $$;

-- 2. master_collection_points (譌ｧ customers) 縺ｮ繧｢繝ｼ繧ｫ繧､繝門ｯｾ蠢・
ALTER TABLE master_collection_points 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 3. vehicles 繝・・繝悶Ν縺ｮ繧｢繝ｼ繧ｫ繧､繝門ｯｾ蠢・
DO $$
BEGIN
    -- vehicles 縺悟ｮ溘ユ繝ｼ繝悶Ν縺ｨ縺励※蟄伜惠縺吶ｋ蝣ｴ蜷・
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'vehicles' AND table_type = 'BASE TABLE'
    ) THEN
        ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
    -- vehicles 縺・View 縺ｮ蝣ｴ蜷医∝ｮ滉ｽ薙・ master_vehicles (Core/Ext繝｢繝・Ν) 縺ｧ縺ゅｋ縺ｨ蛻､譁ｭ
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'master_vehicles' AND table_type = 'BASE TABLE'
    ) THEN
        ALTER TABLE master_vehicles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- 4. master_items 繝・・繝悶Ν縺ｮ繧｢繝ｼ繧ｫ繧､繝門ｯｾ蠢・
ALTER TABLE master_items 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 5. 譌｢蟄倥・ RPC 繧偵い繝ｼ繧ｫ繧､繝門ｯｾ蠢懊↓縺吶ｋ縺溘ａ縺ｮ隲也炊蜑企勁逕ｨ蛻､螳夊ｿｽ蜉・井ｻｻ諢擾ｼ・
-- 縺薙％縺ｧ縺ｯ蝓ｺ逶､縺ｮ縺ｿ菴懈・縺励∝ｮ滄圀縺ｮ縲梧署譯・>謇ｿ隱・>譖ｴ譁ｰ縲阪ヵ繝ｭ繝ｼ縺ｯ繧｢繝励Μ繧ｱ繝ｼ繧ｷ繝ｧ繝ｳ蛛ｴ縺ｧ蛻ｶ蠕｡縺吶ｋ縲・
-- ==========================================
-- DX OS Base/Extension Separation Model (Phase 4)
-- Core: master_vehicles
-- Extension: logistics_vehicle_attrs
-- ==========================================

-- 1. Rename existing 'vehicles' to 'master_vehicles' (Core Layer)
-- Note: Re-runnable check
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vehicles' AND table_type = 'BASE TABLE') THEN
        ALTER TABLE vehicles RENAME TO master_vehicles;
    END IF;
END $$;

-- 2. Ensure Core Columns
ALTER TABLE master_vehicles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE master_vehicles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Create Extension Table (Logistics Layer)
CREATE TABLE IF NOT EXISTS logistics_vehicle_attrs (
    vehicle_id UUID PRIMARY KEY REFERENCES master_vehicles(id) ON DELETE CASCADE,
    max_payload NUMERIC,
    fuel_type TEXT,
    vehicle_type TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Compatibility View
-- This allows existing code to keep using 'from(vehicles)' for Read operations
CREATE OR REPLACE VIEW vehicles AS
SELECT 
    v.id,
    v.number,
    v.is_active,
    v.created_at,
    v.updated_at,
    a.max_payload,
    a.fuel_type,
    a.vehicle_type
FROM master_vehicles v
LEFT JOIN logistics_vehicle_attrs a ON v.id = a.vehicle_id;

-- 5. SDR Master Update RPC (Atomic Proposal/Decision/State Update)
CREATE OR REPLACE FUNCTION rpc_execute_master_update(
    p_table_name TEXT,
    p_id UUID,
    p_core_data JSONB,
    p_ext_data JSONB,
    p_decision_type TEXT,
    p_reason TEXT,
    p_user_id TEXT
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_proposal_id UUID;
    v_decision_id UUID;
BEGIN
    -- 1. Record Proposal (Auto-approve for Master updates)
    INSERT INTO decision_proposals (status, proposed_data, reason_description, applicant_id, reviewed_at, reviewed_by)
    VALUES ('approved', p_core_data || p_ext_data, p_reason, p_user_id, NOW(), p_user_id)
    RETURNING proposal_id INTO v_proposal_id;

    -- 2. Record Decision
    INSERT INTO decisions (proposal_id, decision_type, actor_id)
    VALUES (v_proposal_id, p_decision_type, p_user_id)
    RETURNING decision_id INTO v_decision_id;

    -- 3. Update Core (master_vehicles)
    IF p_table_name = 'vehicles' THEN
        INSERT INTO master_vehicles (id, number, is_active, updated_at)
        VALUES (
            COALESCE(p_id, gen_random_uuid()),
            p_core_data->>'number',
            (p_core_data->>'is_active')::BOOLEAN,
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            number = EXCLUDED.number,
            is_active = EXCLUDED.is_active,
            updated_at = NOW()
        RETURNING id INTO p_id;

        -- 4. Update Extension (logistics_vehicle_attrs)
        INSERT INTO logistics_vehicle_attrs (vehicle_id, max_payload, fuel_type, vehicle_type, updated_at)
        VALUES (
            p_id,
            (p_ext_data->>'max_payload')::NUMERIC,
            p_ext_data->>'fuel_type',
            p_ext_data->>'vehicle_type',
            NOW()
        )
        ON CONFLICT (vehicle_id) DO UPDATE SET
            max_payload = EXCLUDED.max_payload,
            fuel_type = EXCLUDED.fuel_type,
            vehicle_type = EXCLUDED.vehicle_type,
            updated_at = NOW();
    END IF;

    -- 5. Log Event
    INSERT INTO event_logs (decision_id, state_after, table_name)
    VALUES (v_decision_id, p_core_data || p_ext_data, p_table_name);
END;
$$;

-- 6. RLS Policies
ALTER TABLE master_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE logistics_vehicle_attrs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read for authenticated" ON master_vehicles;
CREATE POLICY "Enable read for authenticated" ON master_vehicles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable read for authenticated" ON logistics_vehicle_attrs;
CREATE POLICY "Enable read for authenticated" ON logistics_vehicle_attrs FOR SELECT TO authenticated USING (true);

-- RPC Permission
GRANT EXECUTE ON FUNCTION rpc_execute_master_update TO authenticated;
-- ==========================================
-- Phase 4.1: Vehicle Callsign (騾夂ｧｰ) Implementation
-- ==========================================

-- 1. Add 'callsign' to Core Layer
ALTER TABLE master_vehicles ADD COLUMN IF NOT EXISTS callsign TEXT;

-- 2. Update Compatibility View
CREATE OR REPLACE VIEW vehicles AS
SELECT 
    v.id,
    v.number,
    v.callsign, -- Added
    v.is_active,
    v.created_at,
    v.updated_at,
    a.max_payload,
    a.fuel_type,
    a.vehicle_type
FROM master_vehicles v
LEFT JOIN logistics_vehicle_attrs a ON v.id = a.vehicle_id;

-- 3. Update SDR Master Update RPC (Handling callsign)
CREATE OR REPLACE FUNCTION rpc_execute_master_update(
    p_table_name TEXT,
    p_id UUID,
    p_core_data JSONB,
    p_ext_data JSONB,
    p_decision_type TEXT,
    p_reason TEXT,
    p_user_id TEXT
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_proposal_id UUID;
    v_decision_id UUID;
BEGIN
    -- 1. Record Proposal
    INSERT INTO decision_proposals (status, proposed_data, reason_description, applicant_id, reviewed_at, reviewed_by)
    VALUES ('approved', p_core_data || p_ext_data, p_reason, p_user_id, NOW(), p_user_id)
    RETURNING proposal_id INTO v_proposal_id;

    -- 2. Record Decision
    INSERT INTO decisions (proposal_id, decision_type, actor_id)
    VALUES (v_proposal_id, p_decision_type, p_user_id)
    RETURNING decision_id INTO v_decision_id;

    -- 3. Update Core (master_vehicles)
    IF p_table_name = 'vehicles' THEN
        INSERT INTO master_vehicles (id, number, callsign, is_active, updated_at)
        VALUES (
            COALESCE(p_id, gen_random_uuid()),
            p_core_data->>'number',
            p_core_data->>'callsign', -- New field
            COALESCE((p_core_data->>'is_active')::BOOLEAN, true),
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            number = EXCLUDED.number,
            callsign = EXCLUDED.callsign, -- Updated field
            is_active = EXCLUDED.is_active,
            updated_at = NOW()
        RETURNING id INTO p_id;

        -- 4. Update Extension (logistics_vehicle_attrs)
        INSERT INTO logistics_vehicle_attrs (vehicle_id, max_payload, fuel_type, vehicle_type, updated_at)
        VALUES (
            p_id,
            (p_ext_data->>'max_payload')::NUMERIC,
            p_ext_data->>'fuel_type',
            p_ext_data->>'vehicle_type',
            NOW()
        )
        ON CONFLICT (vehicle_id) DO UPDATE SET
            max_payload = EXCLUDED.max_payload,
            fuel_type = EXCLUDED.fuel_type,
            vehicle_type = EXCLUDED.vehicle_type,
            updated_at = NOW();
    END IF;

    -- 5. Log Event
    INSERT INTO event_logs (decision_id, state_after, table_name)
    VALUES (v_decision_id, p_core_data || p_ext_data, p_table_name);
END;
$$;
-- ==========================================
-- Phase 5: Generalized Master RPC & Schema Polish
-- ==========================================

-- 1. Ensure updated_at exists for all masters
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE master_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE master_collection_points ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Define robust generalized RPC
CREATE OR REPLACE FUNCTION rpc_execute_master_update(
    p_table_name TEXT,
    p_id TEXT DEFAULT NULL, 
    p_core_data JSONB DEFAULT '{}'::JSONB,
    p_ext_data JSONB DEFAULT '{}'::JSONB,
    p_decision_type TEXT DEFAULT 'MASTER_UPDATE',
    p_reason TEXT DEFAULT 'No reason provided',
    p_user_id TEXT DEFAULT NULL
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_proposal_id UUID;
    v_target_id_uuid UUID;
    v_target_id_text TEXT;
BEGIN
    -- [A] Target ID Normalization
    -- UUID: vehicles, items(master_items), users(profiles)
    -- TEXT: points(master_collection_points), drivers
    
    IF p_table_name IN ('vehicles', 'items', 'users') THEN
        v_target_id_uuid := CASE WHEN p_id IS NOT NULL AND p_id <> '' THEN CAST(p_id AS UUID) ELSE gen_random_uuid() END;
        v_target_id_text := v_target_id_uuid::TEXT;
    ELSE
        v_target_id_text := CASE WHEN p_id IS NOT NULL AND p_id <> '' THEN p_id ELSE gen_random_uuid()::TEXT END;
    END IF;

    -- [B] SDR Auditing
    INSERT INTO decision_proposals (proposal_type, status, proposed_value, reason, proposer_id, target_id)
    VALUES (p_decision_type, 'APPROVED', (COALESCE(p_core_data, '{}'::JSONB) || COALESCE(p_ext_data, '{}'::JSONB)), p_reason, p_user_id, v_target_id_text)
    RETURNING id INTO v_proposal_id;

    INSERT INTO decisions (proposal_id, decision, decider_id)
    VALUES (v_proposal_id, 'APPROVED', p_user_id);

    -- [C] Table Updates
    
    -- 1. VEHICLES
    IF p_table_name = 'vehicles' THEN
        INSERT INTO master_vehicles (id, number, callsign, is_active, updated_at)
        VALUES (
            v_target_id_uuid,
            p_core_data->>'number',
            p_core_data->>'callsign',
            COALESCE((p_core_data->>'is_active')::BOOLEAN, true),
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            number = EXCLUDED.number,
            callsign = EXCLUDED.callsign,
            is_active = EXCLUDED.is_active,
            updated_at = NOW();

        INSERT INTO logistics_vehicle_attrs (vehicle_id, max_payload, fuel_type, vehicle_type, updated_at)
        VALUES (
            v_target_id_uuid,
            (p_ext_data->>'max_payload')::NUMERIC,
            p_ext_data->>'fuel_type',
            p_ext_data->>'vehicle_type',
            NOW()
        )
        ON CONFLICT (vehicle_id) DO UPDATE SET
            max_payload = EXCLUDED.max_payload,
            fuel_type = EXCLUDED.fuel_type,
            vehicle_type = EXCLUDED.vehicle_type,
            updated_at = NOW();

    -- 2. ITEMS
    ELSIF p_table_name = 'items' THEN
        INSERT INTO master_items (id, name, unit, display_order, is_active, updated_at)
        VALUES (
            v_target_id_uuid,
            p_core_data->>'name',
            p_core_data->>'unit',
            COALESCE((p_core_data->>'display_order')::INTEGER, 0),
            COALESCE((p_core_data->>'is_active')::BOOLEAN, true),
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            unit = EXCLUDED.unit,
            display_order = EXCLUDED.display_order,
            is_active = EXCLUDED.is_active,
            updated_at = NOW();

    -- 3. POINTS (Collection Points)
    ELSIF p_table_name = 'points' THEN
        INSERT INTO master_collection_points (location_id, name, address, contractor_id, note, is_active, updated_at)
        VALUES (
            v_target_id_text,
            p_core_data->>'name',
            p_core_data->>'address',
            p_core_data->>'contractor_id',
            p_core_data->>'note',
            COALESCE((p_core_data->>'is_active')::BOOLEAN, true),
            NOW()
        )
        ON CONFLICT (location_id) DO UPDATE SET
            name = EXCLUDED.name,
            address = EXCLUDED.address,
            contractor_id = EXCLUDED.contractor_id,
            note = EXCLUDED.note,
            is_active = EXCLUDED.is_active,
            updated_at = NOW();

    -- 4. DRIVERS
    ELSIF p_table_name = 'drivers' THEN
        INSERT INTO drivers (id, driver_name, display_order, user_id, updated_at)
        VALUES (
            v_target_id_text,
            p_core_data->>'driver_name',
            COALESCE((p_core_data->>'display_order')::INTEGER, 999),
            p_core_data->>'user_id',
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            driver_name = EXCLUDED.driver_name,
            display_order = EXCLUDED.display_order,
            user_id = EXCLUDED.user_id,
            updated_at = NOW();

    -- 5. USERS (Profiles)
    ELSIF p_table_name = 'users' THEN
        INSERT INTO profiles (id, name, role, vehicle_info, updated_at)
        VALUES (
            v_target_id_uuid,
            p_core_data->>'name',
            p_core_data->>'role',
            p_core_data->>'vehicle_info',
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            role = EXCLUDED.role,
            vehicle_info = EXCLUDED.vehicle_info,
            updated_at = NOW();
    END IF;
END;
$$;

-- 3. Final Permissions Consistency
GRANT EXECUTE ON FUNCTION rpc_execute_master_update TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_execute_master_update TO anon;
NOTIFY pgrst, 'reload schema';
-- ==========================================
-- EMERGENCY FULL RECOVERY: Core/Ext + RPC Fix
-- ==========================================

-- 1. Ensure Core/Extension Tables Exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vehicles' AND table_type = 'BASE TABLE') THEN
        ALTER TABLE vehicles RENAME TO master_vehicles;
    END IF;
END $$;

ALTER TABLE master_vehicles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE master_vehicles ADD COLUMN IF NOT EXISTS callsign TEXT;
ALTER TABLE master_vehicles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS logistics_vehicle_attrs (
    vehicle_id UUID PRIMARY KEY REFERENCES master_vehicles(id) ON DELETE CASCADE,
    max_payload NUMERIC,
    fuel_type TEXT,
    vehicle_type TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Ensure Compatibility View
CREATE OR REPLACE VIEW vehicles AS
SELECT 
    v.id,
    v.number,
    v.callsign,
    v.is_active,
    v.created_at,
    v.updated_at,
    a.max_payload,
    a.fuel_type,
    a.vehicle_type
FROM master_vehicles v
LEFT JOIN logistics_vehicle_attrs a ON v.id = a.vehicle_id;

-- 3. Clean up old function signatures
DROP FUNCTION IF EXISTS rpc_execute_master_update(TEXT, UUID, JSONB, JSONB, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS rpc_execute_master_update(TEXT, TEXT, JSONB, JSONB, TEXT, TEXT, TEXT);

-- 4. Unified Robust RPC (Aligned with SDR Schema)
CREATE OR REPLACE FUNCTION rpc_execute_master_update(
    p_table_name TEXT,
    p_id TEXT DEFAULT NULL, 
    p_core_data JSONB DEFAULT '{}'::JSONB,
    p_ext_data JSONB DEFAULT '{}'::JSONB,
    p_decision_type TEXT DEFAULT 'MASTER_UPDATE',
    p_reason TEXT DEFAULT 'No reason provided',
    p_user_id TEXT DEFAULT NULL
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_proposal_id UUID;
    v_target_id UUID;
BEGIN
    -- Cast target ID
    v_target_id := CASE WHEN p_id IS NOT NULL AND p_id <> '' THEN CAST(p_id AS UUID) ELSE gen_random_uuid() END;

    -- A. Record Proposal (Using actual schema: proposal_type, status, proposed_value, reason, proposer_id)
    INSERT INTO decision_proposals (proposal_type, status, proposed_value, reason, proposer_id, target_id)
    VALUES (p_decision_type, 'APPROVED', p_core_data || p_ext_data, p_reason, p_user_id, v_target_id::TEXT)
    RETURNING id INTO v_proposal_id;

    -- B. Record Decision (Using actual schema: proposal_id, decision, decider_id)
    INSERT INTO decisions (proposal_id, decision, decider_id)
    VALUES (v_proposal_id, 'APPROVED', p_user_id);

    -- C. Update Core (master_vehicles)
    IF p_table_name = 'vehicles' THEN
        INSERT INTO master_vehicles (id, number, callsign, is_active, updated_at)
        VALUES (
            v_target_id,
            p_core_data->>'number',
            p_core_data->>'callsign',
            COALESCE((p_core_data->>'is_active')::BOOLEAN, true),
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            number = EXCLUDED.number,
            callsign = EXCLUDED.callsign,
            is_active = EXCLUDED.is_active,
            updated_at = NOW();

        -- D. Update Extension (logistics_vehicle_attrs)
        INSERT INTO logistics_vehicle_attrs (vehicle_id, max_payload, fuel_type, vehicle_type, updated_at)
        VALUES (
            v_target_id,
            (p_ext_data->>'max_payload')::NUMERIC,
            p_ext_data->>'fuel_type',
            p_ext_data->>'vehicle_type',
            NOW()
        )
        ON CONFLICT (vehicle_id) DO UPDATE SET
            max_payload = EXCLUDED.max_payload,
            fuel_type = EXCLUDED.fuel_type,
            vehicle_type = EXCLUDED.vehicle_type,
            updated_at = NOW();
    END IF;
END;
$$;

-- 5. Final Permission Check
GRANT EXECUTE ON FUNCTION rpc_execute_master_update TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_execute_master_update TO anon;

-- Force Cache Refresh
NOTIFY pgrst, 'reload schema';
-- ==========================================
-- Repair: Create missing view_master_drivers
-- ==========================================

CREATE OR REPLACE VIEW public.view_master_drivers AS
SELECT 
    p.id,
    p.name,
    p.role,
    p.vehicle_info,
    p.updated_at,
    p.is_active,
    d.display_order,
    d.mobile_phone,
    v.vehicle_name
FROM 
    profiles p
LEFT JOIN 
    drivers d ON p.id::text = d.user_id::text
LEFT JOIN 
    master_vehicles v ON d.id::text = v.id::text OR p.vehicle_info = v.vehicle_name
WHERE 
    p.role IN ('driver', 'DRIVER');

GRANT SELECT ON public.view_master_drivers TO authenticated;
GRANT SELECT ON public.view_master_drivers TO anon;
-- ==========================================
-- Phase 7: Refine Vehicle Master Structure
-- 1. Remove display_order
-- 2. Add empty_vehicle_weight
-- 3. Redefine View
-- ==========================================

-- 1. DROP COLUMN display_order from Core
ALTER TABLE master_vehicles DROP COLUMN IF EXISTS display_order;

-- 2. ADD empty_vehicle_weight to Extension
ALTER TABLE logistics_vehicle_attrs ADD COLUMN IF NOT EXISTS empty_vehicle_weight NUMERIC;

-- 3. Redefine vehicles View (Integration Layer)
CREATE OR REPLACE VIEW vehicles AS
SELECT 
    v.id,
    v.number,
    v.callsign,
    v.is_active,
    v.created_at,
    v.updated_at,
    a.max_payload,
    a.empty_vehicle_weight,
    a.fuel_type,
    a.vehicle_type
FROM master_vehicles v
LEFT JOIN logistics_vehicle_attrs a ON v.id = a.vehicle_id;

-- 4. Reload Schema for PostgREST
NOTIFY pgrst, 'reload schema';
CREATE OR REPLACE VIEW public.view_master_points AS
SELECT 
    p.location_id as id,
    p.name,
    p.address,
    p.note,
    p.is_active,
    p.contractor_id,
    c.name as contractor_name,
    c.payee_id,
    py.name as payee_name,
    p.created_at,
    p.updated_at
FROM 
    master_collection_points p
LEFT JOIN 
    master_contractors c ON p.contractor_id = c.contractor_id
LEFT JOIN 
    master_payees py ON c.payee_id = py.payee_id;

GRANT SELECT ON public.view_master_points TO authenticated;
GRANT SELECT ON public.view_master_points TO anon;
-- ==========================================
-- RESTORE GENERALIZED MASTER RPC (Corrected Version)
-- ==========================================

-- 1. Drop restricted version from Phase 18
DROP FUNCTION IF EXISTS rpc_execute_master_update(TEXT, TEXT, JSONB, JSONB, TEXT, TEXT, TEXT);

-- 2. Restore all-masters support with type safety
CREATE OR REPLACE FUNCTION rpc_execute_master_update(
    p_table_name TEXT,
    p_id TEXT DEFAULT NULL, 
    p_core_data JSONB DEFAULT '{}'::JSONB,
    p_ext_data JSONB DEFAULT '{}'::JSONB,
    p_decision_type TEXT DEFAULT 'MASTER_UPDATE',
    p_reason TEXT DEFAULT 'No reason provided',
    p_user_id TEXT DEFAULT NULL
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_proposal_id UUID;
    v_target_id_uuid UUID;
    v_target_id_text TEXT;
BEGIN
    -- [A] ID Normalization
    -- UUID: vehicles, items(master_items), users(profiles)
    -- TEXT: points(master_collection_points), drivers
    
    IF p_table_name IN ('vehicles', 'items', 'users') THEN
        v_target_id_uuid := CASE WHEN p_id IS NOT NULL AND p_id <> '' THEN CAST(p_id AS UUID) ELSE gen_random_uuid() END;
        v_target_id_text := v_target_id_uuid::TEXT;
    ELSE
        v_target_id_text := CASE WHEN p_id IS NOT NULL AND p_id <> '' THEN p_id ELSE gen_random_uuid()::TEXT END;
    END IF;

    -- [B] SDR Auditing (Records all attempts)
    INSERT INTO decision_proposals (proposal_type, status, proposed_value, reason, proposer_id, target_id)
    VALUES (p_decision_type, 'APPROVED', (COALESCE(p_core_data, '{}'::JSONB) || COALESCE(p_ext_data, '{}'::JSONB)), p_reason, p_user_id, v_target_id_text)
    RETURNING id INTO v_proposal_id;

    INSERT INTO decisions (proposal_id, decision, decider_id)
    VALUES (v_proposal_id, 'APPROVED', p_user_id);

    -- [C] Core Logic
    
    -- 1. VEHICLES
    IF p_table_name = 'vehicles' THEN
        INSERT INTO master_vehicles (id, number, callsign, is_active, updated_at)
        VALUES (
            v_target_id_uuid,
            p_core_data->>'number',
            p_core_data->>'callsign',
            COALESCE((p_core_data->>'is_active')::BOOLEAN, true),
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            number = EXCLUDED.number,
            callsign = EXCLUDED.callsign,
            is_active = EXCLUDED.is_active,
            updated_at = NOW();

        INSERT INTO logistics_vehicle_attrs (vehicle_id, max_payload, fuel_type, vehicle_type, updated_at)
        VALUES (
            v_target_id_uuid,
            (p_ext_data->>'max_payload')::NUMERIC,
            p_ext_data->>'fuel_type',
            p_ext_data->>'vehicle_type',
            NOW()
        )
        ON CONFLICT (vehicle_id) DO UPDATE SET
            max_payload = EXCLUDED.max_payload,
            fuel_type = EXCLUDED.fuel_type,
            vehicle_type = EXCLUDED.vehicle_type,
            updated_at = NOW();

    -- 2. ITEMS
    ELSIF p_table_name = 'items' THEN
        INSERT INTO master_items (id, name, unit, display_order, is_active, updated_at)
        VALUES (
            v_target_id_uuid,
            p_core_data->>'name',
            p_core_data->>'unit',
            COALESCE((p_core_data->>'display_order')::INTEGER, 0),
            COALESCE((p_core_data->>'is_active')::BOOLEAN, true),
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            unit = EXCLUDED.unit,
            display_order = EXCLUDED.display_order,
            is_active = EXCLUDED.is_active,
            updated_at = NOW();

    -- 3. POINTS (Collection Points)
    ELSIF p_table_name = 'points' THEN
        INSERT INTO master_collection_points (location_id, name, address, contractor_id, note, is_active, updated_at)
        VALUES (
            v_target_id_text,
            p_core_data->>'name',
            p_core_data->>'address',
            p_core_data->>'contractor_id',
            p_core_data->>'note',
            COALESCE((p_core_data->>'is_active')::BOOLEAN, true),
            NOW()
        )
        ON CONFLICT (location_id) DO UPDATE SET
            name = EXCLUDED.name,
            address = EXCLUDED.address,
            contractor_id = EXCLUDED.contractor_id,
            note = EXCLUDED.note,
            is_active = EXCLUDED.is_active,
            updated_at = NOW();

    -- 4. DRIVERS
    ELSIF p_table_name = 'drivers' THEN
        INSERT INTO drivers (id, driver_name, display_order, user_id, updated_at)
        VALUES (
            v_target_id_text,
            p_core_data->>'name', -- mapping from front-end 'name'
            COALESCE((p_core_data->>'display_order')::INTEGER, 999),
            p_core_data->>'user_id',
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            driver_name = EXCLUDED.driver_name,
            display_order = EXCLUDED.display_order,
            user_id = EXCLUDED.user_id,
            updated_at = NOW();

    -- 5. USERS (Profiles)
    ELSIF p_table_name = 'users' THEN
        INSERT INTO profiles (id, name, role, vehicle_info, updated_at)
        VALUES (
            v_target_id_uuid,
            p_core_data->>'name',
            p_core_data->>'role',
            p_core_data->>'vehicle_info',
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            role = EXCLUDED.role,
            vehicle_info = EXCLUDED.vehicle_info,
            updated_at = NOW();
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION rpc_execute_master_update TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_execute_master_update TO anon;
NOTIFY pgrst, 'reload schema';
-- ==========================================
-- RESTORE GENERALIZED MASTER RPC (Aligned & Robust)
-- ==========================================

-- 1. Drop existing versions to avoid conflicts
DROP FUNCTION IF EXISTS rpc_execute_master_update(TEXT, TEXT, JSONB, JSONB, TEXT, TEXT, TEXT);

-- 2. Define robust generalized RPC
CREATE OR REPLACE FUNCTION rpc_execute_master_update(
    p_table_name TEXT,
    p_id TEXT DEFAULT NULL, 
    p_core_data JSONB DEFAULT '{}'::JSONB,
    p_ext_data JSONB DEFAULT '{}'::JSONB,
    p_decision_type TEXT DEFAULT 'MASTER_UPDATE',
    p_reason TEXT DEFAULT 'No reason provided',
    p_user_id TEXT DEFAULT NULL
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_proposal_id UUID;
    v_target_id_uuid UUID;
    v_target_id_text TEXT;
BEGIN
    -- [A] ID Normalization & Casting
    -- We must ensure we ONLY cast to UUID when the table actually uses it.
    -- v_target_id_text always prepared as fallback/audit target.
    
    IF p_table_name IN ('vehicles', 'items', 'users') THEN
        v_target_id_uuid := CASE WHEN p_id IS NOT NULL AND p_id <> '' THEN CAST(p_id AS UUID) ELSE gen_random_uuid() END;
        v_target_id_text := v_target_id_uuid::TEXT;
    ELSE
        -- For 'drivers' and 'points', we keep as TEXT. 
        -- If no ID, generate a unique text ID (or handle as UUID string if preferred by schema)
        v_target_id_text := CASE WHEN p_id IS NOT NULL AND p_id <> '' THEN p_id ELSE gen_random_uuid()::TEXT END;
    END IF;

    -- [B] SDR Auditing
    -- target_id in decision_proposals is TEXT, so it accepts alphabetical IDs like 'driver1'.
    INSERT INTO decision_proposals (proposal_type, status, proposed_value, reason, proposer_id, target_id)
    VALUES (p_decision_type, 'APPROVED', (COALESCE(p_core_data, '{}'::JSONB) || COALESCE(p_ext_data, '{}'::JSONB)), p_reason, p_user_id, v_target_id_text)
    RETURNING id INTO v_proposal_id;

    INSERT INTO decisions (proposal_id, decision, decider_id)
    VALUES (v_proposal_id, 'APPROVED', p_user_id);

    -- [C] Core Logic
    
    -- 1. VEHICLES
    IF p_table_name = 'vehicles' THEN
        INSERT INTO master_vehicles (id, number, callsign, is_active, updated_at)
        VALUES (
            v_target_id_uuid,
            p_core_data->>'number',
            p_core_data->>'callsign',
            COALESCE((p_core_data->>'is_active')::BOOLEAN, true),
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            number = EXCLUDED.number,
            callsign = EXCLUDED.callsign,
            is_active = EXCLUDED.is_active,
            updated_at = NOW();

        INSERT INTO logistics_vehicle_attrs (vehicle_id, max_payload, fuel_type, vehicle_type, updated_at)
        VALUES (
            v_target_id_uuid,
            (p_ext_data->>'max_payload')::NUMERIC,
            p_ext_data->>'fuel_type',
            p_ext_data->>'vehicle_type',
            NOW()
        )
        ON CONFLICT (vehicle_id) DO UPDATE SET
            max_payload = EXCLUDED.max_payload,
            fuel_type = EXCLUDED.fuel_type,
            vehicle_type = EXCLUDED.vehicle_type,
            updated_at = NOW();

    -- 2. ITEMS
    ELSIF p_table_name = 'items' THEN
        INSERT INTO master_items (id, name, unit, display_order, is_active, updated_at)
        VALUES (
            v_target_id_uuid,
            p_core_data->>'name',
            p_core_data->>'unit',
            COALESCE((p_core_data->>'display_order')::INTEGER, 0),
            COALESCE((p_core_data->>'is_active')::BOOLEAN, true),
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            unit = EXCLUDED.unit,
            display_order = EXCLUDED.display_order,
            is_active = EXCLUDED.is_active,
            updated_at = NOW();

    -- 3. POINTS (Collection Points)
    ELSIF p_table_name = 'points' THEN
        INSERT INTO master_collection_points (location_id, name, address, contractor_id, note, is_active, updated_at)
        VALUES (
            v_target_id_text,
            p_core_data->>'name',
            p_core_data->>'address',
            p_core_data->>'contractor_id',
            p_core_data->>'note',
            COALESCE((p_core_data->>'is_active')::BOOLEAN, true),
            NOW()
        )
        ON CONFLICT (location_id) DO UPDATE SET
            name = EXCLUDED.name,
            address = EXCLUDED.address,
            contractor_id = EXCLUDED.contractor_id,
            note = EXCLUDED.note,
            is_active = EXCLUDED.is_active,
            updated_at = NOW();

    -- 4. DRIVERS
    ELSIF p_table_name = 'drivers' THEN
        INSERT INTO drivers (id, driver_name, display_order, user_id, updated_at)
        VALUES (
            v_target_id_text,
            COALESCE(p_core_data->>'name', p_core_data->>'driver_name'), -- frontend uses 'name'
            COALESCE((p_core_data->>'display_order')::INTEGER, 999),
            p_core_data->>'user_id',
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            driver_name = EXCLUDED.driver_name,
            display_order = EXCLUDED.display_order,
            user_id = EXCLUDED.user_id,
            updated_at = NOW();

    -- 5. USERS (Profiles)
    ELSIF p_table_name = 'users' THEN
        INSERT INTO profiles (id, name, role, vehicle_info, updated_at)
        VALUES (
            v_target_id_uuid,
            p_core_data->>'name',
            p_core_data->>'role',
            p_core_data->>'vehicle_info',
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            role = EXCLUDED.role,
            vehicle_info = EXCLUDED.vehicle_info,
            updated_at = NOW();
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION rpc_execute_master_update TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_execute_master_update TO anon;
NOTIFY pgrst, 'reload schema';
-- ==========================================
-- RESTORE GENERALIZED MASTER RPC (Deep Recovery)
-- ==========================================

-- 1. Comprehensive Cleanup (Drop all possible signatures)
DROP FUNCTION IF EXISTS rpc_execute_master_update(TEXT, TEXT, JSONB, JSONB, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS rpc_execute_master_update(TEXT, UUID, JSONB, JSONB, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS rpc_execute_master_update(TEXT, TEXT, JSONB, JSONB, TEXT, TEXT);
DROP FUNCTION IF EXISTS rpc_execute_master_update(TEXT, TEXT, JSONB, JSONB);

-- 2. Define robust generalized RPC
CREATE OR REPLACE FUNCTION rpc_execute_master_update(
    p_table_name TEXT,
    p_id TEXT DEFAULT NULL, 
    p_core_data JSONB DEFAULT '{}'::JSONB,
    p_ext_data JSONB DEFAULT '{}'::JSONB,
    p_decision_type TEXT DEFAULT 'MASTER_UPDATE',
    p_reason TEXT DEFAULT 'No reason provided',
    p_user_id TEXT DEFAULT NULL
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_proposal_id UUID;
    v_target_id_uuid UUID;
    v_target_id_text TEXT;
BEGIN
    -- [A] ID Normalization
    -- We convert EVERYTHING to TEXT for decision_proposals
    v_target_id_text := CASE WHEN p_id IS NOT NULL AND p_id <> '' THEN p_id ELSE gen_random_uuid()::TEXT END;

    -- [B] SDR Auditing
    INSERT INTO decision_proposals (proposal_type, status, proposed_value, reason, proposer_id, target_id)
    VALUES (p_decision_type, 'APPROVED', (COALESCE(p_core_data, '{}'::JSONB) || COALESCE(p_ext_data, '{}'::JSONB)), p_reason, p_user_id, v_target_id_text)
    RETURNING id INTO v_proposal_id;

    INSERT INTO decisions (proposal_id, decision, decider_id)
    VALUES (v_proposal_id, 'APPROVED', p_user_id);

    -- [C] Core Logic (Per-Table handling of Casting)
    
    -- 1. VEHICLES
    IF p_table_name = 'vehicles' THEN
        -- Safely cast to UUID for this table
        v_target_id_uuid := CASE WHEN v_target_id_text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN v_target_id_text::UUID ELSE gen_random_uuid() END;
        
        INSERT INTO master_vehicles (id, number, callsign, is_active, updated_at)
        VALUES (
            v_target_id_uuid,
            p_core_data->>'number',
            p_core_data->>'callsign',
            COALESCE((p_core_data->>'is_active')::BOOLEAN, true),
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            number = EXCLUDED.number,
            callsign = EXCLUDED.callsign,
            is_active = EXCLUDED.is_active,
            updated_at = NOW();

        INSERT INTO logistics_vehicle_attrs (vehicle_id, max_payload, fuel_type, vehicle_type, updated_at)
        VALUES (
            v_target_id_uuid,
            (p_ext_data->>'max_payload')::NUMERIC,
            p_ext_data->>'fuel_type',
            p_ext_data->>'vehicle_type',
            NOW()
        )
        ON CONFLICT (vehicle_id) DO UPDATE SET
            max_payload = EXCLUDED.max_payload,
            fuel_type = EXCLUDED.fuel_type,
            vehicle_type = EXCLUDED.vehicle_type,
            updated_at = NOW();

    -- 2. ITEMS
    ELSIF p_table_name = 'items' THEN
        v_target_id_uuid := CASE WHEN v_target_id_text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN v_target_id_text::UUID ELSE gen_random_uuid() END;

        INSERT INTO master_items (id, name, unit, display_order, is_active, updated_at)
        VALUES (
            v_target_id_uuid,
            p_core_data->>'name',
            p_core_data->>'unit',
            COALESCE((p_core_data->>'display_order')::INTEGER, 0),
            COALESCE((p_core_data->>'is_active')::BOOLEAN, true),
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            unit = EXCLUDED.unit,
            display_order = EXCLUDED.display_order,
            is_active = EXCLUDED.is_active,
            updated_at = NOW();

    -- 3. POINTS (Collection Points)
    ELSIF p_table_name = 'points' THEN
        INSERT INTO master_collection_points (location_id, name, address, contractor_id, note, is_active, updated_at)
        VALUES (
            v_target_id_text,
            p_core_data->>'name',
            p_core_data->>'address',
            p_core_data->>'contractor_id',
            p_core_data->>'note',
            COALESCE((p_core_data->>'is_active')::BOOLEAN, true),
            NOW()
        )
        ON CONFLICT (location_id) DO UPDATE SET
            name = EXCLUDED.name,
            address = EXCLUDED.address,
            contractor_id = EXCLUDED.contractor_id,
            note = EXCLUDED.note,
            is_active = EXCLUDED.is_active,
            updated_at = NOW();

    -- 4. DRIVERS
    ELSIF p_table_name = 'drivers' THEN
        INSERT INTO drivers (id, driver_name, display_order, user_id, updated_at)
        VALUES (
            v_target_id_text,
            COALESCE(p_core_data->>'name', p_core_data->>'driver_name'),
            COALESCE((p_core_data->>'display_order')::INTEGER, 999),
            p_core_data->>'user_id',
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            driver_name = EXCLUDED.driver_name,
            display_order = EXCLUDED.display_order,
            user_id = EXCLUDED.user_id,
            updated_at = NOW();

    -- 5. USERS (Profiles)
    ELSIF p_table_name = 'users' THEN
        v_target_id_uuid := CASE WHEN v_target_id_text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN v_target_id_text::UUID ELSE gen_random_uuid() END;

        INSERT INTO profiles (id, name, role, vehicle_info, updated_at)
        VALUES (
            v_target_id_uuid::TEXT, -- Profiles.id is TEXT in many schemas but can be UUID
            p_core_data->>'name',
            p_core_data->>'role',
            p_core_data->>'vehicle_info',
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            role = EXCLUDED.role,
            vehicle_info = EXCLUDED.vehicle_info,
            updated_at = NOW();
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION rpc_execute_master_update TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_execute_master_update TO anon;
NOTIFY pgrst, 'reload schema';
-- ==========================================
-- RESTORE GENERALIZED MASTER RPC (Force Recovery)
-- ==========================================

-- 1. Aggressive Cleanup
DROP FUNCTION IF EXISTS public.rpc_execute_master_update(text, text, jsonb, jsonb, text, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.rpc_execute_master_update(text, text, jsonb, jsonb, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.rpc_execute_master_update(text, text, jsonb, jsonb, text) CASCADE;
DROP FUNCTION IF EXISTS public.rpc_execute_master_update(text, text, jsonb, jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.rpc_execute_master_update(text, text, jsonb) CASCADE;

-- 2. Define robust generalized RPC
CREATE OR REPLACE FUNCTION public.rpc_execute_master_update(
    p_table_name text,
    p_id text DEFAULT NULL, 
    p_core_data jsonb DEFAULT '{}'::jsonb,
    p_ext_data jsonb DEFAULT '{}'::jsonb,
    p_decision_type text DEFAULT 'MASTER_UPDATE',
    p_reason text DEFAULT 'No reason provided',
    p_user_id text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_proposal_id uuid;
    v_target_id_uuid uuid;
    v_target_id_text text;
BEGIN
    -- [A] ID Normalization
    v_target_id_text := CASE WHEN p_id IS NOT NULL AND p_id <> '' THEN p_id ELSE gen_random_uuid()::text END;

    -- [B] SDR Auditing
    INSERT INTO public.decision_proposals (proposal_type, status, proposed_value, reason, proposer_id, target_id)
    VALUES (p_decision_type, 'APPROVED', (COALESCE(p_core_data, '{}'::jsonb) || COALESCE(p_ext_data, '{}'::jsonb)), p_reason, p_user_id, v_target_id_text)
    RETURNING id INTO v_proposal_id;

    INSERT INTO public.decisions (proposal_id, decision, decider_id)
    VALUES (v_proposal_id, 'APPROVED', p_user_id);

    -- [C] Core Logic
    
    -- 1. VEHICLES
    IF p_table_name = 'vehicles' THEN
        v_target_id_uuid := CASE WHEN v_target_id_text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN v_target_id_text::uuid ELSE gen_random_uuid() END;
        
        INSERT INTO public.master_vehicles (id, number, callsign, is_active, updated_at)
        VALUES (
            v_target_id_uuid,
            p_core_data->>'number',
            p_core_data->>'callsign',
            COALESCE((p_core_data->>'is_active')::boolean, true),
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            number = EXCLUDED.number,
            callsign = EXCLUDED.callsign,
            is_active = EXCLUDED.is_active,
            updated_at = NOW();

        INSERT INTO public.logistics_vehicle_attrs (vehicle_id, max_payload, fuel_type, vehicle_type, updated_at)
        VALUES (
            v_target_id_uuid,
            (p_ext_data->>'max_payload')::numeric,
            p_ext_data->>'fuel_type',
            p_ext_data->>'vehicle_type',
            NOW()
        )
        ON CONFLICT (vehicle_id) DO UPDATE SET
            max_payload = EXCLUDED.max_payload,
            fuel_type = EXCLUDED.fuel_type,
            vehicle_type = EXCLUDED.vehicle_type,
            updated_at = NOW();

    -- 2. ITEMS
    ELSIF p_table_name = 'items' THEN
        v_target_id_uuid := CASE WHEN v_target_id_text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN v_target_id_text::uuid ELSE gen_random_uuid() END;

        INSERT INTO public.master_items (id, name, unit, display_order, is_active, updated_at)
        VALUES (
            v_target_id_uuid,
            p_core_data->>'name',
            p_core_data->>'unit',
            COALESCE((p_core_data->>'display_order')::integer, 0),
            COALESCE((p_core_data->>'is_active')::boolean, true),
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            unit = EXCLUDED.unit,
            display_order = EXCLUDED.display_order,
            is_active = EXCLUDED.is_active,
            updated_at = NOW();

    -- 3. POINTS (Collection Points)
    ELSIF p_table_name = 'points' THEN
        INSERT INTO public.master_collection_points (location_id, name, address, contractor_id, note, is_active, updated_at)
        VALUES (
            v_target_id_text,
            p_core_data->>'name',
            p_core_data->>'address',
            p_core_data->>'contractor_id',
            p_core_data->>'note',
            COALESCE((p_core_data->>'is_active')::boolean, true),
            NOW()
        )
        ON CONFLICT (location_id) DO UPDATE SET
            name = EXCLUDED.name,
            address = EXCLUDED.address,
            contractor_id = EXCLUDED.contractor_id,
            note = EXCLUDED.note,
            is_active = EXCLUDED.is_active,
            updated_at = NOW();

    -- 4. DRIVERS
    ELSIF p_table_name = 'drivers' THEN
        INSERT INTO public.drivers (id, driver_name, display_order, user_id, updated_at)
        VALUES (
            v_target_id_text,
            COALESCE(p_core_data->>'name', p_core_data->>'driver_name'),
            COALESCE((p_core_data->>'display_order')::integer, 999),
            p_core_data->>'user_id',
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            driver_name = EXCLUDED.driver_name,
            display_order = EXCLUDED.display_order,
            user_id = EXCLUDED.user_id,
            updated_at = NOW();

    -- 5. USERS (Profiles)
    ELSIF p_table_name = 'users' THEN
        v_target_id_text := v_target_id_text::text; -- Profiles can be text IDs
        INSERT INTO public.profiles (id, name, role, vehicle_info, updated_at)
        VALUES (
            v_target_id_text,
            p_core_data->>'name',
            p_core_data->>'role',
            p_core_data->>'vehicle_info',
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            role = EXCLUDED.role,
            vehicle_info = EXCLUDED.vehicle_info,
            updated_at = NOW();
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_execute_master_update TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_execute_master_update TO anon;
GRANT EXECUTE ON FUNCTION public.rpc_execute_master_update TO service_role;
NOTIFY pgrst, 'reload schema';
-- Ensure view_master_points exists and is correctly structured
DROP VIEW IF EXISTS public.view_master_points CASCADE;

CREATE OR REPLACE VIEW public.view_master_points AS
SELECT 
    p.location_id as id,
    p.name,
    p.address,
    p.note,
    p.is_active,
    p.contractor_id,
    c.name as contractor_name,
    c.payee_id,
    py.name as payee_name,
    p.created_at,
    p.updated_at
FROM 
    public.master_collection_points p
LEFT JOIN 
    public.master_contractors c ON p.contractor_id = c.contractor_id
LEFT JOIN 
    public.master_payees py ON c.payee_id = py.payee_id;

-- Grant permissions explicitly
GRANT SELECT ON public.view_master_points TO authenticated;
GRANT SELECT ON public.view_master_points TO anon;
GRANT SELECT ON public.view_master_points TO service_role;
-- ==========================================
-- RESTORE GENERALIZED MASTER RPC (v5 - Registration Fix)
-- ==========================================

-- 1. Aggressive Cleanup
DROP FUNCTION IF EXISTS public.rpc_execute_master_update(text, text, jsonb, jsonb, text, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.rpc_execute_master_update(text, text, jsonb, jsonb, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.rpc_execute_master_update(text, text, jsonb, jsonb, text) CASCADE;
DROP FUNCTION IF EXISTS public.rpc_execute_master_update(text, text, jsonb, jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.rpc_execute_master_update(text, text, jsonb) CASCADE;

-- 2. Define robust generalized RPC with logging
CREATE OR REPLACE FUNCTION public.rpc_execute_master_update(
    p_table_name text,
    p_id text DEFAULT NULL, 
    p_core_data jsonb DEFAULT '{}'::jsonb,
    p_ext_data jsonb DEFAULT '{}'::jsonb,
    p_decision_type text DEFAULT 'MASTER_UPDATE',
    p_reason text DEFAULT 'No reason provided',
    p_user_id text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_proposal_id uuid;
    v_target_id_uuid uuid;
    v_target_id_text text;
BEGIN
    -- Diagnostic Log
    RAISE NOTICE 'RPC Executed: table=%, id=%, user=%', p_table_name, p_id, p_user_id;

    -- [A] ID Normalization
    v_target_id_text := CASE WHEN p_id IS NOT NULL AND p_id <> '' THEN p_id ELSE gen_random_uuid()::text END;

    -- [B] SDR Auditing
    INSERT INTO public.decision_proposals (proposal_type, status, proposed_value, reason, proposer_id, target_id)
    VALUES (p_decision_type, 'APPROVED', (COALESCE(p_core_data, '{}'::jsonb) || COALESCE(p_ext_data, '{}'::jsonb)), p_reason, p_user_id, v_target_id_text)
    RETURNING id INTO v_proposal_id;

    INSERT INTO public.decisions (proposal_id, decision, decider_id)
    VALUES (v_proposal_id, 'APPROVED', p_user_id);

    -- [C] Core Logic
    
    -- 1. VEHICLES
    IF p_table_name = 'vehicles' THEN
        v_target_id_uuid := CASE WHEN v_target_id_text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN v_target_id_text::uuid ELSE gen_random_uuid() END;
        
        INSERT INTO public.master_vehicles (id, number, callsign, is_active, updated_at)
        VALUES (
            v_target_id_uuid,
            p_core_data->>'number',
            p_core_data->>'callsign',
            COALESCE((p_core_data->>'is_active')::boolean, true),
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            number = EXCLUDED.number,
            callsign = EXCLUDED.callsign,
            is_active = EXCLUDED.is_active,
            updated_at = NOW();

        INSERT INTO public.logistics_vehicle_attrs (vehicle_id, max_payload, fuel_type, vehicle_type, updated_at)
        VALUES (
            v_target_id_uuid,
            (p_ext_data->>'max_payload')::numeric,
            p_ext_data->>'fuel_type',
            p_ext_data->>'vehicle_type',
            NOW()
        )
        ON CONFLICT (vehicle_id) DO UPDATE SET
            max_payload = EXCLUDED.max_payload,
            fuel_type = EXCLUDED.fuel_type,
            vehicle_type = EXCLUDED.vehicle_type,
            updated_at = NOW();

    -- 2. ITEMS
    ELSIF p_table_name = 'items' THEN
        v_target_id_uuid := CASE WHEN v_target_id_text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN v_target_id_text::uuid ELSE gen_random_uuid() END;

        INSERT INTO public.master_items (id, name, unit, display_order, is_active, updated_at)
        VALUES (
            v_target_id_uuid,
            p_core_data->>'name',
            p_core_data->>'unit',
            COALESCE((p_core_data->>'display_order')::integer, 0),
            COALESCE((p_core_data->>'is_active')::boolean, true),
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            unit = EXCLUDED.unit,
            display_order = EXCLUDED.display_order,
            is_active = EXCLUDED.is_active,
            updated_at = NOW();

    -- 3. POINTS (Collection Points)
    ELSIF p_table_name = 'points' OR p_table_name = 'master_collection_points' THEN
        RAISE NOTICE 'Inserting into master_collection_points: id=%', v_target_id_text;
        
        INSERT INTO public.master_collection_points (location_id, name, address, contractor_id, note, is_active, updated_at)
        VALUES (
            v_target_id_text,
            p_core_data->>'name',
            p_core_data->>'address',
            p_core_data->>'contractor_id',
            p_core_data->>'note',
            COALESCE((p_core_data->>'is_active')::boolean, true),
            NOW()
        )
        ON CONFLICT (location_id) DO UPDATE SET
            name = EXCLUDED.name,
            address = EXCLUDED.address,
            contractor_id = EXCLUDED.contractor_id,
            note = EXCLUDED.note,
            is_active = EXCLUDED.is_active,
            updated_at = NOW();

    -- 4. DRIVERS
    ELSIF p_table_name = 'drivers' THEN
        INSERT INTO public.drivers (id, driver_name, display_order, user_id, updated_at)
        VALUES (
            v_target_id_text,
            COALESCE(p_core_data->>'name', p_core_data->>'driver_name'),
            COALESCE((p_core_data->>'display_order')::integer, 999),
            p_core_data->>'user_id',
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            driver_name = EXCLUDED.driver_name,
            display_order = EXCLUDED.display_order,
            user_id = EXCLUDED.user_id,
            updated_at = NOW();

    -- 5. USERS (Profiles)
    ELSIF p_table_name = 'users' THEN
        v_target_id_text := v_target_id_text::text;
        INSERT INTO public.profiles (id, name, role, vehicle_info, updated_at)
        VALUES (
            v_target_id_text,
            p_core_data->>'name',
            p_core_data->>'role',
            p_core_data->>'vehicle_info',
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            role = EXCLUDED.role,
            vehicle_info = EXCLUDED.vehicle_info,
            updated_at = NOW();
    
    ELSE
        RAISE EXCEPTION 'Unknown table name: %', p_table_name;
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_execute_master_update TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_execute_master_update TO anon;
GRANT EXECUTE ON FUNCTION public.rpc_execute_master_update TO service_role;
NOTIFY pgrst, 'reload schema';
-- Evolve master_collection_points table with Field-Reality attributes
-- Hybrid PK strategy: keep location_id, add id as true internal identity

-- 1. Add new columns
ALTER TABLE public.master_collection_points 
ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS visit_slot VARCHAR(10) DEFAULT 'FREE',
ADD COLUMN IF NOT EXISTS vehicle_restriction_type VARCHAR(20) DEFAULT 'NONE',
ADD COLUMN IF NOT EXISTS restricted_vehicle_id UUID REFERENCES public.vehicles(id),
ADD COLUMN IF NOT EXISTS time_constraint_type VARCHAR(10) DEFAULT 'NONE',
ADD COLUMN IF NOT EXISTS time_range_start TIME,
ADD COLUMN IF NOT EXISTS time_range_end TIME,
ADD COLUMN IF NOT EXISTS default_route_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS collection_days JSONB DEFAULT '{"mon": true, "tue": true, "wed": true, "thu": true, "fri": true, "sat": true, "sun": false}'::jsonb,
ADD COLUMN IF NOT EXISTS is_spot BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS latitude DECIMAL(9,6),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(9,6),
ADD COLUMN IF NOT EXISTS target_item_category VARCHAR(50),
ADD COLUMN IF NOT EXISTS entry_instruction TEXT,
ADD COLUMN IF NOT EXISTS safety_note TEXT,
ADD COLUMN IF NOT EXISTS average_weight INTEGER,
ADD COLUMN IF NOT EXISTS site_contact_phone VARCHAR(20);

-- 2. Data Migration: seed display_name from name
UPDATE public.master_collection_points 
SET display_name = name 
WHERE display_name IS NULL;

-- 3. Update view_master_points to expose new attributes
CREATE OR REPLACE VIEW public.view_master_points AS
SELECT 
    p.id as id, -- New internal UUID
    p.location_id as location_code, -- Legacy code
    p.name,
    p.display_name,
    p.address,
    p.visit_slot,
    p.vehicle_restriction_type,
    p.restricted_vehicle_id,
    p.time_constraint_type,
    p.time_range_start,
    p.time_range_end,
    p.default_route_code,
    p.collection_days,
    p.is_spot,
    p.is_active,
    p.target_item_category,
    p.entry_instruction,
    p.safety_note,
    p.average_weight,
    p.site_contact_phone,
    p.note as internal_note,
    p.contractor_id,
    c.name as contractor_name,
    c.payee_id,
    py.name as payee_name,
    p.created_at,
    p.updated_at
FROM 
    public.master_collection_points p
LEFT JOIN 
    public.master_contractors c ON p.contractor_id = c.contractor_id
LEFT JOIN 
    public.master_payees py ON c.payee_id = py.payee_id;

-- 4. Grant permissions
GRANT SELECT ON public.view_master_points TO authenticated;
GRANT SELECT ON public.view_master_points TO anon;
GRANT SELECT ON public.view_master_points TO service_role;
-- Remove average_weight column from master_collection_points
-- This column was added based on an incorrect "AI Functionality" assumption (Governance Violation)

-- 1. Update view_master_points to remove average_weight
CREATE OR REPLACE VIEW public.view_master_points AS
SELECT 
    p.id as id,
    p.location_id as location_code,
    p.name,
    p.display_name,
    p.address,
    p.visit_slot,
    p.vehicle_restriction_type,
    p.restricted_vehicle_id,
    p.time_constraint_type,
    p.time_range_start,
    p.time_range_end,
    p.default_route_code,
    p.collection_days,
    p.is_spot,
    p.is_active,
    p.target_item_category,
    p.entry_instruction,
    p.safety_note,
    -- p.average_weight, -- REMOVED
    p.site_contact_phone,
    p.note as internal_note,
    p.contractor_id,
    c.name as contractor_name,
    c.payee_id,
    py.name as payee_name,
    p.created_at,
    p.updated_at
FROM 
    public.master_collection_points p
LEFT JOIN 
    public.master_contractors c ON p.contractor_id = c.contractor_id
LEFT JOIN 
    public.master_payees py ON c.payee_id = py.payee_id;

-- 2. Physically drop the column
ALTER TABLE public.master_collection_points 
DROP COLUMN IF EXISTS average_weight;
-- ==========================================
-- UPDATE GENERALIZED MASTER RPC (v6 - Support for Evolved Columns)
-- ==========================================

CREATE OR REPLACE FUNCTION public.rpc_execute_master_update(
    p_table_name text,
    p_id text DEFAULT NULL, 
    p_core_data jsonb DEFAULT '{}'::jsonb,
    p_ext_data jsonb DEFAULT '{}'::jsonb,
    p_decision_type text DEFAULT 'MASTER_UPDATE',
    p_reason text DEFAULT 'No reason provided',
    p_user_id text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_proposal_id uuid;
    v_target_id_uuid uuid;
    v_target_id_text text;
BEGIN
    -- [A] ID Normalization
    v_target_id_text := CASE WHEN p_id IS NOT NULL AND p_id <> '' THEN p_id ELSE gen_random_uuid()::text END;

    -- [B] SDR Auditing
    INSERT INTO public.decision_proposals (proposal_type, status, proposed_value, reason, proposer_id, target_id)
    VALUES (p_decision_type, 'APPROVED', (COALESCE(p_core_data, '{}'::jsonb) || COALESCE(p_ext_data, '{}'::jsonb)), p_reason, p_user_id, v_target_id_text)
    RETURNING id INTO v_proposal_id;

    INSERT INTO public.decisions (proposal_id, decision, decider_id)
    VALUES (v_proposal_id, 'APPROVED', p_user_id);

    -- [C] Core Logic
    
    -- 1. VEHICLES
    IF p_table_name = 'vehicles' THEN
        v_target_id_uuid := CASE WHEN v_target_id_text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN v_target_id_text::uuid ELSE gen_random_uuid() END;
        
        INSERT INTO public.master_vehicles (id, number, callsign, is_active, updated_at)
        VALUES (
            v_target_id_uuid,
            p_core_data->>'number',
            p_core_data->>'callsign',
            COALESCE((p_core_data->>'is_active')::boolean, true),
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            number = EXCLUDED.number,
            callsign = EXCLUDED.callsign,
            is_active = EXCLUDED.is_active,
            updated_at = NOW();

    -- 2. ITEMS
    ELSIF p_table_name = 'items' THEN
        v_target_id_uuid := CASE WHEN v_target_id_text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN v_target_id_text::uuid ELSE gen_random_uuid() END;

        INSERT INTO public.master_items (id, name, unit, display_order, is_active, updated_at)
        VALUES (
            v_target_id_uuid,
            p_core_data->>'name',
            p_core_data->>'unit',
            COALESCE((p_core_data->>'display_order')::integer, 0),
            COALESCE((p_core_data->>'is_active')::boolean, true),
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            unit = EXCLUDED.unit,
            display_order = EXCLUDED.display_order,
            is_active = EXCLUDED.is_active,
            updated_at = NOW();

    -- 3. POINTS (Collection Points)
    ELSIF p_table_name = 'points' OR p_table_name = 'master_collection_points' THEN
        INSERT INTO public.master_collection_points (
            location_id, 
            name, 
            display_name,
            address, 
            contractor_id, 
            visit_slot,
            vehicle_restriction_type,
            restricted_vehicle_id,
            target_item_category,
            entry_instruction,
            safety_note,
            site_contact_phone,
            note, 
            is_active, 
            updated_at
        )
        VALUES (
            v_target_id_text,
            COALESCE(p_core_data->>'name', p_core_data->>'display_name'),
            p_core_data->>'display_name',
            p_core_data->>'address',
            p_core_data->>'contractor_id',
            COALESCE(p_core_data->>'visit_slot', 'FREE'),
            COALESCE(p_core_data->>'vehicle_restriction_type', 'NONE'),
            (p_core_data->>'restricted_vehicle_id')::uuid,
            p_core_data->>'target_item_category',
            p_core_data->>'entry_instruction',
            p_core_data->>'safety_note',
            p_core_data->>'site_contact_phone',
            p_core_data->>'note',
            COALESCE((p_core_data->>'is_active')::boolean, true),
            NOW()
        )
        ON CONFLICT (location_id) DO UPDATE SET
            name = EXCLUDED.name,
            display_name = EXCLUDED.display_name,
            address = EXCLUDED.address,
            contractor_id = EXCLUDED.contractor_id,
            visit_slot = EXCLUDED.visit_slot,
            vehicle_restriction_type = EXCLUDED.vehicle_restriction_type,
            restricted_vehicle_id = EXCLUDED.restricted_vehicle_id,
            target_item_category = EXCLUDED.target_item_category,
            entry_instruction = EXCLUDED.entry_instruction,
            safety_note = EXCLUDED.safety_note,
            site_contact_phone = EXCLUDED.site_contact_phone,
            note = EXCLUDED.note,
            is_active = EXCLUDED.is_active,
            updated_at = NOW();

    -- 4. DRIVERS
    ELSIF p_table_name = 'drivers' THEN
        INSERT INTO public.drivers (id, driver_name, display_order, user_id, updated_at)
        VALUES (
            v_target_id_text,
            COALESCE(p_core_data->>'name', p_core_data->>'driver_name'),
            COALESCE((p_core_data->>'display_order')::integer, 999),
            p_core_data->>'user_id',
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            driver_name = EXCLUDED.driver_name,
            display_order = EXCLUDED.display_order,
            user_id = EXCLUDED.user_id,
            updated_at = NOW();

    -- 5. USERS (Profiles)
    ELSIF p_table_name = 'users' THEN
        INSERT INTO public.profiles (id, name, role, vehicle_info, updated_at)
        VALUES (
            v_target_id_text,
            p_core_data->>'name',
            p_core_data->>'role',
            p_core_data->>'vehicle_info',
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            role = EXCLUDED.role,
            vehicle_info = EXCLUDED.vehicle_info,
            updated_at = NOW();
    
    ELSE
        RAISE EXCEPTION 'Unknown table name: %', p_table_name;
    END IF;
END;
$$;
-- Phase A: 迴ｾ蝣ｴ蜈･蝣ｴ蛻ｶ髯舌ユ繝ｼ繝悶Ν縺ｮ霑ｽ蜉
-- 蝨ｰ轤ｹ繝ｻ繝峨Λ繧､繝舌・繝ｻ霆贋ｸ｡縺ｮ螟壼ｯｾ螟壼宛邏・ｒ邂｡逅・☆繧・
-- 繝・ヵ繧ｩ繝ｫ繝・ 繧ｨ繝ｳ繝医Μ繝ｼ縺ｪ縺・= 蛻ｶ邏・↑縺・

CREATE TABLE IF NOT EXISTS public.point_access_permissions (
    id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    -- master_collection_points.location_id 縺ｯ TEXT 蝙・
    point_id   TEXT NOT NULL REFERENCES public.master_collection_points(location_id) ON DELETE CASCADE,
    -- profiles.id 縺ｯ TEXT 蝙・
    driver_id  TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    -- vehicles 縺・View 縺ｧ縺ゅｋ縺溘ａ縲∝､夜Κ繧ｭ繝ｼ蛻ｶ邏・REFERENCES)縺ｯ螳夂ｾｩ縺励↑縺・
    vehicle_id UUID NOT NULL,
    note       TEXT,
    is_active  BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    -- 蜷御ｸ蝨ｰ轤ｹ縺ｫ蜷御ｸ繝峨Λ繧､繝舌・縺ｯ1繝代ち繝ｼ繝ｳ縺ｮ縺ｿ・・繝峨Λ繧､繝舌・=1謖・ｮ夊ｻ贋ｸ｡・・
    UNIQUE(point_id, driver_id)
);

-- RLS: 隱崎ｨｼ貂医∩繝ｦ繝ｼ繧ｶ繝ｼ縺ｮ縺ｿ蜿ら・繝ｻ邱ｨ髮・庄
ALTER TABLE public.point_access_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "蜈･蝣ｴ蛻ｶ髯神隱崎ｨｼ貂医∩蜿ら・蜿ｯ" ON public.point_access_permissions
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "蜈･蝣ｴ蛻ｶ髯神隱崎ｨｼ貂医∩邱ｨ髮・庄" ON public.point_access_permissions
    FOR ALL TO authenticated USING (true);

-- 讓ｩ髯蝉ｻ倅ｸ・
GRANT SELECT, INSERT, UPDATE, DELETE ON public.point_access_permissions TO authenticated;
GRANT SELECT ON public.point_access_permissions TO service_role;

-- COMMENT
COMMENT ON TABLE public.point_access_permissions IS
    '迴ｾ蝣ｴ蜈･蝣ｴ蛻ｶ髯・ 迚ｹ螳壹・蝨ｰ轤ｹ縺ｫ迚ｹ螳壹・繝峨Λ繧､繝舌・縺悟・蝣ｴ縺吶ｋ髫帙↓菴ｿ逕ｨ蠢・医・霆贋ｸ｡繧貞ｮ夂ｾｩ縺吶ｋ縲ゅお繝ｳ繝医Μ繝ｼ縺悟ｭ伜惠縺励↑縺・慍轤ｹ繝ｻ繝峨Λ繧､繝舌・縺ｮ邨・∩蜷医ｏ縺帙・蛻ｶ邏・↑縺暦ｼ郁・逕ｱ・峨→縺励※謇ｱ繧上ｌ繧九・;
