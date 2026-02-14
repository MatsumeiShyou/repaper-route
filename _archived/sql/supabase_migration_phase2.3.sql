-- ==========================================
-- Phase 2.3: Edit Permission Control (RBAC)
-- 編集権限制御の追加
-- ==========================================
-- 実行日: 2026-02-06
-- 目的: 特定ユーザーのみが編集権を取得できるようにする

-- カラム追加（冪等性対応）
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS can_edit_board BOOLEAN DEFAULT false;

-- 既存のADMINユーザーに編集権限を付与（後方互換性）
UPDATE profiles 
SET can_edit_board = true 
WHERE role = 'ADMIN';

-- インデックス追加（権限チェックの高速化）
CREATE INDEX IF NOT EXISTS idx_profiles_edit_permission 
ON profiles(user_id, can_edit_board);
