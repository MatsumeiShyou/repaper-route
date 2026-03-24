-- テンプレート管理機能の拡張: 欠員想定数と説明文の追加
-- 100点統治 (AGENTS.md) に基づき、データの整合性を保証する制約を付与

ALTER TABLE public.board_templates 
ADD COLUMN IF NOT EXISTS absent_count SMALLINT NOT NULL DEFAULT 0 CHECK (absent_count >= 0),
ADD COLUMN IF NOT EXISTS description TEXT;

COMMENT ON COLUMN public.board_templates.absent_count IS 'このテンプレートでの欠員想定数（キャパシティ設計値）';
COMMENT ON COLUMN public.board_templates.description IS 'テンプレートの運用目的や注意点のメモ';
