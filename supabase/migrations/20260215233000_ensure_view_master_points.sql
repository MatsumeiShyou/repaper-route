-- Ensure view_master_points exists and is correctly structured
-- Create or replace the view to ensure consistency
DROP VIEW IF EXISTS public.view_master_points;

CREATE OR REPLACE VIEW public.view_master_points AS
SELECT 
    p.location_id as id,
    p.name,
    p.address,
    p.note,
    p.is_active,
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

-- Grant permissions explicitly
GRANT SELECT ON public.view_master_points TO authenticated;
GRANT SELECT ON public.view_master_points TO anon;
GRANT SELECT ON public.view_master_points TO service_role;
