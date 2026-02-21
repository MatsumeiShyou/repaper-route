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
    master_collection_points p
LEFT JOIN 
    master_contractors c ON p.contractor_id = c.contractor_id
LEFT JOIN 
    master_payees py ON c.payee_id = py.payee_id;

GRANT SELECT ON public.view_master_points TO authenticated;
GRANT SELECT ON public.view_master_points TO anon;
