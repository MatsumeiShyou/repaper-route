# アクティブタスク: RePaper Route 実装フェーズ

## フェーズ 1: 脱・仮初め (De-mocking)
- [x] **Core Auth**: `App.jsx` / `AdminDashboard.jsx` のモック認証を撤廃し、正規フローへ移行 + profilesテーブル作成完了 <!-- id: 6 -->
- [x] **Board Data**: `BoardCanvas.jsx` の初期データロードを正規リポジトリ経由に変更 <!-- id: 7 -->
- [x] **GAS Link**: `gasApi.js` の実URL接続設定とTODO消化 <!-- id: 8 -->

## フェーズ 1.5: スキーマ最適化 (Schema Optimization)
- [x] **Schema Unification**: 3つのSQLファイルを統合し、実行順序を明確化 <!-- id: 9 -->
- [x] **Verification Enhancement**: 検証スクリプトに profiles テーブル確認を追加 <!-- id: 10 -->

## フェーズ 2.5: 実構造反映 (Actual Schema Reflection)
- [x] **Schema Investigation**: Supabase実構造の完全調査（9テーブル確認）
- [x] **Schema Creation**: supabase_schema_actual.sql 作成（冪等性対応、簡潔な構造、履歴コメント付き）
- [x] **Routes Table Addition**: 配車計画保存用routesテーブル追加
- [x] **Verification Update**: supabase_schema_verification.sql をPhase 2.5対応に更新
- [x] **Application Verification**: ブラウザ動作確認完了（物理的証拠：スクリーンショット）
- [x] **Project Cleanup**: 不要ファイル削除、試作品を_archived/prototypes/へ移動

## フェーズ 2: 機能強化 (Enhancement)
- [x] **Concurrency**: 配車盤の編集競合防止ロジック実装 <!-- id: 11 -->
  - [x] Project hygiene: .gitignore最適化、ログファイル削除
  - [x] Implementation plan作成: Optimistic Locking設計
  - [x] BoardCanvas.jsx: localUpdatedAt State追加
  - [x] BoardCanvas.jsx: 初期化時タイムスタンプ記録
  - [x] BoardCanvas.jsx: Real-time購読の競合検知ロジック
  - [x] BoardCanvas.jsx: 保存時の競合検出・リロード処理
  - [x] Manual verification: 3シナリオ検証


## フェーズ 2.2: 排他的編集ロック (Exclusive Edit Lock - Option E)
- [x] **Edit Lock Mechanism**: 編集権トークン + 15分タイムアウト実装 <!-- id: 12 -->
  - [x] Schema: routesテーブルに3カラム追加 (edit_locked_by, edit_locked_at, last_activity_at)
  - [x] SCHEMA_HISTORY.md更新
  - [x] Migration SQLファイル作成
  - [x] Supabase migration実行
  - [x] BoardCanvas: ロック取得ロジック実装
  - [x] BoardCanvas: タイムアウト判定（15分）
  - [x] BoardCanvas: ハートビート（1分ごとのアクティビティ更新）
  - [x] BoardCanvas: ロック解放ロジック
  - [x] Real-time: ロック状態の購読・通知
  - [x] UI: 編集モード/閲覧モード切替
  - [x] UI: 編集中ユーザー表示
  - [x] Manual verification: 緊急変更シナリオ検証

## フェーズ 2.3: 編集権限制御 (Edit Permission Control - RBAC)
- [x] **Permission Management**: 特定ユーザーのみ編集可能にする権限制御 <!-- id: 13 -->
  - [x] Implementation plan作成
  - [x] Schema: profilesテーブルにcan_edit_boardカラム追加
  - [x] Migration SQLファイル作成 (supabase_migration_phase2.3.sql)
  - [x] Supabase migration実行
  - [x] BoardCanvas: canEditBoard State追加
  - [x] BoardCanvas: 初期化時に権限取得
  - [x] BoardCanvas: requestEditLock内で権限チェック
  - [x] UI: 権限なしユーザー向け表示（閲覧専用バッジ）
  - [x] User matching fix: currentUserId修正 (admin1に変更)
  - [x] Query fix: .eq('id')に変更
  - [x] Manual verification: 権限あり/なしユーザーテスト

## フェーズ 3: 管理機能強化 (Admin Features)
- [ ] **User Permission Management UI**: 詳細スペックは `DEBT_AND_FUTURE.md` へ移管 <!-- id: 14 -->

