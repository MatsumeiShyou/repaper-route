-- Phase 3: Data Integrity & Archiving Support
-- 日付: 2026-02-14
-- 目的: 外部キー制約の強化および物理削除を伴わないアーカイブ機能の基盤構築

-- 1. drivers テーブルの整合性強化
-- profiles テーブルへの外部キー制約を追加するための下準備
-- 注意: profiles.id が TEXT 型のため、紐付け先の user_id も TEXT 型で作成する必要があります。
-- すでに UUID 型で作成されている場合のリカバリを含みます。
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'drivers' AND column_name = 'user_id' AND data_type = 'uuid'
    ) THEN
        ALTER TABLE drivers ALTER COLUMN user_id TYPE TEXT;
    ELSIF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'drivers' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE drivers ADD COLUMN user_id TEXT;
    END IF;
END $$;

-- profiles テーブルへの外部キー制約を追加（存在チェック）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_drivers_profiles'
    ) THEN
        ALTER TABLE drivers
        ADD CONSTRAINT fk_drivers_profiles
        FOREIGN KEY (user_id) REFERENCES profiles(id)
        ON DELETE SET NULL;
    END IF;
END $$;

-- 2. master_collection_points (旧 customers) のアーカイブ対応
ALTER TABLE master_collection_points 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 3. vehicles テーブルのアーカイブ対応
DO $$
BEGIN
    -- vehicles が実テーブルとして存在する場合
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'vehicles' AND table_type = 'BASE TABLE'
    ) THEN
        ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
    -- vehicles が View の場合、実体は master_vehicles (Core/Extモデル) であると判断
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'master_vehicles' AND table_type = 'BASE TABLE'
    ) THEN
        ALTER TABLE master_vehicles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- 4. master_items テーブルのアーカイブ対応
ALTER TABLE master_items 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 5. 既存の RPC をアーカイブ対応にするための論理削除用判定追加（任意）
-- ここでは基盤のみ作成し、実際の「提案->承認->更新」フローはアプリケーション側で制御する。
