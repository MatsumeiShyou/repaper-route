# AMPLOG — 資産変更申請記録台帳

| 日付 | タイトル | 対象範囲 | 影響・目的 | 承認者 | 承認状態 |
|---|---|---|---|---|---|
| 2026-02-11 | Persistence Fix (Schema/RPC) | Routesテーブル作成とRPC定義 | 保存時の400エラー解消 (Fix 400 Bad Request) | User (Approved) | 承認 (PW: ｙ) |
| 2026-02-11 | Jobs RLS Fix (Phase 11.2) | jobsテーブルのRLSポリシー再設定 | 認証ユーザーの参照エラー(400)解消 | User (Approved) | 承認 (PW: ｙ) |
| 2026-02-11 | Sidebar Implementation | Google Drive風サイドバー導入 | 管理画面の操作性向上 | User (Approved) | 承認 (PW: ｙ) |
| 2026-02-11 | Logistics Sidebar Design | 物流指令ターミナル型サイドバー設計 | 専門性向上・マスタ管理対応 | User (Approved) | 承認 (PW: ｙ) |
| 2026-02-11 | Settings & Dark Mode | 設定画面・ダークモード(System対応)追加 | ユーザー体験向上・アクセシビリティ | User (Approved) | 承認 (PW: ｙ) |
| 2026-02-11 | Tailwind Config Fix | tailwind.config.jsにdarkMode設定追加 | ダークモード機能の有効化 | User (Approved) | 承認 (PW: ｙ) |
| 2026-02-11 | Sidebar Menu Simplification | マスタ管理メニューの名称簡素化 | 「〜台帳/マスタ」削除による視認性向上 | User (Approved) | 承認 (PW: ｙ) |
| 2026-02-13 | Governance System Reformation | AMPLOG遡及修正・ゴミ削除・アーカイブ化・自動化スクリプト3本実装 | 統治システムの信頼性回復・ROI 990%の自動化投資 | User (Approved) | 承認 (PW: ｙ) |
| 2026-02-13 | Governance Automation Extension | CI/CD統合・週次cron・ワークフロー・リトライ検出・hook強化・Slack通知 | 統治の自律的執行の完全自動化 | User (Approved) | 承認 (PW: ｙ) |
| 2026-02-13 | check_seal.js Validation Logic | .agent/scripts/check_seal.js | 統治ゲートキーパー復活。AMPLOG存在確認承認印検証鮮度チェックの3段階バリデーション実装 | User (Approved) | 承認 (PW: ｙ) |
| 2026-02-13 | Governance Audit Remediation | AMPLOG.md / SCHEMA_HISTORY.md / amp_toggle.cjs / check_seal.js / ルートSQLファイル19個 | AMPLOGヘッダー追加SCHEMA_HISTORY Phase混入修正SQLファイル整理バイパス48時間有効期限メカニズム追加 | User (Approved) | 承認 (PW: ｙ) |
| 2026-02-14 | Routes Init Logic Fix | useBoardData.js initializeData/handleSave修正 | pending空配列時のフォールバック不発動バグ解消 | User (Approved) | 承認 (PW: ｙ) |
| 2026-02-14 | Unassigned List UI Refactor | BoardCanvas.jsx | 省スペース化とリアルタイムな未処理件数の提示 (Clipboardアイコン + バッジ) | User (Approved) | 承認 (PW: ｙ) |
| 2026-02-14 | Board Action Bar Implementation | BoardCanvas.jsx / DriverHeader.jsx | 配車盤専用アクションバー新設。保存・未配車ボタンの集約と垂直スペース最適化。 | User (Approved) | 承認 (PW: ｙ) |
| 20260214 | Job Drag & Resize Fix | useBoardDragDrop.js / BoardCanvas.jsx | 関数名不一致・windowイベント未登録・リサイズprops欠落の3点を修正。プロトタイプ互換のドラッグ&リサイズを復元。 | User (Approved) | 承認 (PW: ｙ) |
| 2026-02-14 | Phase 3 Integrity & Master UI | supabase/migrations/20260214110000_phase3_integrity.sql / MasterVehicleList.jsx | 外部キー制約強化・is_activeフラグ導入。表示は削除・実体はアーカイブのSDR準拠マスタ管理UIを実装。 | User (Approved) | 承認 (PW: ｙ) |
# AMPLOG — 資産変更申請記録台帳