## フェーズ 3.1: 未配車リストバケット改良
- [x] **Pending Jobs Bucket Improvement**: 定期/スポット明確化 <!-- id: 15 -->
  - [x] BoardCanvas: フィルタータブ変更 (すべて/定期/スポット)
  - [x] BoardCanvas: フィルタリングロジック修正
  - [x] Manual verification: バケット表示確認

## フェーズ 3.2: バケットシステム再設計 (Blueprint v2.1)
- [x] **4-Bucket System**: 制約ベースの分類システム <!-- id: 16 -->
  - [x] BoardCanvas: タブ変更 (全て/スポット/時間指定/特殊案件)
  - [x] BoardCanvas: フィルタリングロジック更新
  - [x] データモデル: is_spot, time_constraint, task_type カラム追加
  - [x] Migration SQL作成
  - [x] Migration SQL実行 (User Manual)
  - [x] Manual verification: 4バケット表示確認

## フェーズ 3.3: 制約検証ロジック (Yellow Warning)
- [x] **Constraint Logic**: 時間制約違反の検知と警告 <!-- id: 17 -->
  - [x] BoardCanvas: `validateTimeConstraint` 実装
  - [x] BoardCanvas: ドロップ時に検証実行 & 警告表示
  - [x] UI: Warning Notification (黄色トースト) 対応
  - [x] Manual verification: 違反時の警告動作確認
  - [x] Manual verification: 違反時のブロック確認

## フェーズ 3.5: 制約検証ロジック (Reason Input)
- [x] **Reason Input UI**: 警告時の理由入力ダイアログ <!-- id: 19 -->
  - [x] UI: `ReasonModal` コンポーネント実装
  - [x] BoardCanvas: Yellow Warning時にモーダル表示
  - [x] Logic: 理由付きで配置を実行する処理
  - [x] Manual verification: 理由入力フローの確認

## フェーズ 3.X: マスタデータ正規化 (Master Data Normalization - Simple)
- [x] **Schema Definition**: `customers`, `vehicles` テーブル作成
- [x] **Data Migration**: 初期データ投入
- [x] **Code Refactoring**: `BoardCanvas.jsx` 等のマスタ参照をDB経由に変更 <!-- id: 20 -->
- [x] **Manual verification**: マスタデータが正しく読み込まれるか確認

## フェーズ 4.0: SDRアーキテクチャ移行 (SDR Migration)

- [x] **SDR Schema Implementation**: `manual_sdr_migration_full.sql` 作成完了 (一時停止: CLI設定へ移行) <!-- id: 21 -->
- [x] **Master Data Migration**: `customers` -> `master_collection_points` 移行 (Remote既存確認済み) <!-- id: 22 -->
- [x] **Application Adapter**: `useMasterData` をSDR対応版へ更新 <!-- id: 23 -->
- [x] **Proposal Flow**: コード実装完了 (DBテーブル作成済み、CLI環境整備完了) <!-- id: 24 -->

## フェーズ 4.1: CLI環境構築 (CLI Configuration)
- [x] **CLI Authentication**: Supabaseへログイン <!-- id: 25 -->
- [x] **Project Link**: リモートプロジェクトとリンク (`mjaoolcjjlxwstlpdgrg`) <!-- id: 26 -->
- [x] **Migration Execution**: CLI経由でSDRマイグレーションを適用 (PGRST205解消) <!-- id: 27 -->

## フェーズ 4.2: 承認フローUI実装 (Approval Flow UI - **COMPLETED**)
- [x] **SDR Dashboard**: 提案・決定ログを閲覧できる管理画面の実装 <!-- id: 28 -->
  - [x] UI: `SDRDashboard.jsx` 作成 (Proposals & Decisions Tabs)
  - [x] Logic: `useSDR.js` フック作成 (Fetch & Supabase Subscription)
  - [x] Action: 手動承認/却下ボタンの実装 (Pending提案用)
- [x] **Integration**: 管理メニューへのリンク追加 <!-- id: 29 -->
- [x] **Environment Fix**: CLIとアプリのプロジェクト不整合を解消し、`mjaool...` で統一。

## フェーズ 4.3: UI日本語化 (Localization - **COMPLETED**)
- [x] **SDR Dashboard**: 提案・決定ログ画面の日本語化 <!-- id: 30 -->
  - [x] Labels: テーブルヘッダー、ボタン、ステータスバッジの日本語化
  - [x] Messages: ローディング、エラー、空状態メッセージの日本語化
  - [x] Date Format: 日時表示のJST/ロケール対応 (`toLocaleString('ja-JP')`)

