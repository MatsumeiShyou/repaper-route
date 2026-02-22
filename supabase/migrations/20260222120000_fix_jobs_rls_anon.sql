-- Migration: Grant SELECT access to anon role for jobs table
-- Reason: Allow data retrieval in unauthenticated or mock-authenticated contexts (e.g. initial load or development)
-- Timestamp: 20260222120000

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'jobs') THEN
        -- Add SELECT policy for anon if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'jobs' AND policyname = 'Enable read access for anon'
        ) THEN
            CREATE POLICY "Enable read access for anon" ON public.jobs
                FOR SELECT TO anon USING (true);
        END IF;
        
        -- Also ensure authenticated users can still read (already exists in 20260211100000_fix_jobs_rls.sql, but keeping as safety)
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'jobs' AND policyname = 'Enable read access for authenticated users'
        ) THEN
            CREATE POLICY "Enable read access for authenticated users" ON public.jobs
                FOR SELECT TO authenticated USING (true);
        END IF;

        -- Explicitly grant SELECT to anon role just in case
        GRANT SELECT ON TABLE public.jobs TO anon;
    END IF;
END $$;
