-- Phase 6: テンプレート管理機能の基盤
-- 第N曜日指定をサポートするテンプレートテーブルの新設

CREATE TABLE IF NOT EXISTS public.board_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    day_of_week SMALLINT NOT NULL DEFAULT 1 CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sun, 1=Mon, ..., 6=Sat
    nth_week SMALLINT CHECK (nth_week BETWEEN 1 AND 5), -- NULL は「毎週」を意味する
    jobs_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    drivers_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    splits_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS 設定
ALTER TABLE public.board_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select for all authenticated users"
    ON public.board_templates FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow insert/update for authorized users"
    ON public.board_templates FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_board_templates_updated_at ON public.board_templates;
CREATE TRIGGER update_board_templates_updated_at
    BEFORE UPDATE ON public.board_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ユニーク制約
CREATE UNIQUE INDEX IF NOT EXISTS idx_board_templates_periodic_unique 
ON public.board_templates (name);

COMMENT ON TABLE public.board_templates IS '第N曜日指定をサポートする配車テンプレート。SDRモデルに基づき判断の資産化を担う。';
