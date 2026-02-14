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
**日付**: 2026-02-06  
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

## Phase 2.3: 編集権限制御（Edit Permission Control / RBAC）
**日付**: 2026-02-06  
**目的**: 特定ユーザーのみボード編集可能にする RBAC 実装

### 変更内容
- **profiles テーブル**: `can_edit_board` カラム追加

### 理由
管理者権限による編集制御の実現。新人研修時の閲覧専用モードと併用。

---

## Phase 3.2: バケットシステム再設計（Bucket System Redesign / Blueprint v2.1）
**日付**: 2026-02-06  
**目的**: 制約ベースの4バケット分類システム（全て/スポット/時間指定/特殊案件）に対応

### 変更内容
- **jobs テーブル**: `is_spot`, `time_constraint`, `task_type`, `vehicle_lock` カラム追加

### 理由
要件定義書に基づく高度な案件分類の実現。単純なリストから制約ベースの動的分類へ移行。

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

---

## Phase 11: 安定化 (Stabilization)
**日付**: 2026-02-11
**目的**: バグ修正とスキーマ整合性の確保

### 変更内容
- **drivers テーブル修正**: `display_order` カラム (INTEGER) を追加。
- **理由**: Frontend (`useMasterData.js`) が `display_order` でソートを行っており、カラム欠落により 400 Bad Request が発生していたため。


### Phase 11.1: Persistence Fix (Schema/RPC Recovery)
**日付**: 2026-02-11
**目的**: 保存機能の400エラー解消（`routes`テーブルと`rpc_execute_board_update`の復元）

### 変更内容
- **Create Table**: `routes` (date, jobs, drivers, splits, pending, lock columns)
- **Create RPC**: `rpc_execute_board_update` (JSONBによるUpsertロジック)


### Phase 11.2: Jobs RLS Fix
**日付**: 2026-02-11
**目的**: `jobs`テーブルの400エラー解消（認証ユーザーのSELECT権限復旧）

### 変更内容
- **Policy Reset**: 既存のポリシーを削除し、`authenticated` 向けのSELECT/ALL許可ポリシーを再作成。
- **Grant**: `authenticated` ロールへのアクセス権を明示的に付与。

**参考**: `20260211100000_fix_jobs_rls.sql`

---

## Phase 3: データ整合性強化（Data Integrity）
**日付**: 2026-02-14
**目的**: 外部キー制約の強化および論理削除（アーカイブ）基盤の構築

### 変更内容
- **drivers テーブル**: `user_id` から `profiles.id` への外部キー制約 `fk_drivers_profiles` を追加。
- **is_active カラム追加 (BOOLEAN, default true)**:
    - `master_collection_points`
    - `vehicles`
    - `master_items`
- **理由**: 物理削除による「歴史（証跡）の抹消」を防止し、SDRモデルにおける判断の追跡可能性を担保するため。

**参考**: `20260214110000_phase3_integrity.sql`

---

## Phase 4: 基盤・拡張分離モデル (Core/Extension Separation)
**日付**: 2026-02-14
**目的**: 将来の全社OS統合を見据えた車両マスタの再設計

### 変更内容
- **Core レイヤー**: `master_vehicles` テーブル（全アプリ共通ID/車番/アクティブフラグ）。
- **Extension レイヤー**: `logistics_vehicle_attrs` テーブル（配車アプリ特有の属性：積載量、燃料、車種）。
- **互換性 View**: `vehicles` ビューを提供し、既存の読み取りコードの修正を回避。
- **SDR RPC**: `rpc_execute_master_update` を実装。マスタ変更時に理由の入力をシステムレベルで強制し、`decisions` へ証跡を自動刻印。

**理由**: 単一の巨大なテーブル（神クラス）化を防ぎ、将来の車両管理アプリ等が干渉せずにマスタを共有できるようにするため。

**参考**: `20260214120000_core_ext_separation.sql`

---

## Phase 4.1: 車両名の導入 (Vehicle Name / Callsign)
**日付**: 2026-02-14
**目的**: 現場の運用（略称）と正式な車籍管理の分離・統合

### 変更内容
- **Core 層拡張**: `master_vehicles` テーブルに `callsign` カラムを追加。UI上は「車両名」として扱う。
- **View 更新**: `vehicles` ビューを更新し、`callsign` を含める。
- **SDR RPC 拡張**: `rpc_execute_master_update` を修正。車両名の更新をサポート。

**理由**: 配車盤などの視認性が重要な場面で、「車両名（2267PK等）」を優先表示しつつ、DB上で正式な登録番号を管理できるようにするため。

**参考**: `20260214130000_vehicle_callsign.sql`

---

## Phase 5: 汎用マスタRPC & スキーマ整理 (Generalized Master RPC & Schema Polish)
**日付**: 2026-02-14
**目的**: マスタ管理の標準化と一貫した監査証跡の確保

### 変更内容
- **スキーマ調整**: 以下の各テーブルに `updated_at` カラムを追加。
    - `profiles`
    - `drivers`
    - `master_items`
    - `master_collection_points`
- **汎用 RPC 導入**: `rpc_execute_master_update` を拡張。
    - 車両、品目、回収先、ドライバー、ユーザーの 5 大マスタに対応。
    - テーブルごとの ID 型（UUID/TEXT）の相違を自動吸収。
    - 常に `decision_proposals` および `decisions` へ SDR 証跡を記録。
- **UI 統合**: 全てのマスタ管理画面から共通の RPC を使用する仕組みを確立。

**理由**: マスタごとにバラバラだった更新ロジックを統合し、全社的な「ガバナンスとしての OS」の品質を向上させるため。

**参考**: `20260214150000_general_master_rpc.sql`

---

---

## Phase 17: ドライバー・イベント・コントラクト (Driver Event Contract)
**日付**: 2026-02-14
**目的**: ドライバーアプリ（Hands）と管理画面（Brain）の疎結合な状態同期の確立

### 変更内容
- **新規 RPC**: `rpc_apply_driver_event`
    - ドライバーからのイベント（到着・完了・重量入力等）を単一窓口で受理。
    - **SDR同期**: `decision_proposals` および `decisions` テーブルへ証跡を自動記録。
    - **State同期**: `routes` テーブル内の JSONB データを、イベント内容に基づきアトミックに部分更新。
- **仕様更新**: `SHARED_SPECS.md` の改訂。物理DB構造と型定義を完全アライメント。

**理由**: ドライバーアプリが外部環境（AI Studio）で開発中であることを考慮し、DB側に堅牢な「アンカー（契約）」を設置することで、並行開発と将来の統合を安全に行うため。

**参考**: `20260214170000_driver_event_contract.sql`

---

## Phase 18: 緊急RPC修復と基盤・拡張モデルの標準化 (Emergency RPC & Schema Repair)
**日付**: 2026-02-14
**目的**: 開発途上で発生したRPC定義の不整合およびCore/Extensionモデルの不完全な状態の緊急修復

### 変更内容
- **不整合修復**: `rpc_execute_master_update` のシグネチャ重複を解消し、堅牢な統一RPCとして再定義。
- **Core/Extモデルの物理的一貫性**: `master_vehicles` と `logistics_vehicle_attrs` の関係性を再構築し、互換Viewを再定義。
- **証跡の標準化**: `decision_proposals` および `decisions` テーブルへの書き込みを完全にSDRスキーマにアライメント。

**理由**: 連続的な機能追加に伴い発生した「技術的ドリフト」を解消し、システム全体の整合性と稼働継続性を確保するため。

**参考**: `20260214990000_repair_rpc.sql`
