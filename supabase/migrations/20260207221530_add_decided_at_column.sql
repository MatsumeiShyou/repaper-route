-- Add decided_at column to decisions table
ALTER TABLE public.decisions ADD COLUMN IF NOT EXISTS decided_at TIMESTAMPTZ DEFAULT NOW();

-- Force Schema Reload
NOTIFY pgrst, 'reload schema';
