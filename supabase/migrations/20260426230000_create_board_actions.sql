-- 20260426230000_create_board_actions.sql
-- Phase: 13 (Time Machine / Event Sourcing)
-- Overview: 個別の操作（Action）を記録する基盤と、盤面キャッシュ用カラムの追加

-- 1. board_actions テーブルの作成
CREATE TABLE IF NOT EXISTS public.board_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    action_type TEXT NOT NULL, -- 'MOVE_JOB', 'UPDATE_TIME', 'REASSIGN_DRIVER', 'DELETE_COLUMN', 'RESET_TIMELINE' など
    payload JSONB NOT NULL,    -- 差分データ
    reason TEXT,               -- 確定案件変更時の理由
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックスの追加
CREATE INDEX IF NOT EXISTS idx_board_actions_date ON public.board_actions(date);
CREATE INDEX IF NOT EXISTS idx_board_actions_created_at ON public.board_actions(created_at);

-- 2. routes テーブルへのキャッシュカラム追加
ALTER TABLE public.routes 
ADD COLUMN IF NOT EXISTS current_snapshot JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS last_action_id UUID REFERENCES public.board_actions(id) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS action_count INTEGER DEFAULT 0;

-- 3. RLS設定
ALTER TABLE public.board_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read actions" 
ON public.board_actions FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow authenticated users to insert actions" 
ON public.board_actions FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- コメント追加
COMMENT ON TABLE public.board_actions IS '配車盤における個別の操作ログ（Event Sourcingの核）';
COMMENT ON COLUMN public.routes.current_snapshot IS 'Actionログを適用した最新の盤面キャッシュ（Projection）';
