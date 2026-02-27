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
#severity: low
#trigger: [sada, simpleHash, hash]
#registered: 2026-02-22
  - **現状**: 現在の32-bitハッシュは高速だが、大規模ツリーでの衝突リスクがある。
  - **リスク**: 【低】現在のプロジェクト規模では実害は低いが、将来的な誤検知の火種になる。
  - **解決策**: 必要に応じて 64-bit または 128-bit への移行を検討。現状は優先度：低。

- [ ] **Supabase 401 Whiteout (Anon Role RLS)**
#type: fault_pattern
#domain: db
#severity: critical
#trigger: [supabase, routes, rpc, permission]
#registered: 2026-02-23
  - **現状**: モック/開発環境（認証未完了）では `anon` 権限で通信するが、新規作成したテーブル（routes等）やRPCに `anon` への権限（GRANT/RLS）が付与されておらず 401 Unauthorized が発生して画面が停止（ホワイトアウト）した。
  - **リスク**: 【高】配車盤やマスタ画面が全く描画されず、ユーザーが「システムが壊れた」と誤認する。
  - **解決策**: Supabase関連の実装時（特に新テーブル追加時）は、必ず `anon` ロールへのアクセス権限（SELECT/INSERT等）と RLS ポリシー (`TO anon`) をセットで実装すること。
  - **物理構造**: `inject_context.js` (Gate) により、今後の開発時に本警告が自動注入される。

- [ ] **Unapproved Browser Use (SADA-First Rule Violation)**
#type: fault_pattern
#domain: governance
#severity: high
#trigger: [browser, sada, verification, gate]
#registered: 2026-02-24
  - **事象**: 開発サーバー起動確認時、憲法 § 2.F (SADA-First Rule) で禁止されている「無承認でのブラウザ検証（DOM閲覧）」を自己判断で実行した。
  - **原因**: 画面描画の有無という物理的事実を「効率的」に確認しようとし、「統治（プロセス）」を軽視したことによる。
  - **対策**: 今後、いかなる理由があろうともブラウザツール（browser_subagent等）を使用する際は、必ず事前に SADA で代替可能かを自問し、それでも必要な場合は個別の承認（ｙ）を得る。
  - **物理構造**: 本記録をもって、今後の `pre_flight` 時に統治遵守の警告として注入される。

- [ ] **SADA: 32-bit Hash Collision Risk**

---

## 3. Prevention & Post-Mortem (エラー再発防止策)
*テストおよび開発過程で発生したエラーからの学び。*

- **型不整合の早期発見 (2026-02-22)**
  - [ ] [L] `database.types.ts` の一部プロパティが `Insert` / `Update` で漏れている可能性があるため、全テーブルの再洗出しが必要。
  - **事象**: `AITestBatcher` の内部プロパティ名 (`steps`) とテスト側の参照 (`actions`) が乖離し、実行時まで気付けなかった。
  - **対策**: 今後、新設するユーティリティクラスには JS Doc または型定義ファイルを徹底し、VS Code 上での補完精度を高める。また、`npm run type-check` をテスト前に実行する習慣を徹底する。

# Reflection: Fault Patterns
- #type: fault_pattern, #severity: high, #title: 物理DB同期漏れによる型幻覚
    - **事象**: マイグレーションファイルを作成しただけで、物理DB（リモート）への適用を失念し、型定義だけを先行して修正した結果、実行時にDBエラーが発生するリスクが生じた。
    - **対策**: `docs/governance/DB_SYNC_PROTOCOL.md` に従い、実装前に必ず `npx supabase gen types` で物理カラムの存在を検証すること。

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
  - **Note**: 既存エラーは一旦宣認し、別タスクで集中的に解消するか、`// @ts-ignore` 等で明示的に抑制してベースラインを作成する必要がある。

- [x] **Strict Master-First Architecture Definition (Spot Jobs Handling)**
#type: arch_decision
#domain: db, logic, ui
#severity: high
#trigger: [jobs, foreign-key, spot-job, master_collection_points]
#registered: 2026-02-28
  - **現状**: Phase 5の実装により `jobs.customer_id` に厳格なFK制約が課された。
  - **判断**: スポット案件であっても「使い捨て」を許容せず、すべて事前に `master_collection_points` への登録を必須とする「Strict Master-First アーキテクチャ」を正典として確定した。
  - **理由**: システム上の Single Source of Truth を維持し、将来の経理連携等のデータ負債を防ぐため。
  - **将来のUX課題**: マスタ登録の強制による現場の手間（摩擦）を減らすため、突発追加時には「簡易マスタ登録と案件生成を1アクションで行うUIモジュール」の設計を Future Feature と定める。

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
### 5. Lessons Learned (教訓)

