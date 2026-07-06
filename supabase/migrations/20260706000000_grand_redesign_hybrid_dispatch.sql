-- ==========================================================================
-- 20260706000000_grand_redesign_hybrid_dispatch.sql
-- Phase: Grand Redesign (ADR-0013)
-- Overview: ハイブリッド配車モデル（Course + Staff + Vehicle 三者独立構造）への
--           破壊的マイグレーション。旧Driver依存スキーマを完全に破棄し再構築する。
--
-- 【重要】本マイグレーションは破壊的（destructive）です。
-- 既存の配車関連データ（drivers, jobs, routes, board_actions等）は全て失われます。
-- 実行前に必ず ADR-0013 の承認を確認してください。
-- ==========================================================================

BEGIN;

-- ================================================================
-- SECTION 0: 安全弁 — 既存の依存オブジェクトを安全な順序で破棄
-- ================================================================

-- 0-1. トリガーの破棄（テーブルDROP前に明示的に除去）
DROP TRIGGER IF EXISTS tr_block_update_board_exceptions ON public.board_exceptions;
DROP TRIGGER IF EXISTS tr_block_delete_board_exceptions ON public.board_exceptions;

-- 0-2. RPC関数の破棄（全シグネチャバリアント）
DROP FUNCTION IF EXISTS public.rpc_execute_board_update(DATE, JSONB, JSONB);
DROP FUNCTION IF EXISTS public.rpc_execute_board_update(DATE, JSONB, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.rpc_execute_board_update(DATE, JSONB, TEXT, TEXT, UUID);
DROP FUNCTION IF EXISTS public.rpc_record_board_action(DATE, TEXT, JSONB, TEXT);
DROP FUNCTION IF EXISTS public.fn_block_exception_mutation();

-- 0-3. Viewの破棄（drivers依存の可能性があるもの）
DROP VIEW IF EXISTS public.vehicles CASCADE;

-- 0-4. テーブルの破棄（FK依存順: 子 → 親）
DROP TABLE IF EXISTS public.board_actions CASCADE;
DROP TABLE IF EXISTS public.board_exceptions CASCADE;
DROP TABLE IF EXISTS public.job_contents CASCADE;
DROP TABLE IF EXISTS public.splits CASCADE;
DROP TABLE IF EXISTS public.jobs CASCADE;
DROP TABLE IF EXISTS public.routes CASCADE;
DROP TABLE IF EXISTS public.drivers CASCADE;
-- logistics_vehicle_attrs は vehicles ビューが依存していた補助テーブル
DROP TABLE IF EXISTS public.logistics_vehicle_attrs CASCADE;

-- ================================================================
-- SECTION 1: ハイブリッド配車コアテーブルの構築
-- ================================================================

-- 1-1. courses（コース: 仕事の枠組み）
-- コースは「案件の集まり」であり、人にも車両にも依存しない独立したエンティティ。
CREATE TABLE public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,                        -- 例: '1号車ルート', '午後スポット'
    display_color TEXT DEFAULT '#4A90D9',       -- UI表示色
    display_order INTEGER DEFAULT 0,           -- 表示順
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.courses IS 'コース（仕事の枠組み）。人や車両から独立しており、配車計画の基本単位。';

-- 1-2. course_assignments（コースへの人・車両の割り当て）
-- 「このコースを、この日、この人が、この車両で走る」を表現するハイブリッドテーブル。
-- staff_id と vehicle_id は NULL 許容 = 「担当者未定」「車両未定」で計画が組める。
CREATE TABLE public.course_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    assigned_date DATE NOT NULL,               -- 割り当て日
    staff_id UUID REFERENCES public.staffs(id) ON DELETE SET NULL,    -- 担当スタッフ（NULL = 未定）
    vehicle_id UUID REFERENCES public.master_vehicles(id) ON DELETE SET NULL, -- 使用車両（NULL = 未定）
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- 同一日・同一コースの割り当ては1つだけ
    UNIQUE (course_id, assigned_date)
);

