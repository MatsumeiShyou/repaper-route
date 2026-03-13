-- Database View Repair: view_master_points (v2)
-- Description: Corrects the ID mapping. 'id' must refer to the physical UUID for Deep Fetch compatibility.
--              'location_id' remains as the human-readable identifier.
-- Date: 2026-03-14

BEGIN;

DROP VIEW IF EXISTS public.view_master_points CASCADE;

CREATE VIEW public.view_master_points AS
SELECT 
    p.id as id,           -- 物理的な UUID (Deep Fetch のプライマリキーとして使用)
    p.location_id as location_id, -- 管理番号 (TEXT)
    p.name,
    p.display_name,
    p.furigana,
    p.address,
    p.area,
    p.note,
    p.note as internal_note,
    p.is_active,
    p.contractor_id,
    c.name as contractor_name,
    c.payee_id,
    p.weighing_site_id,
    p.time_constraint_type,
    p.is_spot_only,
    p.visit_slot,
    p.vehicle_restriction_type,
    p.restricted_vehicle_id,
    p.collection_days,
    p.target_item_category,
    p.site_contact_phone,
    p.company_phone,
    p.manager_phone,
    p.special_type,
    p.recurrence_pattern,
    p.created_at,
    p.updated_at
FROM 
    public.master_collection_points p
LEFT JOIN 
    public.master_contractors c ON p.contractor_id = c.contractor_id;

-- 権限の再割当て
GRANT SELECT ON public.view_master_points TO authenticated;
GRANT SELECT ON public.view_master_points TO anon;

COMMIT;
