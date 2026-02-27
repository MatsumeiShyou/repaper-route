-- Phase 5: マスタ非連動データ（モック）のパージと外部キー制約の追加

-- 1. マスタに存在しない customer_id を持つ孤立ジョブの削除
-- スポット案件など例外が許される設計の場合でも、現在配車盤上で不整合を起こしている
-- テストデータ（customer_id IS NULL または location_id の不正値）を一括でパージします。
DELETE FROM "public"."jobs" 
WHERE "customer_id" IS NULL
   OR "customer_id" NOT IN (SELECT "location_id" FROM "public"."master_collection_points");

-- 2. 外部キー制約の追加
-- jobs テーブルから master_collection_points テーブルへの参照整合性を強制します。
-- ※jobs側のカラムは現状 customer_id を参照用として運用しているため、それに制約を掛けます
ALTER TABLE "public"."jobs"
  DROP CONSTRAINT IF EXISTS "jobs_customer_id_fkey",
  ADD CONSTRAINT "jobs_customer_id_fkey"
  FOREIGN KEY ("customer_id")
  REFERENCES "public"."master_collection_points" ("location_id")
  ON UPDATE CASCADE
  ON DELETE RESTRICT;
