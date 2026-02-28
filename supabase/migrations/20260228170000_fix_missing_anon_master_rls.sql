-- ==========================================
-- Fix 401 Unauthorized for Missing Master Tables (Anon)
-- Phase: 12.1 (Technical Debt Cleanup)
-- Overview: Grant SELECT access to 'anon' role for master_drivers and master_contractors.
-- ==========================================

DO $$
BEGIN
    -- 1. master_drivers table
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'master_drivers') THEN
        GRANT SELECT ON TABLE public.master_drivers TO anon;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'master_drivers' AND policyname = 'Enable read for anon') THEN
            CREATE POLICY "Enable read for anon" ON public.master_drivers FOR SELECT TO anon USING (true);
        END IF;
    END IF;

    -- 2. master_contractors table
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'master_contractors') THEN
        GRANT SELECT ON TABLE public.master_contractors TO anon;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'master_contractors' AND policyname = 'Enable read for anon') THEN
            CREATE POLICY "Enable read for anon" ON public.master_contractors FOR SELECT TO anon USING (true);
        END IF;
    END IF;

END $$;
