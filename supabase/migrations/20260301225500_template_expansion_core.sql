-- 20260301225500_template_expansion_core.sql
-- Description: Add fields for Template Expansion and Two-Phase Confirmation

-- 1. [jobs] テーブルの拡張
-- 計画と実績の分離、および管理者による強制操作のフラグを追加
ALTER TABLE "public"."jobs" 
ADD COLUMN IF NOT EXISTS "is_admin_forced" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "is_skipped" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "preferred_time" timestamp with time zone,
ADD COLUMN IF NOT EXISTS "actual_time" timestamp with time zone;

COMMENT ON COLUMN "public"."jobs"."is_admin_forced" IS '管理者によって制約を無視して配置されたか（L1/L2バイパス）';
COMMENT ON COLUMN "public"."jobs"."is_skipped" IS '案件が意図的にスキップ（未実施）されたか（判断の蓄積）';
COMMENT ON COLUMN "public"."jobs"."preferred_time" IS '顧客希望時間（計画の正典）';
COMMENT ON COLUMN "public"."jobs"."actual_time" IS '運用・実績時間（例外の記録）';



-- 3. RLS（Row Level Security）の調整（必要に応じて）
-- 管理者フラグ等の変更を制限するポリシーは、今後のセキュリティ要件に合わせて適用。
