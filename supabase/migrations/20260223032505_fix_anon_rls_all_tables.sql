-- ==========================================
-- Fix 401 Unauthorized for Anon Role (Recovery Mode Support)
-- Phase: 12 (Emergency Fix / Governance)
-- Overview: Grant basic access to 'anon' role for all tables required for Board operation.
-- ==========================================

DO $$
BEGIN
    -- 1. routes table
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'routes') THEN
        GRANT ALL ON TABLE public.routes TO anon;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'routes' AND policyname = 'Enable all access for anon') THEN
            CREATE POLICY "Enable all access for anon" ON public.routes FOR ALL TO anon USING (true) WITH CHECK (true);
        END IF;
    END IF;

    -- 2. profiles table
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        GRANT SELECT ON TABLE public.profiles TO anon;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Enable read for anon') THEN
            CREATE POLICY "Enable read for anon" ON public.profiles FOR SELECT TO anon USING (true);
        END IF;
    END IF;

    -- 3. jobs table (ensure grant)
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'jobs') THEN
        GRANT ALL ON TABLE public.jobs TO anon;
    END IF;

    -- 4. SDR tables (proposals, decisions, logs)
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'decision_proposals') THEN
        GRANT ALL ON TABLE public.decision_proposals TO anon;
        -- Policy already exists as "Enable all access for all users" in 20260207220811
    END IF;

    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'decisions') THEN
        GRANT ALL ON TABLE public.decisions TO anon;
        -- Policy already exists as "Enable all access for all users" in 20260207220811
    END IF;

    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'event_logs') THEN
        GRANT ALL ON TABLE public.event_logs TO anon;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'event_logs' AND policyname = 'Enable read/insert for anon') THEN
            CREATE POLICY "Enable read/insert for anon" ON public.event_logs FOR ALL TO anon USING (true) WITH CHECK (true);
        END IF;
    END IF;

    -- 5. Master tables (Read-only for anon)
    GRANT SELECT ON TABLE public.master_vehicles TO anon;
    GRANT SELECT ON TABLE public.master_collection_points TO anon;
    GRANT SELECT ON TABLE public.master_items TO anon;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'master_vehicles' AND policyname = 'Enable read for anon') THEN
        CREATE POLICY "Enable read for anon" ON public.master_vehicles FOR SELECT TO anon USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'master_collection_points' AND policyname = 'Enable read for anon') THEN
        CREATE POLICY "Enable read for anon" ON public.master_collection_points FOR SELECT TO anon USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'master_items' AND policyname = 'Enable read for anon') THEN
        CREATE POLICY "Enable read for anon" ON public.master_items FOR SELECT TO anon USING (true);
    END IF;

END $$;

-- 6. RPC Functions
GRANT EXECUTE ON FUNCTION public.rpc_execute_board_update(DATE, JSONB, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.rpc_execute_master_update(TEXT, UUID, JSONB, JSONB, TEXT, TEXT, TEXT) TO anon;
