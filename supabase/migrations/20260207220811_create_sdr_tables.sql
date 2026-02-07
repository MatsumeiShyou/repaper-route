-- Drop existing tables to force schema refresh
DROP TABLE IF EXISTS public.reasons;
DROP TABLE IF EXISTS public.decisions;
DROP TABLE IF EXISTS public.decision_proposals;

-- Recreate decision_proposals
CREATE TABLE public.decision_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    proposal_type TEXT NOT NULL,
    target_id TEXT,
    current_value JSONB,
    proposed_value JSONB,
    status TEXT DEFAULT 'PENDING',
    proposer_id TEXT,
    reason TEXT
);

-- Recreate decisions
CREATE TABLE public.decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    proposal_id UUID REFERENCES public.decision_proposals(id),
    decider_id TEXT,
    decision TEXT,
    comment TEXT
);

-- Test Data
INSERT INTO public.decision_proposals (proposal_type, status, reason)
VALUES ('TEST_PROPOSAL', 'PENDING', 'Created by System Verification');

-- RLS (Permissive for Dev)
ALTER TABLE public.decision_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for all users" ON public.decision_proposals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for all users" ON public.decisions FOR ALL USING (true) WITH CHECK (true);

-- Grants
GRANT ALL ON TABLE public.decision_proposals TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.decisions TO anon, authenticated, service_role;

-- Force Schema Reload
NOTIFY pgrst, 'reload schema';
