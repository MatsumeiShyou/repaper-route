-- ==========================================
-- Repair: Create missing view_master_drivers
-- ==========================================

CREATE OR REPLACE VIEW public.view_master_drivers AS
SELECT 
    p.id,
    p.name,
    p.role,
    p.vehicle_info,
    p.updated_at,
    p.is_active,
    d.display_order,
    d.mobile_phone,
    v.vehicle_name
FROM 
    profiles p
LEFT JOIN 
    drivers d ON p.id::text = d.user_id::text
LEFT JOIN 
    master_vehicles v ON d.id::text = v.id::text OR p.vehicle_info = v.vehicle_name
WHERE 
    p.role IN ('driver', 'DRIVER');

GRANT SELECT ON public.view_master_drivers TO authenticated;
GRANT SELECT ON public.view_master_drivers TO anon;
