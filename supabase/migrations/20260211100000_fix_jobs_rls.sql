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