COMMENT ON TABLE public.course_assignments IS 'コースへの日別スタッフ・車両割り当て。ハイブリッドモデルの核心。';
COMMENT ON COLUMN public.course_assignments.staff_id IS 'NULL = 担当者未定。急な欠勤時はこの値だけを付け替えてリカバリーする。';

-- 1-3. jobs（案件: 回収先への訪問予定）
-- コースに紐づく個別の回収案件。
CREATE TABLE public.jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,  -- 未配車はNULL
    scheduled_date DATE NOT NULL,
    job_title TEXT,                             -- 案件名（顧客名等）
    customer_id TEXT,                           -- 回収先ID（master_collection_points.location_id）
    customer_name TEXT,                         -- 表示用顧客名（非正規化スナップショット）
    bucket_type TEXT,                           -- 品目分類
    start_time TEXT,                            -- 開始予定時刻 (HH:MM)
    duration_minutes INTEGER DEFAULT 15,        -- 予定所要時間
    area TEXT,                                  -- エリア
    note TEXT,                                  -- メモ
    is_spot BOOLEAN DEFAULT false,              -- スポット案件フラグ
    visit_slot TEXT,                            -- 訪問スロット制約 (AM/PM等)
    status TEXT DEFAULT 'planned',              -- planned / confirmed / completed / cancelled
    sort_order INTEGER DEFAULT 0,               -- コース内の並び順
    item_category TEXT,                         -- 主要品目カテゴリ
    location_id TEXT,                           -- master_collection_points.location_id へのトレーサビリティ
    address TEXT,                               -- 住所スナップショット
    creation_reason TEXT,                       -- 手動追加時の理由
    is_admin_forced BOOLEAN DEFAULT false,      -- 管理者による強制割り当て
    is_skipped BOOLEAN DEFAULT false,           -- スキップフラグ
    actual_time TEXT,                           -- 実績時刻
    weight_kg NUMERIC,                          -- 実績重量
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_jobs_scheduled_date ON public.jobs(scheduled_date);
CREATE INDEX idx_jobs_course_id ON public.jobs(course_id);
CREATE INDEX idx_jobs_status ON public.jobs(status);

COMMENT ON TABLE public.jobs IS '回収案件。コースに紐づき、日別に管理される。';

-- 1-4. job_contents（案件明細: 品目ごとの内容）
CREATE TABLE public.job_contents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    item_id UUID REFERENCES public.master_items(id) ON DELETE SET NULL,
    expected_weight_kg NUMERIC,
    actual_weight_kg NUMERIC,
    quantity NUMERIC,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_job_contents_job_id ON public.job_contents(job_id);

-- ================================================================
-- SECTION 2: 配車盤面の保存（ルートとタイムトラベル）
-- ================================================================

-- 2-1. routes（日別の盤面JSONB保存 + 確定スナップショット）
CREATE TABLE public.routes (
    scheduled_date DATE PRIMARY KEY,
    data JSONB DEFAULT '[]'::JSONB,             -- 盤面全体のJSONBスナップショット
    confirmed_snapshot JSONB,                   -- 確定時のスナップショット
    confirmed_at TIMESTAMPTZ,                   -- 確定日時
    source_app TEXT DEFAULT 'dxos',             -- 'commander' or 'dxos' (どのアプリから確定されたか)
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Edit Lock (排他制御)
    edit_locked_by UUID REFERENCES auth.users(id),
    edit_locked_at TIMESTAMPTZ,
    last_activity_at TIMESTAMPTZ
);

COMMENT ON TABLE public.routes IS '日別の配車盤面データ。Commanderからの流し込みとDXOSからの直接編集の両方に対応。';
COMMENT ON COLUMN public.routes.source_app IS 'commander: 配車係アプリから確定 / dxos: 管理者画面から直接編集';

