-- Phase A: 現場入場制限テーブルの追加
-- 地点・ドライバー・車両の多対多制約を管理する
-- デフォルト: エントリーなし = 制約なし

CREATE TABLE IF NOT EXISTS public.point_access_permissions (
    id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    -- master_collection_points.location_id は TEXT 型
    point_id   TEXT NOT NULL REFERENCES public.master_collection_points(location_id) ON DELETE CASCADE,
    -- profiles.id は TEXT 型
    driver_id  TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    -- vehicles が View であるため、外部キー制約(REFERENCES)は定義しない
    vehicle_id UUID NOT NULL,
    note       TEXT,
    is_active  BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    -- 同一地点に同一ドライバーは1パターンのみ（1ドライバー=1指定車両）
    UNIQUE(point_id, driver_id)
);

-- RLS: 認証済みユーザーのみ参照・編集可
ALTER TABLE public.point_access_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "入場制限_認証済み参照可" ON public.point_access_permissions
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "入場制限_認証済み編集可" ON public.point_access_permissions
    FOR ALL TO authenticated USING (true);

-- 権限付与
GRANT SELECT, INSERT, UPDATE, DELETE ON public.point_access_permissions TO authenticated;
GRANT SELECT ON public.point_access_permissions TO service_role;

-- COMMENT
COMMENT ON TABLE public.point_access_permissions IS
    '現場入場制限: 特定の地点に特定のドライバーが入場する際に使用必須の車両を定義する。エントリーが存在しない地点・ドライバーの組み合わせは制約なし（自由）として扱われる。';
