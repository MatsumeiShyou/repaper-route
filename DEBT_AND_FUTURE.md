# Technical Debt & Future Features (SDR Project)

このドキュメントは、プロジェクト進行中に「後回し (Pending/Future)」と判断された機能、およびコードベースに残された「技術的負債 (Technical Debt)」を記録・追跡するための台帳です。

**運用ルール**:
- 実装を保留する場合は、必ずここに追記すること。
- コード内に `TODO` を残すだけでなく、ここにも概要を記録して「見えない負債」化を防ぐこと。

---

## 1. Technical Debt (技術的負債)
*機能は動作しているが、保守性・拡張性・セキュリティの観点で修正が必要なコード箇所のリスト。*

- [ ] **Hardcoded Auth (BoardCanvas)**
  - **現状**: `src/features/board/BoardCanvas.jsx` にて `const currentUserId = "admin1";` とハードコードされている。
  - **あるべき姿**: `App.jsx` から `props` で受け取るか、`useAuth` フックを作成して動的に取得する。
  - **リスク**: 監査ログの正確性が損なわれる（常に "admin1" の操作として記録される）。

- [ ] **Hardcoded Auth (AdminDashboard)**
  - **現状**: `src/features/admin/AdminDashboard.jsx` にて `admin_user: 'AdminUser'` とハードコードされている。
  - **あるべき姿**: ログイン中のユーザー情報を利用する。
  - **リスク**: 監査ログにおいて、誰が承認したかが区別できない。

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

- [ ] **Master Management UI** (DX Consideration - 検討中)
  - **概要**: 顧客 (`master_collection_points`) や車両 (`vehicles`) を管理画面から編集・追加する機能。
  - **現状**: DX運用全体の中で、どのような設計（Excel連携派？完全Web化派？）にするか検討中のため保留。
  - **ステータス**: 必須機能だが、運用設計待ち (Design Pending)。

---

## 3. Future Considerations (将来の検討事項)
*コンセプト段階のアイデアや、長期的なロードマップ。*

- [ ] **Rule-based Automation** (Algorithmic Generation)
  - **概要**: AI（LLM）ではなく、厳格なロジックに基づく配車計画の自動提案機能。
  - **方針**: 現在は「人間の判断＋SDR監査」のフローを確立することを最優先とし、自動化は時期尚早として除外。
