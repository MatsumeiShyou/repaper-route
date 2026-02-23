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

- [x] **SADA: Pruning Risk (SemanticExtractor)** - 完了 (2026-02-22)
  - **現状**: `isMeaningful` による枝刈りが、「子を持ち上げる」際に親の参照属性（aria-labelledby 等）を失わせるリスクがあった。
  - **解決策**: ID保持要素および ARIA 関係属性（labelledby, describedby等）を持つ要素を強制保護するロジックを `SemanticExtractor.ts` に実装。
  - **結果**: 構造的コンテキストを維持したままのトークン節約が可能になった。

- [x] **SADA: Limited State Capture** - 完了 (2026-02-22)
  - **現状**: `RELEVANT_STATES` が限定性であった。
  - **解決策**: `aria-grabbed`, `aria-live`, `aria-busy` 等の属性を拡張。
  - **結果**: DNPUIや動的な状態変化の捕捉精度が向上。

- [x] **Vehicle Lock UI Blocking** - 完了 (2026-02-22)
  - **概要**: `validateVehicleLock` (車両固定制約) 違反時に、UI上でドロップ操作をブロックする機能。
  - **解決方法**: `collision.ts` を `ConstraintEngine` と統合し、`useBoardDragDrop.ts` を通じて `JobLayer.tsx` のプレビューに違反理由を動的表示。違反時はドロップを物理的に禁止。
  - **結果**: 重量超過や入場制限違反をリアルタイムに検知し、誤った配車をシステム的に防止。

- [ ] **SADA: 32-bit Hash Collision Risk**
#type: impl_debt
#domain: sada
#severity: medium
#trigger: [sada, simpleHash, hash]
#registered: 2026-02-22
  - **現状**: 現在の32-bitハッシュは高速だが、大規模ツリーでの衝突リスクがある。
  - **リスク**: 【低】現在のプロジェクト規模では実害は低いが、将来的な誤検知の火種になる。
  - **解決策**: 必要に応じて 64-bit または 128-bit への移行を検討。現状は優先度：低。

---

## 3. Prevention & Post-Mortem (エラー再発防止策)
*テストおよび開発過程で発生したエラーからの学び。*

- **型不整合の早期発見 (2026-02-22)**
  - **事象**: `AITestBatcher` の内部プロパティ名 (`steps`) とテスト側の参照 (`actions`) が乖離し、実行時まで気付けなかった。
  - **対策**: 今後、新設するユーティリティクラスには JS Doc または型定義ファイルを徹底し、VS Code 上での補完精度を高める。また、`npm run type-check` をテスト前に実行する習慣を徹底する。

- **Windows PowerShell 環境でのログ損壊 (2026-02-22)**
  - **事象**: `>` リダイレクトによるログ出力が UTF-16 になり、AI ツールで読み取れない事象が発生。
  - **対策**: ログ取得時は `Out-File -Encoding utf8` または `| tee` (Unix互換ツールがある場合) を使用することをプロジェクト標準とする。`.env` または `package.json` のスクリプトで環境依存を吸収するエイリアスの導入を検討。


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
    - [x] Semantic Fixes (`TimeGrid`, `Collision`, `Theme`)
    - [x] **App.tsx Type Error**: Resolved by removing .tsx extension in imports.
    - [x] **useBoardData.ts Errors**: Resolved by explicit type assertions for Supabase single queries.
    - [x] **useMasterCRUD.ts Errors**: 静的検証困難な箇所を「是認された動的仕様（TBNY-SPEC-DYNAMIC）」として明文化し、負債を解消。
    - [x] **Master Data Layout Fixes**: 2026-02-22 セッションにて操作列のモーダル化と表示崩れ（z-index, スクロールバー）の対策済みを確認。
  - **Note**: 既存エラーは一旦是認し、別タスクで集中的に解消するか、`// @ts-ignore` 等で明示的に抑制してベースラインを作成する必要がある。

---

## 4. Legacy JS 資産 棚卸台帳（忘却防止）
*Phase 16（JS 資産隔離・TS 昇格）により `src-legacy-js/` に退避された未移行資産のうち、将来的に再利用の可能性があるもの。*
*調査日: 2026-02-23 / 判断: 最安全方針を採用（移行せず参考資料として保持）*

### 保留資産（将来必要時に TS で再設計）

| # | ファイル | 用途 | 再利用タイミング | 備考 |
|---|---|---|---|---|
| 1 | `hooks/useJobStateMachine.js` | 案件の状態遷移ロジック（到着→作業中→完了等） | 配車盤の高度化 / ドライバーアプリ連携時 | 状態遷移パターンの参考資料として価値あり |
| 2 | `lib/eventRepository.js` | イベント（到着・完了等）の永続化 | ドライバーアプリ（Hands）実装時 | Supabase Edge Functions への再設計が必要 |
| 3 | `lib/photoRepository.js` | 写真の Supabase Storage 保存 | ドライバーアプリの証拠写真機能実装時 | Storage バケットの設計参考 |
| 4 | `lib/imageOptimizer.js` | クライアント側画像圧縮 | 写真機能実装時 | Canvas API ベースの手法として参考価値あり |
| 5 | `lib/repositories/` (4件) | Job/Route/Customer/Item の CRUD 抽象化 | アーキテクチャ再設計時 | リポジトリパターンの設計参考 |

### 廃棄済み資産（TS 版で完全置換済み）

| # | ファイル | 対応する TS 版 | 削除日 |
|---|---|---|---|
| 1 | `hooks/useMasterCRUD.js` | `src/hooks/useMasterCRUD.ts` | 2026-02-23 |
| 2 | `config/masterSchema.js` | `src/config/masterSchema.ts` | 2026-02-23 |
| 3 | `lib/supabase.js` | `src/lib/supabase/client.ts` | 2026-02-23 |

### 不要判断資産（現アーキテクチャで代替手段あり）

| # | ファイル | 理由 |
|---|---|---|
| 1 | `hooks/useFeatureFlag.js` + `config/featureFlags.js` | 現 TS 版で未使用。必要時は TS で新規設計が安全 |
| 2 | `services/gasApi.js` | GAS 連携は Supabase 直結アーキテクチャでは不要。外部連携時は Edge Functions を推奨 |
