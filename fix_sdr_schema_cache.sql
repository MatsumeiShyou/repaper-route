-- Explicitly grant permissions again just in case
GRANT ALL ON decision_proposals TO anon, authenticated, service_role;
GRANT ALL ON decisions TO anon, authenticated, service_role;

-- Force Schema Cache Reload for PostgREST
NOTIFY pgrst, 'reload schema';

-- Verification Select (to ensure table exists and is accessible)
SELECT count(*) as proposal_count FROM decision_proposals;
