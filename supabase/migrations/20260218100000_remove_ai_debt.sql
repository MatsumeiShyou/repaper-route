-- Remove average_weight column from master_collection_points
-- This column was added based on an incorrect "AI Functionality" assumption (Governance Violation)

-- 1. Update view_master_points to remove average_weight
CREATE OR REPLACE VIEW public.view_master_points AS
SELECT 
    p.id as id,
    p.location_id as location_code,
    p.name,
    p.display_name,
    p.address,
    p.visit_slot,
    p.vehicle_restriction_type,
    p.restricted_vehicle_id,
    p.time_constraint_type,
    p.time_range_start,
    p.time_range_end,
    p.default_route_code,
    p.collection_days,
    p.is_spot,
    p.is_active,
    p.target_item_category,
    p.entry_instruction,
    p.safety_note,
    -- p.average_weight, -- REMOVED
    p.site_contact_phone,
    p.note as internal_note,
    p.contractor_id,
    c.name as contractor_name,
    c.payee_id,
    py.name as payee_name,
    p.created_at,
    p.updated_at
FROM 
    public.master_collection_points p
LEFT JOIN 
    public.master_contractors c ON p.contractor_id = c.contractor_id
LEFT JOIN 
    public.master_payees py ON c.payee_id = py.payee_id;

-- 2. Physically drop the column
ALTER TABLE public.master_collection_points 
DROP COLUMN IF EXISTS average_weight;
