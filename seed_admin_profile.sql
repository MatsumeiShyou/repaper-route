-- Ensure profiles table exists (it should, but just in case)
CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    role TEXT,
    can_edit_board BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS and allow access
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON profiles TO anon, authenticated, service_role;

-- Insert or Update admin1 profile
INSERT INTO profiles (id, role, can_edit_board)
VALUES ('admin1', 'admin', true)
ON CONFLICT (id) DO UPDATE SET
    can_edit_board = EXCLUDED.can_edit_board,
    role = EXCLUDED.role;

-- Check Master Drivers too (to ensure we have drivers)
GRANT ALL ON drivers TO anon, authenticated, service_role;
GRANT ALL ON vehicles TO anon, authenticated, service_role;
GRANT ALL ON master_collection_points TO anon, authenticated, service_role;

-- Force schema reload
NOTIFY pgrst, 'reload schema';
