-- ==========================================
-- Admin and Driver profiles seed (Manual recovery)
-- ==========================================

DO $$
BEGIN
  -- 1. Create Admin Profile
  INSERT INTO public.profiles (id, name, role, updated_at)
  VALUES ('00000000-0000-0000-0000-000000000001', 'システム管理者', 'admin', now())
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role, updated_at = now();

  -- 2. Create Driver Profile
  INSERT INTO public.profiles (id, name, role, vehicle_info, updated_at)
  VALUES ('00000000-0000-0000-0000-000000000002', 'デモドライバー', 'driver', 'R-01', now())
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role, vehicle_info = EXCLUDED.vehicle_info, updated_at = now();

  -- Link to drivers table if exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'drivers') THEN
    INSERT INTO public.drivers (id, driver_name, user_id, updated_at)
    VALUES ('D001', 'デモドライバー', '00000000-0000-0000-0000-000000000002', now())
    ON CONFLICT (id) DO UPDATE SET user_id = EXCLUDED.user_id;
  END IF;
END $$;
