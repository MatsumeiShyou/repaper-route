# Technical Debt & Future Features (SDR Project)

このドキュメントは、プロジェクト進行中に「後回し (Pending/Future)」と判断された機能、およびコードベースに残された「技術的負債 (Technical Debt)」を記録・追跡するための台帳です。

**運用ルール**:
- 実装を保留する場合は、必ずここに追記すること。
- コード内に `TODO` を残すだけでなく、ここにも概要を記録して「見えない負債」化を防ぐこと。

---

## 1. Technical Debt (技術的負債)
*機能は動作しているが、保守性・拡張性・セキュリティの観点で修正が必要なコード箇所のリスト。*

- [x] **Hardcoded Auth (BoardCanvas)** - 完了 (2026-02-11 Phase 10)
  - **現状**: `src/features/board/BoardCanvas.jsx` にて `const currentUserId = "admin1";` とハードコードされている。
  - **あるべき姿**: `App.jsx` から `props` で受け取るか、`useAuth` フックを作成して動的に取得する。
  - **リスク**: 監査ログの正確性が損なわれる（常に "admin1" の操作として記録される）。
  - **解決方法**: `AuthContext` 導入により `useAuth` フック経由で動的取得に変更済み。
  - **結果**: 監査ログの整合性が確保され、実際のユーザーIDが記録されるようになった。

- [x] **Hardcoded Auth (AdminDashboard)** - 完了 (2026-02-11 Phase 10)
  - **現状**: `src/features/admin/AdminDashboard.jsx` にて `admin_user: 'AdminUser'` とハードコードされている。
  - **あるべき姿**: ログイン中のユーザー情報を利用する。
  - **リスク**: 監査ログにおいて、誰が承認したかが区別できない。
  - **解決方法**: `AuthContext` 導入により動的ユーザー情報取得に変更済み。
  - **結果**: 承認者の正確な追跡が可能になった。

- [x] **Schema Inconsistency (drivers)**
  - **対応完了**: 2026-02-11 Phase 11にて `display_order` カラムを追加済み (Manual SQL Execution)。


- [x] **Routes Initialization Logic Flaw** - 完了 (2026-02-14)
  - **現状**: ~~`routes` テーブルに行が存在すると、`pending` が空であっても `jobs` テーブルからのフォールバックが行われない。~~
  - **リスク**: ~~初回アクセス時に空データで保存されると、以降未割り当てジョブが表示されなくなる (今回発生した事象)。~~
  - **解決方法**: A案+B案+realtime subscription修正の3箇所対応。(1) pending空配列時にjobsテーブルから再同期 (2) 保存時にpending+jobs両方空ならブロック (3) realtime更新で空配列上書き防止。
  - **結果**: 誤操作で空保存してもデータが永久に失われなくなった。

- [x] **Governance System Physical Enforcement** - 完了 (2026-02-14)
  - **現状**: ガバナンスがスクリプトファイル単体に依存し、package.json や憲法の条文と不整合。
  - **解決方法**: AGENTS.md v3.2への刷新、package.json へのガバナンスコマンド統合、Husky hookの再定義。
  - **結果**: ガバナンスが「記憶」ではなく「システム」として物理的に強制されるようになった。

---

## 2. Future Features (実装保留機能)
*仕様として提案されたが、優先度やリソースの都合で実装が見送られた機能リスト。*

- [ ] **User Permission Management UI** (Phase 3 未着手)
  - **概要**: 管理画面からユーザーの編集権限やロール (Admin/Driver) を変更するUI。
  - **現状**: DB (`profiles` テーブル) を直接操作して権限管理を行っている。
  - **理由**: 現状のユーザー数が少なく、頻繁な変更がないため。

- [ ] **Vehicle Lock UI Blocking** (Phase 3.X 残件)
  - **概要**: `validateVehicleLock` (車両固定制約) 違反時に、UI上でドロップ操作をブロックする機能。
  - **現状**: 検証ロジック (`validateVehicleLock`) は実装済みだが、UI側の厳密なブロック動作は検証待ち/未適用。
  - **理由**: 現場の柔軟な運用を優先するため、警告 (Warning) レベルに留めている可能性あり。

- [ ] **Deterministic Logic Integration (Logic Base)**
  - **概要**: AIに代わる、重量・時間・巡回順序に基づく決定論的な計算ロジックの統合。
  - **理由**: ブラックボックスを排除し、100%説明可能な配車支援を実現するため。

- [x] **Master Management UI** (Phase 5 - 2026-02-14)
  - **概要**: 顧客 (`master_collection_points`) や車両 (`vehicles`) を管理画面から編集・追加する機能。
  - **解決方法**: 汎用RPC `rpc_execute_master_update` を実装し、各マスタ画面 (Vehicle/Item/Point/Driver/User) をSDR準拠で実装完遂。
  - **結果**: 運用設計（SDR）に基づいた監査可能なマスタ管理体制が確立。

- [x] **Physical Governance Gateway Activation** (Phase 5 - 2026-02-14)
  - **概要**: `.agent/scripts/pre_flight.js` を Husky などのフックに登録し、物理的に統治を強制する。
  - **解決方法**: Husky `pre-commit` への登録を完了し、全ての変更においてプリフライトチェックを物理的に強制する体制を確立。
  - **結果**: 人為的なエラーや統治のバイパスがシステム的に遮断されるようになった。
- [x] **TypeScript & Linting Errors** (Status: **Fixed**)
    - [x] Initial Audit (Exit Code 1)
    - [x] Config Fix (ESLint v9 Flat Config)
    - [x] Semantic Fixes (`useMasterCRUD`, `TimeGrid`, `Collision`, `Theme`)
    - [x] **App.tsx Type Error**: Resolved by removing .tsx extension in imports.
    - [x] **useBoardData.ts Errors**: Resolved by explicit type assertions for Supabase single queries.
    - **Action**: Monitor in next CI run.
  - **Note**: 既存エラーは一旦是認し、別タスクで集中的に解消するか、`// @ts-ignore` 等で明示的に抑制してベースラインを作成する必要がある。