- **表示ガードと操作ガードの分離不足 (2026-02-23)**
#type: fault_pattern
#domain: ui
#severity: medium
#trigger: [sidebar, cell-click, editMode, guard]
  - **事象**: `editMode`（編集権限/ロック状態）を表示ロジックのガードに使用したため、閲覧ユーザーやデータロード直後のユーザーがサイドバー（未配車リスト）を参照できなくなる不具合が発生した。
  - **原因**: データの書き換え（アサイン）に対するガードと、UIの表示（サイドバーの開閉）に対するガードを一括りで扱ってしまったことによる。
  - **対策**: 今後、アクションを伴うUI操作においては、「表示（閲覧）」と「実行（変更）」のガード条件を明確に分離して設計する。閲覧目的のインタラクションを権限によって阻害してはならない。

- [ ] **SADAテスト環境（Vitest/Vite）の不安定化と起動エラー (2026-02-23)**
#type: impl_debt
#domain: qa
#severity: high
#trigger: [test, sada, vitest, mock]
  - **事象**: `MasterPointList.sada.test.tsx` や `BoardCanvas.test.tsx` 等のSADAテスト実行時、`_createServer` 内部での例外発生や `Failed to load url .../src/test/setup.ts` といったViteコアレベルのエラーが頻発し、テストプロセスがクラッシュする。
  - **リスク**: 【高】ReactコンポーネントのUIレンダリングを介したセマンティック差分検証（SADA）が自動で実行できず、デグレードの検知が手動に依存する状態となっている。
  - **解決策**: Vite、Vitest の設定ファイル（`vite.config.ts`, `vitest.config.ts`）、およびグローバルモック層（`setup.ts`）の依存・エンコーディング設定などをゼロベースで見直し、安定したテスト実行環境を再構築する。（本件では暫定的にブラウザでの目視検証で代替した）

- [ ] **不完全な状態更新によるリサイズ不具合 (2026-02-24)**
#type: fault_pattern
#domain: ui
#severity: medium
#trigger: [resize, top-handle, state-sync, BoardJob]
  - **事象**: ジョブカードの上辺リサイズ時、`timeConstraint` のみ更新し `startTime` を更新し忘れたため、カードが上へ伸びず下へ伸びる（描画上の不整合）が発生した。
  - **原因**: `BoardJob` 型に `startTime` (表示用) と `timeConstraint` (制約用) が重複して存在していることへの認識不足。
  - **対策**: `BoardJob` の時間操作時は、必ず両方のフィールドをセットで更新する。また、将来的に型定義の正規化（フィールド一本化）を検討する。

- [ ] **VIEWの再定義（42P16）およびGRANT引数不一致（42883）によるpushブロック (2026-02-25)**
#type: fault_pattern
#domain: db, governance
#severity: high
#trigger: [migration, view, CREATE OR REPLACE, GRANT, rpc]
  - **事象**: `npx supabase db push` 実行時、`view_master_points` の途中に新規カラムを追加しようとした際「42P16 (cannot change name of view column)」エラーが発生。また、別のファイルにて `rpc_execute_master_update` への `GRANT` 文の引数定義が現行と異なっていたため「42883 (does not exist)」エラーが発生、pushが完全にブロックされた。
  - **原因**: (1) PostgreSQLにおいて、VIEWの `CREATE OR REPLACE` は末尾へのカラム追加しか許容されず、途中への挿入や変更ができない制限を知悉していなかった。(2) 過去のマイグレーションで関数シグネチャ（引数）が変更された後、それ以前のマイグレーションファイルの `GRANT` 文を追従させていなかった。
  - **対策**: (1) VIEWの定義を変更する際（特にカラム順序変更や型変更を含む場合）は、安易に `CREATE OR REPLACE` を使わず `DROP VIEW IF EXISTS <name> CASCADE; CREATE VIEW <name> AS ...` の手順を標準とする。(2) マイグレーションエラー発生時は当てずっぽうな再実行を避け、必ずエラー出力（ログ）から該当ファイルとSQLSTATEを特定するステップバイステップ解析を行うこと。

- [ ] **VLMテスト（Playwright等）のブラウザ環境起因エラー (2026-02-26)**
#type: impl_debt
#domain: qa
#severity: medium
#trigger: [test, e2e, playwright, vlm, dangerouslyAllowBrowser]
  - **事象**: スキーマ統合（Phase 2）後のテスト実行時、`tests/vlm/boardDrag.spec.ts` などのVLMテストでブラウザ環境未構築に伴うエラーが発生し、全体のテスト通過（Zero Baseline）の判定を阻害した。
  - **リスク**: 【中】UIのE2Eテストが自動化ラインで実行できず、VLMによる機能検証が機能しなくなる。
  - **解決策**: 後日、Playwright等のE2Eテスト環境設定を見直し、ブラウザの実行権限やテストランナーの分離（VLM用とUnit用）を適切に行う。
