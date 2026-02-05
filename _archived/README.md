# アーカイブ済みスキーマファイル

このディレクトリには、統合前の旧スキーマファイルが保管されています。

## ファイル一覧

- **supabase_schema.sql** - 基本テーブル（drivers, jobs, splits）
- **supabase_schema_v2.sql** - 拡張テーブル（items, customers, customer_items, job_items）
- **supabase_profiles_schema.sql** - 認証テーブル（profiles）

## 統合後の構成

現在は以下の1ファイルに統合されています：

- **supabase_schema_unified.sql** - 全テーブルを含む統合スキーマファイル

## 理由

- 実行順序の明確化
- データ整合性の向上（外部キー制約の正確な定義）
- 保守性の向上（1ファイルで完結）

## アーカイブ日

2026-02-05
