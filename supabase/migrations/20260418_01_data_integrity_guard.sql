-- Migration: 01_data_integrity_guard
-- Status: Pre-migration Safeguard
-- Target: staffs table vs profiles table consistency

-- 1. profiles には存在するが staffs には存在しないデータを緊急補完
-- これにより、後のステップでの外部キー付け替え失敗を物理的に防止する。
INSERT INTO staffs (id, name, role, allowed_apps, created_at, updated_at)
SELECT 
    id::uuid, 
    name, 
    COALESCE(role, 'driver'), 
    '["repaper-route"]'::jsonb,
    now(),
    now()
FROM profiles
WHERE id::uuid NOT IN (SELECT id FROM staffs)
ON CONFLICT (id) DO NOTHING;

-- 2. 全スタッフの allowed_apps に repaper-route が含まれていることを保証
-- 移行直後の 403 (AppAccessDeniedError) を回避する
UPDATE staffs
SET 
    allowed_apps = 
        CASE 
            WHEN allowed_apps IS NULL THEN '["repaper-route"]'::jsonb
            WHEN NOT (allowed_apps @> '["repaper-route"]'::jsonb) THEN allowed_apps || '["repaper-route"]'::jsonb
            ELSE allowed_apps
        END,
    updated_at = now()
WHERE 
    NOT (allowed_apps @> '["repaper-route"]'::jsonb) 
    OR allowed_apps IS NULL;
