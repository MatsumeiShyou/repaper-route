-- Enable RLS and add permissive policies for SDR tables
-- This is to ensure PostgREST can see and access them

-- 1. decision_proposals
ALTER TABLE decision_proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to decision_proposals" ON decision_proposals FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON decision_proposals TO anon, authenticated, service_role;

-- 2. decisions
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to decisions" ON decisions FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON decisions TO anon, authenticated, service_role;

-- 3. reasons
ALTER TABLE reasons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to reasons" ON reasons FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON reasons TO anon, authenticated, service_role;

-- Force schema cache reload again
NOTIFY pgrst, 'reload schema';
