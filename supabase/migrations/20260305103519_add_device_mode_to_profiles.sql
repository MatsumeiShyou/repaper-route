-- Add device_mode column to profiles table

ALTER TABLE "public"."profiles"
ADD COLUMN IF NOT EXISTS "device_mode" text DEFAULT 'auto';

-- Add check constraint to ensure valid values
ALTER TABLE "public"."profiles"
ADD CONSTRAINT check_device_mode_values CHECK (device_mode IN ('auto', 'pc', 'tablet', 'mobile'));

-- Update existing rows to have the default value 'auto' if they are null (though DEFAULT should handle new and optionally existing depending on PG version, good practice to ensure)
UPDATE "public"."profiles"
SET "device_mode" = 'auto'
WHERE "device_mode" IS NULL;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
