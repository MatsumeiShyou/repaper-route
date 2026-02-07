-- ==========================================
-- SDR Data Migration (Phase 4.0)
-- Purpose: Migrate data from 'customers' (Simple) to 'master_collection_points' (SDR Foundation)
-- ==========================================

-- 1. Ensure Payee (Tier 1) and Contractor (Tier 2) exist
-- These are required parents for the foreign keys in Collection Points

INSERT INTO master_payees (payee_id, name)
VALUES ('p_default', '(合)ポジティブ')
ON CONFLICT (payee_id) DO NOTHING;

INSERT INTO master_contractors (contractor_id, payee_id, name)
VALUES ('c_default', 'p_default', '標準契約先')
ON CONFLICT (contractor_id) DO NOTHING;

-- 2. Migrate Customers to Collection Points (Tier 3)
-- Mapping:
-- customers.id -> master_collection_points.location_id
-- customers.name -> master_collection_points.name
-- customers.area -> master_collection_points.area
-- customers.default_duration -> master_collection_points.default_duration
-- customers.note -> master_collection_points.note
-- Hardcoded: contractor_id = 'c_default', time_constraint_type = 'NONE' (unless inferred logic added later)

INSERT INTO master_collection_points (
    location_id,
    contractor_id,
    name,
    area,
    default_duration,
    note,
    time_constraint_type
)
SELECT
    id,
    'c_default', -- Link to default contractor
    name,
    area,
    default_duration,
    note,
    'NONE' -- Default to no time constraint for migrated data
FROM customers
ON CONFLICT (location_id) DO UPDATE SET
    name = EXCLUDED.name,
    area = EXCLUDED.area,
    default_duration = EXCLUDED.default_duration,
    note = EXCLUDED.note;

-- 3. Verification Log
DO $$
DECLARE
    src_count INT;
    dest_count INT;
BEGIN
    SELECT COUNT(*) INTO src_count FROM customers;
    SELECT COUNT(*) INTO dest_count FROM master_collection_points;
    RAISE NOTICE 'Migrated % records from customers. Total records in master_collection_points: %', src_count, dest_count;
END $$;
