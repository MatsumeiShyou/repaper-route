-- Phase 3.1.1: Extend staffs table with app-specific metadata
-- Part of TBNY DXOS Vertical Integration (v3.1)

-- 1. Add Columns
-- staffs テーブルに profiles から引き継ぐべき市民属性を物理統合
ALTER TABLE IF EXISTS staffs 
ADD COLUMN IF NOT EXISTS device_mode text,
ADD COLUMN IF NOT EXISTS vehicle_info text,
ADD COLUMN IF NOT EXISTS can_edit_board boolean DEFAULT false;

-- 2. Migrate Data from profiles
-- profiles に残存しているデータを staffs へ移行 (id = auth.uid())
UPDATE staffs s
SET 
  device_mode = p.device_mode,
  vehicle_info = p.vehicle_info,
  can_edit_board = COALESCE(p.can_edit_board, false)
FROM profiles p
WHERE s.id = p.id::uuid;

-- 3. RLS Policies for staffs
-- 統合 OS 規格に準拠しつつ、自身の属性は自身で更新可能にする
ALTER TABLE staffs ENABLE ROW LEVEL SECURITY;

-- 全員がスタッフ名簿を参照可能 (配車板用)
DROP POLICY IF EXISTS "Staffs are viewable by all authenticated users" ON staffs;
CREATE POLICY "Staffs are viewable by all authenticated users" 
ON staffs FOR SELECT 
TO authenticated 
USING (true);

-- 自身のみが自身の属性を更新可能 (InteractionContext 用)
DROP POLICY IF EXISTS "Users can update their own staff metadata" ON staffs;
CREATE POLICY "Users can update their own staff metadata" 
ON staffs FOR UPDATE 
TO authenticated 
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);
