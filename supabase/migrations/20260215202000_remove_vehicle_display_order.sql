-- ==========================================
-- Phase 7: Refine Vehicle Master Structure
-- 1. Remove display_order
-- 2. Add empty_vehicle_weight
-- 3. Redefine View
-- ==========================================

-- 1. DROP COLUMN display_order from Core
ALTER TABLE master_vehicles DROP COLUMN IF EXISTS display_order;

-- 2. ADD empty_vehicle_weight to Extension
ALTER TABLE logistics_vehicle_attrs ADD COLUMN IF NOT EXISTS empty_vehicle_weight NUMERIC;

-- 3. Redefine vehicles View (Integration Layer)
CREATE OR REPLACE VIEW vehicles AS
SELECT 
    v.id,
    v.number,
    v.callsign,
    v.is_active,
    v.created_at,
    v.updated_at,
    a.max_payload,
    a.empty_vehicle_weight,
    a.fuel_type,
    a.vehicle_type
FROM master_vehicles v
LEFT JOIN logistics_vehicle_attrs a ON v.id = a.vehicle_id;

-- 4. Reload Schema for PostgREST
NOTIFY pgrst, 'reload schema';
