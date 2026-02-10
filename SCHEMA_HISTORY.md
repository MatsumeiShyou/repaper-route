# Supabase Schema 拡張履歴

このドキュメントは、データベーススキーマの拡張履歴を時系列で記録します。

---

## Phase 0: 基盤構築（Initial Setup）
**日付**: 2026-01月中旬（推定）  
**目的**: アプリケーションの基本機能実装

### 追加テーブル
- **drivers** - ドライバー管理（運転手、車番、コース、色分け）
- **jobs** - 業務・案件管理（回収時間、所要時間、バケツ）
- **splits** - 車両交代・中継管理（乗り換え、スライド）

### 理由
配車管理アプリケーションのコア機能を実現するため、ドライバーと業務データの管理テーブルを作成。

---

## Phase 1: 品目管理拡張（Item Management）
**日付**: 2026-02-04（推定）  
**目的**: 回収品目の詳細管理と顧客マスタ連携

### 追加テーブル
- **items** - 品目マスタ（燃えるゴミ、段ボール、発泡スチロールなど）
- **customers** - 顧客マスタ（取引先、回収先、スケジュール設定）
- **customer_items** - 顧客-品目関連（回収品目設定）
- **job_items** - 回収実績-品目関連（実際の回収記録）

### 理由
要件定義書 ver 6.0 対応。回収品目の詳細追跡と、顧客ごとの回収品目管理を実現。

**参考**: `supabase_schema_v2.sql`（アーカイブ済み）

---

## Phase 1.5: 認証機能追加（Authentication）
**日付**: 2026-02-06 | Phase 2.3: Edit Permission Control (RBAC) | profiles テーブルに can_edit_board カラム追加 | 特定ユーザーのみボード編集可能にする RBAC 実装
2026-02-06 | Phase 3.2: Bucket System Redesign (Blueprint v2.1) | jobs テーブルに is_spot, time_constraint, task_type, vehicle_lock カラム追加 | 制約ベースの4バケット分類システム（全て/スポット/時間指定/特殊案件）に対応
**目的**: ユーザー認証とログイン機能の実装

### 追加テーブル
- **profiles** - 認証・プロファイル管理（ユーザーマスタ、ロール管理）

### 理由
De-mocking フェーズの一環として、ハードコードされたユーザー情報をデータベース管理へ移行。

**参考**: `supabase_profiles_schema.sql`（アーカイブ済み）

---

## Phase 2: スキーマ統合（Schema Unification）
**日付**: 2026-02-05  
**目的**: 複数のスキーマファイルを1つに統合し、保守性向上

### 変更内容
- 3つのスキーマファイル（`supabase_schema.sql`, `supabase_schema_v2.sql`, `supabase_profiles_schema.sql`）を統合
- `supabase_schema_unified.sql` へ集約
- 詳細な目次コメントとセクション分けを追加

### 理由
- 実行順序の明確化
- データ整合性の向上（外部キー制約の正確な定義）
- 初期構築の簡易化（1コマンドで完了）

### 改善点
- ファイル冒頭に詳細な目次を追加（視認性向上）
- 拡張履歴を本ファイルで管理（履歴の可視化）
- アーカイブディレクトリで旧ファイルを保管（Git履歴との連携）

**参考**: 
- `_archived/supabase_schema.sql`
- `_archived/supabase_schema_v2.sql`
- `_archived/supabase_profiles_schema.sql`

---

## Phase 2.5: 実構造反映（Actual Schema Reflection）
**日付**: 2026-02-05  
**目的**: 実際のSupabase構造と統合スキーマの不整合を修正

### 発見された問題
- 統合スキーマと実際のSupabaseで **テーブル名、カラム数、ID型** が異なる
- **`routes` テーブルが欠落**（BoardCanvasが使用するが統合スキーマに未定義）
- `jobs` テーブルに余分な9カラムが追加されていた

