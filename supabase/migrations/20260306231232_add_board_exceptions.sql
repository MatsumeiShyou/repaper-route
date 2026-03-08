-- 20260306231232_add_board_exceptions.sql
-- Phase: 12 (Data Governance)
-- Overview: 二段階確定モデルのための例外記録テーブルとスナップショット列の追加

-- ==========================================
-- 1. Exception Reason Masters (理由マスタ)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.exception_reason_masters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label TEXT NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initial Data Seed
INSERT INTO public.exception_reason_masters (label) VALUES
    ('車両故障'),
    ('ドライバー欠勤・遅刻'),
    ('顧客都合による時間変更'),
    ('渋滞・天候による遅延'),
    ('配車漏れの修正'),
    ('その他')
ON CONFLICT (label) DO NOTHING;

-- RLS
ALTER TABLE public.exception_reason_masters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.exception_reason_masters FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.exception_reason_masters FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON public.exception_reason_masters FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


-- ==========================================
-- 2. Board Exceptions (例外イベントログ)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.board_exceptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_date DATE NOT NULL,
    job_id TEXT NOT NULL,
    exception_type TEXT NOT NULL, -- MOVE, REASSIGN, SWAP, CANCEL, ADD
    before_state JSONB NOT NULL,
    after_state JSONB NOT NULL,
    reason_master_id UUID REFERENCES public.exception_reason_masters(id),
    reason_free_text TEXT,
    promote_requested BOOLEAN DEFAULT false,
    actor_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance
CREATE INDEX idx_board_exceptions_route_date ON public.board_exceptions(route_date);
CREATE INDEX idx_board_exceptions_job_id ON public.board_exceptions(job_id);

-- Append-Only Physical Guardrail
CREATE OR REPLACE FUNCTION public.fn_block_exception_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Updates and deletions to board_exceptions are prohibited. This is an append-only audit log.';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_block_update_board_exceptions BEFORE UPDATE ON public.board_exceptions FOR EACH ROW EXECUTE FUNCTION public.fn_block_exception_mutation();
CREATE TRIGGER tr_block_delete_board_exceptions BEFORE DELETE ON public.board_exceptions FOR EACH ROW EXECUTE FUNCTION public.fn_block_exception_mutation();

-- RLS
ALTER TABLE public.board_exceptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.board_exceptions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.board_exceptions FOR INSERT TO authenticated WITH CHECK (true);


-- ==========================================
-- 3. Extend Routes Table (確定スナップショット)
-- ==========================================
ALTER TABLE public.routes
    ADD COLUMN IF NOT EXISTS confirmed_snapshot JSONB DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ DEFAULT NULL;

-- Notification for auto-schema reload in Supabase
NOTIFY pgrst, 'reload schema';