-- 2-2. board_actions（タイムトラベル: 操作ログ）
CREATE TABLE public.board_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scheduled_date DATE NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    action_type TEXT NOT NULL,                  -- MOVE_JOB, UPDATE_TIME, REASSIGN_STAFF, SWAP_VEHICLE, etc.
    payload JSONB NOT NULL,
    reason TEXT,
    source_app TEXT DEFAULT 'dxos',             -- 操作元アプリ
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_board_actions_date ON public.board_actions(scheduled_date);
CREATE INDEX idx_board_actions_created_at ON public.board_actions(created_at);

COMMENT ON TABLE public.board_actions IS '配車盤の操作ログ（Event Sourcing）。action_typeがREASSIGN_STAFFに進化。';

-- 2-3. board_exceptions（例外記録: Append-Only監査ログ）
CREATE TABLE public.board_exceptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_date DATE NOT NULL,
    job_id UUID,                                -- UUID型に統一（旧TEXTから変更）
    exception_type TEXT NOT NULL,               -- MOVE, REASSIGN, SWAP, CANCEL, ADD
    before_state JSONB NOT NULL,
    after_state JSONB NOT NULL,
    reason_master_id UUID REFERENCES public.exception_reason_masters(id),
    reason_free_text TEXT,
    promote_requested BOOLEAN DEFAULT false,
    actor_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_board_exceptions_route_date ON public.board_exceptions(route_date);

-- Append-Only ガードレール
CREATE OR REPLACE FUNCTION public.fn_block_exception_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Updates and deletions to board_exceptions are prohibited. This is an append-only audit log.';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_block_update_board_exceptions
    BEFORE UPDATE ON public.board_exceptions
    FOR EACH ROW EXECUTE FUNCTION public.fn_block_exception_mutation();

CREATE TRIGGER tr_block_delete_board_exceptions
    BEFORE DELETE ON public.board_exceptions
    FOR EACH ROW EXECUTE FUNCTION public.fn_block_exception_mutation();

-- ================================================================
-- SECTION 3: 評価システム（Global Shared: 全アプリ共有）
-- ================================================================

-- 3-1. contributions（代替貢献ログ）
CREATE TABLE public.contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID NOT NULL REFERENCES public.staffs(id) ON DELETE CASCADE,
    target_date DATE NOT NULL,
    contribution_type TEXT NOT NULL,            -- 'wash', 'training', 'office', 'substitute_driving'
    points INTEGER NOT NULL DEFAULT 0,
    note TEXT,                                  -- メモ（任意）
    created_by UUID REFERENCES auth.users(id),  -- 記録者
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contributions_staff_date ON public.contributions(staff_id, target_date);
CREATE INDEX idx_contributions_date ON public.contributions(target_date);

COMMENT ON TABLE public.contributions IS '多次元評価: 代替貢献ログ。全アプリ（Commander/DXOS/Driver）から共有参照・書き込み。';

-- 3-2. 動的ETA取得用RPC
CREATE OR REPLACE FUNCTION public.get_dynamic_eta(p_customer TEXT, p_bucket TEXT)
RETURNS INTEGER AS $$
DECLARE
    v_avg_duration INTEGER;
BEGIN
    SELECT COALESCE(AVG(j.duration_minutes)::INTEGER, 15)
    INTO v_avg_duration
    FROM (
        SELECT j_inner.duration_minutes
        FROM public.jobs j_inner
        WHERE j_inner.customer_name = p_customer
          AND j_inner.bucket_type = p_bucket
          AND j_inner.status = 'completed'
          AND j_inner.duration_minutes > 0
          AND j_inner.duration_minutes < 1440
        ORDER BY j_inner.updated_at DESC
        LIMIT 5
    ) j;

    RETURN v_avg_duration;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.get_dynamic_eta IS '過去の完了実績（直近5件）から平均所要時間を算出する動的ETA関数。';