### 修正内容
- **新規作成**: `supabase_schema_actual.sql`（実際の9テーブル構造を反映）
- **テーブル名修正**:
  - `customer_items` → `customer_item_defaults`（2カラムのシンプル版）
  - `job_items` → `job_contents`（重量カラム名が異なる）
- **ID型修正**:
  - `items.id`: text → **UUID**
  - `job_contents.id`: text → **UUID**
  - `job_contents.item_id`: text → **UUID**
- **jobs テーブル**: 20カラム版を反映（driver_name, vehicle_name, customer_name, item_category, weight_kg, special_notes, is_synced_to_sheet, work_type, task_details を追加）
- **routes テーブル追加**: 配車計画のスナップショット保存用（date, jobs, drivers, splits, pending）

### 改善点
- **冪等性**: 全テーブルに `IF NOT EXISTS`、全データに `ON CONFLICT DO NOTHING`
- **簡潔な構造**: コメントを最小化、セクション番号で折りたたみ対応
- **履歴の可視化**: 各テーブルに由来Phase番号を記載

**参考**: 
- `supabase_schema_actual.sql`（新規）
- `_archived/supabase_schema_unified.sql`（旧統合ファイル）

---

## Phase 2.2: 排他的編集ロック（Exclusive Edit Lock）
**日付**: 2026-02-06  
**目的**: 編集競合の事前防止、緊急変更対応、新人研修対応

### 追加カラム
- **routes.edit_locked_by** - 編集権保持ユーザーID（TEXT, NULL可）
- **routes.edit_locked_at** - ロック取得時刻（TIMESTAMP WITH TIME ZONE, NULL可）
- **routes.last_activity_at** - 最終操作時刻（TIMESTAMP WITH TIME ZONE, NULL可）

### 機能
- 編集権トークン方式（1人のみ編集可能）
- 15分無操作でタイムアウト → 自動解放
- ハートビート（1分ごとのアクティビティ更新）
- 閲覧専用モード（編集権がないユーザー）

### 理由
- 緊急変更時のデータロス防止（Phase 2のOptimistic Lockと併用）
- 新人研修での閲覧専用モード提供
- 編集中ユーザーの可視化

**参考**: `supabase_migration_phase2.2.sql`

---

## Phase 6: 複数品目管理（Multi-Item Management）
**日付**: 2026-02-08  
**目的**: 顧客ごとのきめ細やかな品目管理と、各回収案件ごとの実績追記

### 追加テーブル
- **master_items**: 品目マスタ（名称、単位、表示順）。Phase 1の`items`を再定義・UUID化。
- **customer_item_defaults**: 顧客ごとの初期品目セット。Phase 1の`customer_items`をSDRアーキテクチャ(`master_collection_points`紐付け)に適合。

### 変更点
- `routes` テーブル (JSONB): `jobs` 内に `items` 配列を持たせ、リアルタイム性を維持しつつリレーショナルに管理。
- **SDR準拠**: `customer_id` は `master_collection_points` を参照。

**参考**: `supabase_migration_phase6.sql`

---

## 今後の拡張予定

### Phase 3: 外部キー制約強化（予定）
- `drivers.user_id → profiles.id` の外部キー制約追加
- データ整合性のさらなる強化

### Phase 4: ルート管理機能（予定）
- `routes` テーブルの追加（配送ルート最適化）

---

## 参考情報

### テーブル数の推移
- Phase 0: 3テーブル（drivers, jobs, splits）
- Phase 1: +4テーブル（items, customers, customer_items, job_items） = 7テーブル
- Phase 1.5: +1テーブル（profiles） = **8テーブル**
- Phase 2.5: routes テーブル = **9テーブル**
- Phase 6: +2テーブル（master_items, customer_item_defaults）= **11テーブル**

### アーカイブ
旧スキーマファイルは `_archived/` ディレクトリに保管されています。詳細は `_archived/README.md` を参照してください。
