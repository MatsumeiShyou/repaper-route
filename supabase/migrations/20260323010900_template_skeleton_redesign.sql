-- =============================================================================
-- Migration: Template Skeleton Redesign (T3 / AMP Approved)
-- Design Ref: implementation_plan.md (Template Management Dashboard)
-- =============================================================================
-- INTENT: Remove person/vehicle assignment data from templates.
--         Templates now store only "skeleton" job data (route, constraints, timing).
--         All existing template data is deleted (confirmed with user).
-- =============================================================================

-- Step 1: Purge all existing template data (old format is incompatible)
DELETE FROM public.board_templates;

-- Step 2: Drop columns that stored person/split data
ALTER TABLE public.board_templates
    DROP COLUMN IF EXISTS drivers_json,
    DROP COLUMN IF EXISTS splits_json;

-- Step 3: Add absent_count for staffing variant support
--         (e.g., "Monday template with 1 person absent")
ALTER TABLE public.board_templates
    ADD COLUMN IF NOT EXISTS absent_count SMALLINT NOT NULL DEFAULT 0
        CHECK (absent_count >= 0);

-- Step 4: Add description column for human-readable notes
ALTER TABLE public.board_templates
    ADD COLUMN IF NOT EXISTS description TEXT;

-- Step 5: Update comment to reflect new design
COMMENT ON TABLE public.board_templates IS
    'Skeleton-only route templates. jobs_json stores job definitions WITHOUT driverId/startTime. '
    'Drivers are assigned at expansion time based on vehicle/slot constraints.';

COMMENT ON COLUMN public.board_templates.absent_count IS
    'Number of absent staff this template is designed for (0 = full staffing).';

COMMENT ON COLUMN public.board_templates.jobs_json IS
    'Skeleton job array. Contains: id, title, duration, area, requiredVehicle, visitSlot, taskType, location_id. '
    'Does NOT contain: driverId, startTime, status.';