| 日付 | タイトル | 対象範囲 | 影響・目的 | 承認者 | 承認状態 |
|---|---|---|---|---|---|
| 2026-02-11 | Persistence Fix (Schema/RPC) | Routesテーブル作成とRPC定義 | 保存時の400エラー解消 (Fix 400 Bad Request) | User (Approved) | 承認 (PW: ｙ) |
| 2026-02-11 | Jobs RLS Fix (Phase 11.2) | jobsテーブルのRLSポリシー再設定 | 認証ユーザーの参照エラー(400)解消 | User (Approved) | 承認 (PW: ｙ) |
| 2026-02-11 | Sidebar Implementation | Google Drive風サイドバー導入 | 管理画面の操作性向上 | User (Approved) | 承認 (PW: ｙ) |
| 2026-02-11 | Logistics Sidebar Design | 物流指令ターミナル型サイドバー設計 | 専門性向上・マスタ管理対応 | User (Approved) | 承認 (PW: ｙ) |
| 2026-02-11 | Settings & Dark Mode | 設定画面・ダークモード(System対応)追加 | ユーザー体験向上・アクセシビリティ | User (Approved) | 承認 (PW: ｙ) |
| 2026-02-11 | Tailwind Config Fix | tailwind.config.jsにdarkMode設定追加 | ダークモード機能の有効化 | User (Approved) | 承認 (PW: ｙ) |
| 2026-02-11 | Sidebar Menu Simplification | マスタ管理メニューの名称簡素化 | 「〜台帳/マスタ」削除による視認性向上 | User (Approved) | 承認 (PW: ｙ) |
| 2026-02-13 | Governance System Reformation | AMPLOG遡及修正・ゴミ削除・アーカイブ化・自動化スクリプト3本実装 | 統治システムの信頼性回復・ROI 990%の自動化投資 | User (Approved) | 承認 (PW: ｙ) |
| 2026-02-13 | Governance Automation Extension | CI/CD統合・週次cron・ワークフロー・リトライ検出・hook強化・Slack通知 | 統治の自律的執行の完全自動化 | User (Approved) | 承認 (PW: ｙ) |
| 2026-02-13 | check_seal.js Validation Logic | .agent/scripts/check_seal.js | 統治ゲートキーパー復活。AMPLOG存在確認承認印検証鮮度チェックの3段階バリデーション実装 | User (Approved) | 承認 (PW: ｙ) |
| 2026-02-13 | Governance Audit Remediation | AMPLOG.md / SCHEMA_HISTORY.md / amp_toggle.cjs / check_seal.js / ルートSQLファイル19個 | AMPLOGヘッダー追加SCHEMA_HISTORY Phase混入修正SQLファイル整理バイパス48時間有効期限メカニズム追加 | User (Approved) | 承認 (PW: ｙ) |
| 2026-02-14 | Routes Init Logic Fix | useBoardData.js initializeData/handleSave修正 | pending空配列時のフォールバック不発動バグ解消 | User (Approved) | 承認 (PW: ｙ) |
| 2026-02-14 | Unassigned List UI Refactor | BoardCanvas.jsx | 省スペース化とリアルタイムな未処理件数の提示 (Clipboardアイコン + バッジ) | User (Approved) | 承認 (PW: ｙ) |
| 2026-02-14 | Board Action Bar Implementation | BoardCanvas.jsx / DriverHeader.jsx | 配車盤専用アクションバー新設。保存・未配車ボタンの集約と垂直スペース最適化。 | User (Approved) | 承認 (PW: ｙ) |
| 20260214 | Job Drag & Resize Fix | useBoardDragDrop.js / BoardCanvas.jsx | 関数名不一致・windowイベント未登録・リサイズprops欠落の3点を修正。プロトタイプ互換のドラッグ&リサイズを復元。 | User (Approved) | 承認 (PW: ｙ) |
| 2026-02-14 | Phase 3 Integrity & Master UI | supabase/migrations/20260214110000_phase3_integrity.sql / MasterVehicleList.jsx | 外部キー制約強化・is_activeフラグ導入。表示は削除・実体はアーカイブのSDR準拠マスタ管理UIを実装。 | User (Approved) | 承認 (PW: ｙ) |
| 2026-02-14 | Core/Ext Separation Model | MasterVehicleList.jsx / 20260214120000_core_ext_separation.sql | 車両マスタをCore（基盤）とExt（拡張）に分離。将来の全社統合を見据えたOS型アーキテクチャの確立。 | User (Approved) | 承認 (PW: ｙ) |
| 2026-02-14 | Vehicle Name (Callsign) Support | MasterVehicleList.jsx / BoardCanvas.jsx / 20260214130000_vehicle_callsign.sql | UI上の表示を「車両名」に統一。内部的には「通称」として管理し、現場の運用と正式データの管理を両立。 | User (Approved) | 承認 (PW: ｙ) |
| 2026-02-14 | General Master RPC & Remaining UIs | MasterItemList.jsx / MasterPointList.jsx / MasterDriverList.jsx / UserManagementList.jsx / 20260214150000_general_master_rpc.sql | 品目・回収先・ドライバー・ユーザーの各マスタ画面をSDR化。1つの汎用RPCで全マスタの監査記録・アーカイブ更新を統合管理。 | User (Approved) | 承認 (PW: ｙ) |
| 2026-02-14 | Brain-Hands (Admin-Driver) 統合仕様の確定 | .agent/reference/driver-app/ 共有仕様および設計方針 | 管理と現場の役割分担の明確化、SDRプロトコルベースの疎結合連携の確立 | User (Approved) | 承認 (PW: ｙ) |
| 2026-02-14 | RePaper Route Driver App 開発背景と統治上の注意事項 | .agent/reference/driver-app/ 資産および開発プロセス | Google AI Studio での開発に起因する非標準構造（node_modules欠落等）の許容、および外部AI連携による高効率開発の正当化 | User (Approved) | 承認 (PW: ｙ) |
| 2026-02-14 | Driver Event Contract (Anchor) | supabase/migrations/ / SHARED_SPECS.md | Brain-Hands間の疎結合連携を支える不変のアンカー（RPC）の確立。 | User (Approved) | 承認 (PW: ｙ) |
| 2026-02-14 | TBNY DXOS Base Integration | supabase/migrations/ / App.jsx | 基盤OS（TBNY DXOS）への完全統合。三層マスタおよび統合SDRプロトコルの導入。 | User (Approved) | 承認 (PW: ｙ) |
| 2026-02-14 | Emergency RPC & Schema Repair | 20260214990000_repair_rpc.sql | RPC不具合およびCore/Extモデルの不整合に対する緊急修復と標準化。 | User (Approved) | 承認 (PW: ｙ) |
| 2026-02-14 | Governance Protocol Evolution | AGENTS.md | 二段階提案プロトコル (§2.1) の導入、および自動進行抑制・クリーンアップ強化。 | User (Approved) | 承認 (PW: ｙ) |
| 2026-02-14 | Governance Protocol Evolution | AGENTS.md, AMPLOG.md, DEBT_AND_FUTURE.md | 二段階提案プロトコル (2.1) の導入による自動進行抑制、およびクリーンアップ強化。 | User (Approved) | 承認 (PW: ｙ) |
| 2026-02-14 | 基盤OS (TBNY DXOS) への完全統合 | 認証フローの二段階化、SDR対応マスタスキーマ導入、統合SDR-RPCの実装 | システム全体が不変の業務OS基盤へと進化し、監査耐性と拡張性が大幅に向上 | User (Approved) | 承認 (PW: ｙ) |
| 2026-02-14 | UI Refinement & Master Unification | src/config/masterSchema.js, src/components/MasterDataLayout.jsx, src/App.jsx, src/components/Sidebar.jsx, src/features/admin/AdminHome.jsx | マスタ管理画面のアーキテクチャ統合によるコード重複(80%)排除、SidebarのAuthContext同期、ホーム画面の分離によりメンテナンス性とUXを大幅向上。 | User (Approved) | 承認 (PW: ｙ) |
| 2026-02-14 | UI Refinement & Notification Standard | src/contexts/NotificationContext.jsx, src/App.jsx, src/config/masterSchema.js, src/hooks/useMasterCRUD.js | グローバル通知基盤の導入、テーマの統一、およびマスタ監査ヒントの実装によるUXと統治精度の向上。 | User (Approved) | 承認 (PW: ｙ) |
| 2026-02-14 | Node.js v22 Switch & esbuild Fix | Node.js Version / vite.config.js | Node.js v24 の不安定性解消および esbuild スキャナークラッシュの回避による開発環境の安定化。 | User (Approved) | 承認 (PW: ｙ) |
| 2026-02-14 | Whiteout & Node.js Env Fix | BoardCanvas.jsx / vite.config.js / AuthContext.jsx | �C���|�[�g�~�X�����AVite�œK���ėL�����A���݂��Ȃ�staffs�e�[�u���Q�ƏC���ɂ���ʕ����B | User (Approved) | ���� |
| 2026-02-14 | ホワイトアウト問題の解消とVite環境の正常化 | BoardCanvas.jsx, vite.config.js, AuthContext.jsx, masterSchema.js | UI描画の復旧、Vite開発環境の安定化、およびDB不整合の解消 | User (Approved) | 承認 (PW: ｙ) |