-- 3-3. 多次元スコア集計RPC
CREATE OR REPLACE FUNCTION public.get_multidimensional_scores(p_date DATE)
RETURNS JSONB AS $$
DECLARE
    v_team_kpi INTEGER := 0;
    v_total_jobs INTEGER := 0;
    v_completed_jobs INTEGER := 0;
    v_result JSONB;
BEGIN
    -- A. チーム連帯スコア（その日のジョブ完了率）
    SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'completed')
    INTO v_total_jobs, v_completed_jobs
    FROM public.jobs
    WHERE scheduled_date = p_date;

    IF v_total_jobs > 0 THEN
        v_team_kpi := (v_completed_jobs::FLOAT / v_total_jobs::FLOAT * 100)::INTEGER;
    ELSE
        v_team_kpi := 100;
    END IF;

    -- B. 各スタッフのスコア集計
    SELECT jsonb_agg(
        jsonb_build_object(
            'staff_id', s.staff_id,
            'staff_name', st.name,
            'contribution_score', COALESCE(c.total_points, 0),
            'completion_score', COALESCE(j.completed_count, 0),
            'team_kpi_score', v_team_kpi
        )
    )
    INTO v_result
    FROM (
        -- course_assignments 経由でその日に割り当てられたスタッフ
        SELECT DISTINCT ca.staff_id
        FROM public.course_assignments ca
        WHERE ca.assigned_date = p_date AND ca.staff_id IS NOT NULL
        UNION
        -- contributions で貢献記録があるスタッフ
        SELECT DISTINCT con.staff_id
        FROM public.contributions con
        WHERE con.target_date = p_date
    ) s
    LEFT JOIN public.staffs st ON s.staff_id = st.id
    LEFT JOIN (
        SELECT con2.staff_id, SUM(con2.points) as total_points
        FROM public.contributions con2
        WHERE con2.target_date = p_date
        GROUP BY con2.staff_id
    ) c ON s.staff_id = c.staff_id
    LEFT JOIN (
        SELECT ca2.staff_id, COUNT(*) as completed_count
        FROM public.course_assignments ca2
        JOIN public.jobs j2 ON j2.course_id = ca2.course_id AND j2.scheduled_date = ca2.assigned_date
        WHERE ca2.assigned_date = p_date AND j2.status = 'completed'
        GROUP BY ca2.staff_id
    ) j ON s.staff_id = j.staff_id;

    RETURN COALESCE(v_result, '[]'::JSONB);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.get_multidimensional_scores IS '多次元評価スコア集計。全アプリから呼び出し可能（Global Shared）。';

-- ================================================================
-- SECTION 4: Commander からの確定計画受け取り API
-- ================================================================

