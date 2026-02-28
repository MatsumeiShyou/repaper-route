# Technical Debt Archive (RePaper Route)

このドキュメントは、解消された技術的負債および過去の教訓を記録するアーカイブです。
`DEBT_AND_FUTURE.md` をスリムに保つため、完了済みエントリはこちらへ移動されます。

---

## Archived Debt (解消済み負債)

- [x] **Hardcoded Auth (BoardCanvas)** - 完了 (2026-02-11 Phase 10)
  - **現状**: `src/features/board/BoardCanvas.jsx` にて `const currentUserId = "admin1";` とハードコードされていた。
  - **解決方法**: `AuthContext` 導入により `useAuth` フック経由で動적取得に変更済み。

- [x] **Hardcoded Auth (AdminDashboard)** - 完了 (2026-02-11 Phase 10)
  - **現状**: `src/features/admin/AdminDashboard.jsx` にて `admin_user: 'AdminUser'` とハードコードされていた。
  - **解決方法**: `AuthContext` 導入により動的ユーザー情報取得に変更済み。

- [x] **Schema Inconsistency (drivers)** - 完了 (2026-02-11 Phase 11)
    - **対応**: `display_order` カラムを追加。

- [x] **SADA: Pruning Risk (SemanticExtractor)** - 完了 (2026-02-22)
  - **解決策**: ID保持要素および ARIA 関係属性を強制保護するロジックを実装。

- [x] **SADA: Limited State Capture** - 完了 (2026-02-22)
  - **解決策**: `aria-grabbed`, `aria-live` 等の属性を拡張。

- [x] **Vehicle Lock UI Blocking** - 完了 (2026-02-22)
  - **解決方法**: `collision.ts` を `ConstraintEngine` と統合。

- [x] **Routes Initialization Logic Flaw** - 完了 (2026-02-14)
  - **解決方法**: A案+B案+realtime subscription修正。

- [x] **Governance System Physical Enforcement** - 完了 (2026-02-14)
  - **解決方法**: AGENTS.md v3.2への刷新、package.json へのガバナンスコマンド統合。

- [x] **TypeScript & Linting Errors** - 完了 (2026-02-23)
  - **解決**: ESLint Flat Config 移行、App.tsx 型エラー解消等。

- [x] **Strict Master-First Architecture Definition (Spot Jobs Handling)** - 完了 (2026-02-28)
  - **判断**: スポット案件もすべて事前マスタ登録必須とするアーキテクチャを確定。

- [x] **精神的プロトコルの物理的強制力欠如 (K-6b)** - 完了 (2026-02-28)
  - **解決**: `epistemic_gate.js` を導入し、`pre_flight.js` に統合。

- [x] **不完全な状態更新によるリサイズ不具合** - 完了 (2026-02-24)
  - **解決**: `startTime` と `timeConstraint` の同時更新を実装。
