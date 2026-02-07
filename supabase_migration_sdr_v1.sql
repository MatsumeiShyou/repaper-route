-- ==========================================
-- SDR Architecture Migration (v1.0)
-- Based on: 4-Layer Architecture (Brain, Foundation, State, Reality)
-- ==========================================

-- ==========================================
-- 1. SDR Core (The Brain)
-- ==========================================

-- 1.1 Decision Proposals (判断申請・提案)
CREATE TABLE IF NOT EXISTS decision_proposals (
    proposal_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status TEXT NOT NULL CHECK (status IN ('pending', 'rejected', 'approved')),
    proposal_type TEXT NOT NULL, -- e.g., 'swap', 'skip', 'route_change'
    proposed_data JSONB NOT NULL, -- SNAPSHOT of the potential change
    applicant_id TEXT NOT NULL, -- User ID
    reason_description TEXT, -- Proposal level comment
    created_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by TEXT
);

-- 1.2 Reasons (理由マスタ/履歴)
CREATE TABLE IF NOT EXISTS reasons (
    reason_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_code TEXT NOT NULL, -- e.g., 'WEATHER', 'TRAFFIC', 'VEHICLE_TROUBLE'
    description_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.3 Decisions (正史)
CREATE TABLE IF NOT EXISTS decisions (
    decision_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id UUID REFERENCES decision_proposals(proposal_id), -- Link to origin
    reason_id UUID REFERENCES reasons(reason_id), -- MUST have a reason
    decision_type TEXT NOT NULL CHECK (decision_type IN ('confirm', 'swap', 'exception', 'correction')),
    actor_id TEXT NOT NULL, -- The human who clicked 'Approve/Execute'
    executed_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint: Decisions are immutable (Append-Only is enforced by policy/triggers)
    CONSTRAINT fk_reason FOREIGN KEY (reason_id) REFERENCES reasons(reason_id)
);

-- ==========================================
-- 2. Master Foundation (The Foundation)
-- 3-Tier Separation
-- ==========================================

-- Tier 1: Master Payees (支払先 - 経理)
CREATE TABLE IF NOT EXISTS master_payees (
    payee_id TEXT PRIMARY KEY, -- External Code (e.g. 1709000)
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tier 2: Master Contractors (仕入先 - 契約)
CREATE TABLE IF NOT EXISTS master_contractors (
    contractor_id TEXT PRIMARY KEY, -- External Code (e.g. 1709032)
    payee_id TEXT REFERENCES master_payees(payee_id),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tier 3: Master Collection Points (回収先 - 現場)
-- This replaces the simple 'customers' table concept for the App
CREATE TABLE IF NOT EXISTS master_collection_points (
    location_id TEXT PRIMARY KEY, -- e.g., 'c1', 'loc_001'
    contractor_id TEXT REFERENCES master_contractors(contractor_id), -- Optional link to Tier 2
    
    -- Physical attributes
    name TEXT NOT NULL, -- Display Name for Drivers
    address TEXT,
    area TEXT, -- e.g., '厚木', 'Sagamihara'
    
    -- Operational Constraints
    default_duration INTEGER DEFAULT 30, -- minutes
    time_constraint_type TEXT CHECK (time_constraint_type IN ('NONE', 'AM', 'PM', 'FIXED', 'RANGE')),
    time_constraint_start TEXT, -- 'HH:MM'
    time_constraint_end TEXT, -- 'HH:MM'
    vehicle_lock_type TEXT, -- e.g., '2t_ONLY', 'FLAT_ONLY'
    
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Master Vehicles (Physical Assets)
CREATE TABLE IF NOT EXISTS master_vehicles (
    vehicle_id TEXT PRIMARY KEY, -- e.g., 'v1', 'v2'
    name TEXT NOT NULL, -- '2025PK'
    type TEXT NOT NULL, -- '2t', '4t', 'packer', 'flat'
    max_load_kg INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Master Workers (Replacing/Extending Drivers)
-- For now, we will map existing 'drivers' to this conceptually, or keep 'drivers' for Phase 0
-- Creating this for future migration
CREATE TABLE IF NOT EXISTS master_workers (
    worker_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    capabilities JSONB, -- ['drive_2t', 'drive_4t', 'leader']
    default_vehicle_id TEXT REFERENCES master_vehicles(vehicle_id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 3. Execution Integration (The Reality)
-- ==========================================

-- Execution Logs (Linking Reality to Decisions)
CREATE TABLE IF NOT EXISTS execution_logs (
    execution_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    decision_id UUID REFERENCES decisions(decision_id), -- Why this happened
    job_id TEXT, -- Link to specific job if applicable
    
    event_type TEXT NOT NULL, -- 'completion', 'skip', 'weight_entry'
    payload JSONB, -- The actual data (weight=100, etc)
    
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    recorded_by TEXT NOT NULL
);

-- ==========================================
-- Data Seeding (Migration from Config/Temp)
-- ==========================================

-- Seed Payees (Dummy for now, based on context)
INSERT INTO master_payees (payee_id, name) VALUES 
('p_default', '(合)ポジティブ')
ON CONFLICT (payee_id) DO NOTHING;

-- Seed Contractors
INSERT INTO master_contractors (contractor_id, payee_id, name) VALUES
('c_default', 'p_default', '標準契約先')
ON CONFLICT (contractor_id) DO NOTHING;

-- Seed Vehicles (From MASTER_CONFIG)
INSERT INTO master_vehicles (vehicle_id, name, type) VALUES
('v1', '2号車', '2t'),
('v2', '3号車', '3t'),
('v3', '4号車', '2t'),
('v_seino', '西濃', 'external'),
('v_sagamihara', '相模原', 'external')
ON CONFLICT (vehicle_id) DO UPDATE SET name = EXCLUDED.name;

-- Seed Collection Points (From MASTER_CONFIG/Customers)
-- Mapping existing 'customers' logic to Tier 3
INSERT INTO master_collection_points (location_id, contractor_id, name, default_duration, area, time_constraint_type, time_constraint_start, time_constraint_end, note) VALUES
('c1', 'c_default', '富士ロジ長沼', 45, '厚木', 'NONE', NULL, NULL, NULL),
('c2', 'c_default', 'リバークレイン', 30, '厚木', 'AM', '09:00', '12:00', '要ヘルメット'),
('c3', 'c_default', '出版産業 (午前)', 60, '厚木', 'AM', NULL, NULL, NULL),
('c4', 'c_default', '出版産業 (午後)', 60, '厚木', 'PM', NULL, NULL, NULL),
('c5', 'c_default', 'マルエツ', 30, '伊勢原', 'NONE', NULL, NULL, '裏口から入る')
ON CONFLICT (location_id) DO UPDATE SET 
    name = EXCLUDED.name,
    default_duration = EXCLUDED.default_duration,
    note = EXCLUDED.note;

