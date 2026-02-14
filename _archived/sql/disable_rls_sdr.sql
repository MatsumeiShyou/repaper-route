-- Disable RLS on SDR tables to debug visibility/cache issues
ALTER TABLE decision_proposals DISABLE ROW LEVEL SECURITY;
ALTER TABLE decisions DISABLE ROW LEVEL SECURITY;
ALTER TABLE reasons DISABLE ROW LEVEL SECURITY;

-- Force schema cache reload
NOTIFY pgrst, 'reload schema';