-- Commanderが「確定」ボタンを押した際に呼ばれる一方向流し込み（One-Way Publish）API。
-- p_plan_data の期待構造:
-- {
--   "courses": [
--     {
--       "course_id": "uuid",
--       "course_name": "1号車ルート",
--       "staff_id": "uuid or null",
--       "vehicle_id": "uuid or null",
--       "jobs": [
--         { "id": "uuid", "customer_name": "...", "start_time": "08:30", "duration_minutes": 15, ... }
--       ]
--     }
--   ]
-- }
CREATE OR REPLACE FUNCTION public.rpc_commit_commander_plan(
    p_date DATE,
    p_plan_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_course JSONB;
    v_job JSONB;
    v_course_id UUID;
    v_result JSONB;
BEGIN
    -- 1. 既存の当日データをクリア（Commander確定 = 盤面リセット）
    DELETE FROM public.job_contents WHERE job_id IN (
        SELECT id FROM public.jobs WHERE scheduled_date = p_date
    );
    DELETE FROM public.jobs WHERE scheduled_date = p_date;
    DELETE FROM public.course_assignments WHERE assigned_date = p_date;

    -- 2. コースごとにデータを流し込む
    FOR v_course IN SELECT * FROM jsonb_array_elements(p_plan_data->'courses') LOOP
        v_course_id := (v_course->>'course_id')::UUID;

        -- 2-1. コースマスタの確認・作成（新規コースの場合）
        INSERT INTO public.courses (id, name, display_color, display_order)
        VALUES (
            v_course_id,
            COALESCE(v_course->>'course_name', '新規コース'),
            COALESCE(v_course->>'display_color', '#4A90D9'),
            COALESCE((v_course->>'display_order')::INTEGER, 0)
        )
        ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            display_color = EXCLUDED.display_color,
            display_order = EXCLUDED.display_order,
            updated_at = NOW();

        -- 2-2. 割り当て（staff_id, vehicle_id）
        INSERT INTO public.course_assignments (course_id, assigned_date, staff_id, vehicle_id)
        VALUES (
            v_course_id,
            p_date,
            CASE WHEN v_course->>'staff_id' IS NOT NULL
                 THEN (v_course->>'staff_id')::UUID
                 ELSE NULL END,
            CASE WHEN v_course->>'vehicle_id' IS NOT NULL
                 THEN (v_course->>'vehicle_id')::UUID
                 ELSE NULL END
        )
        ON CONFLICT (course_id, assigned_date) DO UPDATE SET
            staff_id = EXCLUDED.staff_id,
            vehicle_id = EXCLUDED.vehicle_id,
            updated_at = NOW();

        -- 2-3. ジョブの流し込み
        IF v_course ? 'jobs' AND jsonb_typeof(v_course->'jobs') = 'array' THEN
            FOR v_job IN SELECT * FROM jsonb_array_elements(v_course->'jobs') LOOP
                INSERT INTO public.jobs (
                    id, course_id, scheduled_date, job_title, customer_name,
                    bucket_type, start_time, duration_minutes, area, note,
                    is_spot, visit_slot, status, sort_order, item_category,
                    location_id, address, creation_reason
                )
                VALUES (
                    COALESCE((v_job->>'id')::UUID, gen_random_uuid()),
                    v_course_id,
                    p_date,
                    v_job->>'job_title',
                    v_job->>'customer_name',
                    v_job->>'bucket_type',
                    v_job->>'start_time',
                    COALESCE((v_job->>'duration_minutes')::INTEGER, 15),
                    v_job->>'area',
                    v_job->>'note',
                    COALESCE((v_job->>'is_spot')::BOOLEAN, false),
                    v_job->>'visit_slot',
                    COALESCE(v_job->>'status', 'planned'),
                    COALESCE((v_job->>'sort_order')::INTEGER, 0),
                    v_job->>'item_category',
                    v_job->>'location_id',
                    v_job->>'address',
                    v_job->>'creation_reason'
                )
                ON CONFLICT (id) DO UPDATE SET
                    course_id = EXCLUDED.course_id,
                    job_title = EXCLUDED.job_title,
                    customer_name = EXCLUDED.customer_name,
                    bucket_type = EXCLUDED.bucket_type,
                    start_time = EXCLUDED.start_time,
                    duration_minutes = EXCLUDED.duration_minutes,
                    area = EXCLUDED.area,
                    note = EXCLUDED.note,
                    status = EXCLUDED.status,
                    sort_order = EXCLUDED.sort_order,
                    updated_at = NOW();
            END LOOP;
        END IF;
    END LOOP;

    -- 3. routes テーブルへ確定スナップショットを保存
    INSERT INTO public.routes (scheduled_date, data, confirmed_snapshot, confirmed_at, source_app, updated_at)
    VALUES (p_date, p_plan_data, p_plan_data, NOW(), 'commander', NOW())
    ON CONFLICT (scheduled_date) DO UPDATE SET
        data = EXCLUDED.data,
        confirmed_snapshot = EXCLUDED.confirmed_snapshot,
        confirmed_at = NOW(),
        source_app = 'commander',
        updated_at = NOW();

    -- 4. board_actions にコミットログを記録
    INSERT INTO public.board_actions (scheduled_date, user_id, action_type, payload, source_app)
    VALUES (p_date, auth.uid(), 'COMMANDER_PLAN_COMMIT', p_plan_data, 'commander');

    -- 5. 結果の返却
    v_result := jsonb_build_object(
        'success', true,
        'message', 'Commander plan committed successfully',
        'committed_at', NOW()
    );

    RETURN v_result;

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$;

COMMENT ON FUNCTION public.rpc_commit_commander_plan IS 'Commanderからの確定計画を受け取るOne-Way Publish API。';

-- ================================================================
-- SECTION 5: RLS（行レベルセキュリティ）ポリシーの設定
-- ================================================================

-- courses
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "courses_select_authenticated" ON public.courses FOR SELECT TO authenticated USING (true);
CREATE POLICY "courses_all_authenticated" ON public.courses FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- course_assignments
ALTER TABLE public.course_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "assignments_select_authenticated" ON public.course_assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "assignments_all_authenticated" ON public.course_assignments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- jobs
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "jobs_select_all" ON public.jobs FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "jobs_all_authenticated" ON public.jobs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- job_contents
ALTER TABLE public.job_contents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "job_contents_select_all" ON public.job_contents FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "job_contents_all_authenticated" ON public.job_contents FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- routes
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "routes_select_authenticated" ON public.routes FOR SELECT TO authenticated USING (true);
CREATE POLICY "routes_all_authenticated" ON public.routes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- board_actions
ALTER TABLE public.board_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "board_actions_select_authenticated" ON public.board_actions FOR SELECT TO authenticated USING (true);
CREATE POLICY "board_actions_insert_authenticated" ON public.board_actions FOR INSERT TO authenticated WITH CHECK (true);

-- board_exceptions
ALTER TABLE public.board_exceptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "board_exceptions_select_authenticated" ON public.board_exceptions FOR SELECT TO authenticated USING (true);
CREATE POLICY "board_exceptions_insert_authenticated" ON public.board_exceptions FOR INSERT TO authenticated WITH CHECK (true);

-- contributions
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contributions_select_all" ON public.contributions FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "contributions_all_authenticated" ON public.contributions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ================================================================
-- SECTION 6: GRANT（権限付与）
-- ================================================================

GRANT ALL ON TABLE public.courses TO authenticated, anon, service_role;
GRANT ALL ON TABLE public.course_assignments TO authenticated, anon, service_role;
GRANT ALL ON TABLE public.jobs TO authenticated, anon, service_role;
GRANT ALL ON TABLE public.job_contents TO authenticated, anon, service_role;
GRANT ALL ON TABLE public.routes TO authenticated, anon, service_role;
GRANT ALL ON TABLE public.board_actions TO authenticated, service_role;
GRANT ALL ON TABLE public.board_exceptions TO authenticated, service_role;
GRANT ALL ON TABLE public.contributions TO authenticated, anon, service_role;

GRANT EXECUTE ON FUNCTION public.rpc_commit_commander_plan(DATE, JSONB) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_dynamic_eta(TEXT, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_multidimensional_scores(DATE) TO authenticated, anon;

-- ================================================================
-- SECTION 7: 初期データ（コースのシード）
-- ================================================================

-- Commander のプロトタイプで使用していたコースをシードデータとして投入
INSERT INTO public.courses (id, name, display_color, display_order) VALUES
    ('c1000000-0000-0000-0000-000000000001', '1号車ルート', '#4A90D9', 1),
    ('c1000000-0000-0000-0000-000000000002', '2号車ルート', '#7ED321', 2),
    ('c1000000-0000-0000-0000-000000000003', '3号車ルート', '#F5A623', 3),
    ('c1000000-0000-0000-0000-000000000004', '4号車ルート', '#D0021B', 4),
    ('c1000000-0000-0000-0000-000000000005', '午後スポット', '#9013FE', 5)
ON CONFLICT (id) DO NOTHING;

-- Schema reload notification
NOTIFY pgrst, 'reload schema';

COMMIT;
