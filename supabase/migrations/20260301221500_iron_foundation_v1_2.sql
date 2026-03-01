-- ==========================================
-- Iron Governance V4: Foundation (v1.2 Deterministic Logic)
-- Phase: 2 (DB Sanctuary)
-- Overview: Append-Only Job structure, Special Activities, and Policy Engine
-- ==========================================

-- 1. Logical Policy Engine (算術定数の外部化)
CREATE TABLE IF NOT EXISTS public.logic_policies (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.logic_policies (key, value, description)
VALUES 
('GOTOBI_COEFFICIENT', '1.2'::jsonb, '五十日（ごとうび）の渋滞補正係数'),
('WEEKEND_COEFFICIENT', '1.1'::jsonb, '週末の渋滞補正係数'),
('DEFAULT_SLOT_HEIGHT', '32'::jsonb, '15分あたりの基本ピクセル高さ(128px/h)'),
('RES_SUPPORT_COUNT', '2'::jsonb, '優先確保する現場支援要員数')
ON CONFLICT (key) DO NOTHING;

-- 2. Special Activities (現場作業・車両整備)
CREATE TABLE IF NOT EXISTS public.special_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_type TEXT NOT NULL, -- 'WORK', 'MAINTENANCE', 'LEAVE'
    driver_id TEXT REFERENCES public.profiles(id),
    vehicle_id UUID REFERENCES public.master_vehicles(id),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    lock_driver BOOLEAN DEFAULT true,
    lock_vehicle BOOLEAN DEFAULT true,
    sdr_id UUID REFERENCES public.decisions(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. jobs_v4 (Append-Only / Versioned Job Structure)
CREATE TABLE IF NOT EXISTS public.jobs_v4 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL, -- 論理的な案件識別子（全バージョン共通）
    version INTEGER DEFAULT 1 NOT NULL,
    is_latest BOOLEAN DEFAULT true,
    
    -- Business Data (S1 State)
    point_id TEXT NOT NULL REFERENCES public.master_collection_points(location_id),
    driver_id TEXT REFERENCES public.profiles(id),
    vehicle_id UUID REFERENCES public.master_vehicles(id),
    preferred_start_time TIME, -- 顧客希望
    actual_start_time TIME,    -- 計画・実績
    duration_minutes INTEGER DEFAULT 15 NOT NULL,
    status TEXT DEFAULT 'pending' NOT NULL, -- pending, confirmed, locked, skipped
    
    -- SDR Metadata
    decision_id UUID REFERENCES public.decisions(id),
    is_admin_forced BOOLEAN DEFAULT false,
    
    -- Technical Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Index for performance
CREATE INDEX idx_jobs_v4_job_id ON public.jobs_v4(job_id);
CREATE INDEX idx_jobs_v4_latest ON public.jobs_v4(job_id) WHERE is_latest = true;

-- 4. Splitters (論理境界)
CREATE TABLE IF NOT EXISTS public.splitters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id TEXT NOT NULL REFERENCES public.profiles(id),
    split_time TIME NOT NULL,
    note TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Physical Guardrails (不変性の強制)

-- 5.1 物理削除の禁止 (Block DELETE)
CREATE OR REPLACE FUNCTION public.fn_block_physical_delete()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Physical deletion is prohibited in RePaper Route Governance. Use logical deletion (is_active=false or status=skipped) instead.';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_block_delete_jobs_v4 BEFORE DELETE ON public.jobs_v4 FOR EACH ROW EXECUTE FUNCTION public.fn_block_physical_delete();
CREATE TRIGGER tr_block_delete_special_activities BEFORE DELETE ON public.special_activities FOR EACH ROW EXECUTE FUNCTION public.fn_block_physical_delete();
CREATE TRIGGER tr_block_delete_splitters BEFORE DELETE ON public.splitters FOR EACH ROW EXECUTE FUNCTION public.fn_block_physical_delete();

-- 5.2 Append-Only の強制 (Block UPDATE on jobs_v4)
CREATE OR REPLACE FUNCTION public.fn_block_job_update()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        RAISE EXCEPTION 'Updates to jobs_v4 are prohibited. Insert a new version to reflect changes.';
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_block_update_jobs_v4 BEFORE UPDATE ON public.jobs_v4 FOR EACH ROW EXECUTE FUNCTION public.fn_block_job_update();

-- RLS & Grants
ALTER TABLE public.logic_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.special_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs_v4 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.splitters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for all users" ON public.logic_policies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for all users" ON public.special_activities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for all users" ON public.jobs_v4 FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for all users" ON public.splitters FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON TABLE public.logic_policies TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.special_activities TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.jobs_v4 TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.splitters TO anon, authenticated, service_role;

-- Force Schema Reload
NOTIFY pgrst, 'reload schema';
