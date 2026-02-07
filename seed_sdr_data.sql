-- Seed Sample Proposals
INSERT INTO decision_proposals (proposal_id, proposer_id, proposed_value, reason, status, created_at)
VALUES
    (gen_random_uuid(), 'admin1', '{"action":"move","target":"Job-101","from":"8:00","to":"9:00"}', 'Traffic delay', 'pending', NOW() - INTERVAL '1 hour'),
    (gen_random_uuid(), 'driverA', '{"action":"add","target":"Job-102","time":"10:00"}', 'New request', 'approved', NOW() - INTERVAL '2 hours'),
    (gen_random_uuid(), 'admin1', '{"action":"delete","target":"Job-103"}', 'Cancelled by customer', 'rejected', NOW() - INTERVAL '3 hours');

-- Seed Sample Decisions for the approved/rejected ones
INSERT INTO decisions (decision_id, proposal_id, decision_type, final_value, decider_id, decided_at)
SELECT 
    gen_random_uuid(),
    proposal_id,
    CASE WHEN status = 'approved' THEN 'approve' ELSE 'reject' END,
    proposed_value,
    'admin1',
    NOW()
FROM decision_proposals
WHERE status IN ('approved', 'rejected');

-- Force schema reload to be sure
NOTIFY pgrst, 'reload schema';
