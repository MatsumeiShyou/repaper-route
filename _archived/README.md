# アーカイブ済みスキーマファイル

このディレクトリには、統合前・統合後の旧スキーマファイルが保管されています。

## ファイル一覧

### Phase 0-1.5 個別ファイル（2026-02-05 午前）

- **supabase_schema.sql** - 基本テーブル（drivers, jobs, splits）
- **supabase_schema_v2.sql** - 拡張テーブル（items, customers, customer_items, job_items）
- **supabase_profiles_schema.sql** - 認証テーブル（profiles）

### Phase 2 統合（2026-02-05 午後）

- **supabase_schema_unified_v1.sql** - 初回統合版（実構造と不整合あり）

## 現在の構成（Phase 2.5）

現在は以下のファイルが最新です：

- **supabase_schema_actual.sql** - 実際のSupabase構造を反映した統合スキーマ（9テーブル、冪等性対応）

## Phase 2.5での主な変更

- `routes` テーブル追加（配車計画保存用）
- テーブル名修正（customer_items → customer_item_defaults、job_items → job_contents）
- ID型修正（items, job_contents: text → UUID）
- jobs テーブルを20カラム版に修正
- 冪等性対応（IF NOT EXISTS, ON CONFLICT DO NOTHING）

## アーカイブ日

- Phase 0-1.5: 2026-02-05 午前
- Phase 2: 2026-02-05 午後
