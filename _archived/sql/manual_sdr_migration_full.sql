-- ==========================================
-- SDR MANUAL MIGRATION SCRIPT (FULL)
-- Execute this in Supabase Dashboard > SQL Editor
-- ==========================================

-- 1. Create Tables (Brain Layer)
CREATE TABLE IF NOT EXISTS decision_proposals (
    proposal_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status TEXT NOT NULL CHECK (status IN ('pending', 'rejected', 'approved')),
    proposal_type TEXT NOT NULL,
    proposed_data JSONB NOT NULL,
    applicant_id TEXT NOT NULL,
    reason_description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by TEXT
);

CREATE TABLE IF NOT EXISTS reasons (
    reason_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_code TEXT NOT NULL,
    description_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS decisions (
    decision_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id UUID REFERENCES decision_proposals(proposal_id),
    reason_id UUID REFERENCES reasons(reason_id),
    decision_type TEXT NOT NULL CHECK (decision_type IN ('confirm', 'swap', 'exception', 'correction')),
    actor_id TEXT NOT NULL,
    executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Tables (Foundation Layer) - if not exist
CREATE TABLE IF NOT EXISTS master_payees (
    payee_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS master_contractors (
    contractor_id TEXT PRIMARY KEY,
    payee_id TEXT REFERENCES master_payees(payee_id),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS master_collection_points (
    location_id TEXT PRIMARY KEY,
    contractor_id TEXT REFERENCES master_contractors(contractor_id),
    name TEXT NOT NULL,
    address TEXT,
    area TEXT,
    default_duration INTEGER DEFAULT 30,
    time_constraint_type TEXT CHECK (time_constraint_type IN ('NONE', 'AM', 'PM', 'FIXED', 'RANGE')),
    time_constraint_start TEXT,
    time_constraint_end TEXT,
    vehicle_lock_type TEXT,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS master_vehicles (
    vehicle_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    max_load_kg INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS execution_logs (
    execution_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    decision_id UUID REFERENCES decisions(decision_id),
    job_id TEXT,
    event_type TEXT NOT NULL,
    payload JSONB,
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    recorded_by TEXT NOT NULL
);

-- 3. Validation & Permissions
-- Enable RLS (and allow access for Anon/Authenticated for now)
ALTER TABLE decision_proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to decision_proposals" ON decision_proposals FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON decision_proposals TO anon, authenticated, service_role;

ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to decisions" ON decisions FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON decisions TO anon, authenticated, service_role;

ALTER TABLE reasons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to reasons" ON reasons FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON reasons TO anon, authenticated, service_role;

-- 4. Seed Essential Data
INSERT INTO master_payees (payee_id, name) VALUES ('p_default', '(合)ポジティブ') ON CONFLICT DO NOTHING;
INSERT INTO master_contractors (contractor_id, payee_id, name) VALUES ('c_default', 'p_default', '標準契約先') ON CONFLICT DO NOTHING;
insert into reasons (category_code, description_text) values ('MANUAL_OPERATION', 'Manual operation on the board') ON CONFLICT DO NOTHING;

-- 5. Data Migration (Customers -> Collection Points)
INSERT INTO master_collection_points (
    location_id, contractor_id, name, area, default_duration, note, time_constraint_type
)
SELECT
    id, 'c_default', name, area, default_duration, note, 'NONE'
FROM customers
ON CONFLICT (location_id) DO UPDATE SET
    name = EXCLUDED.name,
    area = EXCLUDED.area,
    default_duration = EXCLUDED.default_duration,
    note = EXCLUDED.note;

-- 6. Refresh Schema Cache
NOTIFY pgrst, 'reload schema';
