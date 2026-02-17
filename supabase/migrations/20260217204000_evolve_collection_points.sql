-- Evolve master_collection_points table with Field-Reality attributes
-- Hybrid PK strategy: keep location_id, add id as true internal identity

-- 1. Add new columns
ALTER TABLE public.master_collection_points 
ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS visit_slot VARCHAR(10) DEFAULT 'FREE',
ADD COLUMN IF NOT EXISTS vehicle_restriction_type VARCHAR(20) DEFAULT 'NONE',
ADD COLUMN IF NOT EXISTS restricted_vehicle_id UUID REFERENCES public.vehicles(id),
ADD COLUMN IF NOT EXISTS time_constraint_type VARCHAR(10) DEFAULT 'NONE',
ADD COLUMN IF NOT EXISTS time_range_start TIME,
ADD COLUMN IF NOT EXISTS time_range_end TIME,
ADD COLUMN IF NOT EXISTS default_route_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS collection_days JSONB DEFAULT '{"mon": true, "tue": true, "wed": true, "thu": true, "fri": true, "sat": true, "sun": false}'::jsonb,
ADD COLUMN IF NOT EXISTS is_spot BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS latitude DECIMAL(9,6),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(9,6),
ADD COLUMN IF NOT EXISTS target_item_category VARCHAR(50),
ADD COLUMN IF NOT EXISTS entry_instruction TEXT,
ADD COLUMN IF NOT EXISTS safety_note TEXT,
ADD COLUMN IF NOT EXISTS average_weight INTEGER,
ADD COLUMN IF NOT EXISTS site_contact_phone VARCHAR(20);

-- 2. Data Migration: seed display_name from name
UPDATE public.master_collection_points 
SET display_name = name 
WHERE display_name IS NULL;

-- 3. Update view_master_points to expose new attributes
CREATE OR REPLACE VIEW public.view_master_points AS
SELECT 
    p.id as id, -- New internal UUID
    p.location_id as location_code, -- Legacy code
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
    p.average_weight,
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

-- 4. Grant permissions
GRANT SELECT ON public.view_master_points TO authenticated;
GRANT SELECT ON public.view_master_points TO anon;
GRANT SELECT ON public.view_master_points TO service_role;