## フェーズ 5.5: 構造改革 (Architecture Refactoring)
- [x] **Component Split**: `BoardCanvas.jsx` (1600行) の分割 <!-- id: 31 -->
  - [x] Logic Extraction: `useBoardData` フックの作成 (Supabase/Local Sync)
  - [x] UI Extraction: `DriverColumn`, `TimeGrid`, `JobCard` コンポーネント化
  - [x] Drag Logic: `useBoardDragDrop` フックへの分離
- [x] **Type Definition**: 主要データ型 (Job, Driver, Split) のJSDoc/TypeScript定義整備 <!-- id: 32 -->

## フェーズ 6: 複数品目管理 (Multi-Item Management)
- [x] **Data Modeling**: 概念データモデル設計 (ER図) <!-- id: 33 -->
  - [x] Plan Formulation: `implementation_plan.md` 更新
  - [x] Schema Design: `master_items`, `customer_item_defaults` テーブル設計
  - [x] Migration: SQLファイル作成
- [x] **UI Prototyping**: 複数品目入力・表示UIのモックアップ作成 <!-- id: 34 -->
  - [x] Logic Update: `useMasterData` hook 拡張
  - [x] Logic Update: `useBoardData` / `proposalLogic` 拡張
  - [x] UI Update: `BoardModals.jsx` (Job Edit) に品目管理機能追加
- [x] **DB Implementation**: `job_items` (JSONB) 統合とデータ永続化 <!-- id: 35 -->

## フェーズ 6.5: データ移行 (Data Migration)
- [x] **CSV Import**: 既存マスタデータの取り込み <!-- id: 40 -->
  - [x] Scripting: 変換スクリプト作成 (`generate_import_sql.js`)
  - [x] SQL Generation: インポート用SQL生成
  - [x] Schema Correction: 未定義テーブル作成とFK修正 (114000, 114500)
  - [x] Execution: Supabaseへの適用 (121000)
  - [x] Verification: データ件数確認完了 (`verify_import.js`)
  - [x] Vehicles Seed: 車両マスタ5件投入 (`122000`)
  - [x] Drivers Seed: ドライバーマスタ11件投入 (`160000`)

## フェーズ 7: コース別配車管理 (Course-Based Dispatch)
- [x] **Course Column Model**: コース主体カラムへのモデル移行 <!-- id: 41 -->
  - [x] Logic: `useBoardData.js` 初期化ロジック変更 (Default A-E Courses)
  - [x] UI: `DriverHeader.jsx` コース名強調・担当者割当表示への変更
  - [x] UI: `BoardModals.jsx` ヘッダー編集モーダルのDriver/Vehicle選択UI化
  - [x] Feature: コース追加・削除機能の実装

## フェーズ 8: UI基本動作の洗練 (UI Refinement)
- [x] **Job Creation Hook**: 盤上ダブルクリックで「案件追加」モーダルを開く <!-- id: 50 -->
- [x] **Phase 6 Verification Support**: モーダルに顧客選択を追加し、デフォルト品目を自動入力 <!-- id: 51 -->
- [x] **Drag & Drop Tuning**: 列間移動のロジック検証完了 (Unit Tests Pass) <!-- id: 52 -->
- [x] **Automated Verification**: Headless統合テストによる動作保証 (Vitest) <!-- id: 53 -->




## フェーズ 9: Business OS統一規格への完全移行 (Strict Compliance)
- [x] **SDR Schema Implementation**: `migration_report.md` に基づくテーブル・RPC作成 <!-- id: 60 -->
- [x] **RLS Enforcement**: `routes` テーブルへの直接書き込み禁止設定 <!-- id: 61 -->
- [x] **Frontend Migration**: `useBoardData.js` の保存処理をRPC経由に変更 <!-- id: 62 -->
- [x] **Verification**: Driver権限で直接書き込みが失敗し、RPC経由のみ成功することを確認 <!-- id: 63 -->

## フェーズ 5: 技術的負債と将来機能 (Debt & Future)
詳細な項目は `DEBT_AND_FUTURE.md` に移管されました。
- **See**: [DEBT_AND_FUTURE.md](DEBT_AND_FUTURE.md)

