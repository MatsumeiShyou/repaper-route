# Asset Modification Proposal (AMP) LOG

| 日付 | 項目 | 内容 | 承認状況 | 承認印 |
| :--- | :--- | :--- | :--- | :--- |
| 2026-02-15 | 緊急復旧 | PendingJobSidebar ホワイトアウト修正 (ガード追加) | 済 | (PW: ｙ) |
| 2026-02-15 | 配車盤ヘッダー同期 | JS版との機能差異解消 (Undo/Redo追加, 日本語化) | 済 | (PW: ｙ) |
| 2026-02-15 | ドライバーヘッダー同期 | JS版のデザイン忠実再現 (黄色帯, ダークテーマ, 1行化) | 済 | (PW: ｙ) |
| 2026-02-15 | 配車盤位置ズレと構文エラーの根本修正 | 各コンポーネント幅の px 固定および return 文復元 | 済 | (PW: ｙ) |
| 2026-02-15 | 統治憲法改訂 | AGENTS.md に「静的解析に基づく修正後のスクショ・動作確認依頼の義務」を追加 | 済 | (PW: ｙ) |

---

## 申請詳細: 配車盤ヘッダー同期 (2026-02-15)

### 1. 概要 (State)
JS 版には存在するが TS 版で欠落している「履歴操作 (Undo/Redo)」機能、およびヘッダーアクションバーの日本語化・デザイン不整合を解消する。

### 2. 判断 (Decision)
- `useBoardData.ts` の `undo/redo` プレースホルダを実動ロジックに差し替える。
- `BoardCanvas.tsx` のヘッダーに `Undo2`, `Redo2` アイコンボタンを追加。
- 保存ボタン等のラベルを日本語化し、JS 版のデザイン（色・角丸等）に合わせる。

### 3. 理由 (Reason)
- ユーザーの要望「JS 版との差分をなくす」に基づき、機能および視覚的整合性を確保するため。
- 運用の利便性（履歴操作）の復元。

---

## 申請詳細: ドライバーヘッダー同期 (2026-02-15)

### 1. 概要 (State)
配車盤のドライバーヘッダー（列見出し）のデザインが JS 版の「紙ベース再現」から乖離している。

### 2. 判断 (Decision)
- 背景をダークテーマ (`bg-black`) に戻す。
- コース名部分に黄色い帯 (`bg-yellow-400`) を復元する。
- ドライバー名と車両情報を1行 (`ドライバー名 / 車両名`) に集約する。
- 左端の時間軸ヘッダーに「時間」というラベルを付ける。

### 3. 理由 (Reason)
- ユーザー指示「JS 版との差分をなくす」を最優先するため。
- 現場の視認性（紙名簿との整合性）を回復するため。
| 2026-02-15 | 配車盤 UI 同期の完了と移行方針の確定 | src-ts/features/board/, AGENTS.md | 配車盤における主要なUI不整合の解消、および「検証義務」の憲法化による統治強化。TS移行の次のステップ（他マスター画面の同期）への移行準備完了。 | User (Approved) | 承認 (PW: ｙ) |
| 2026-02-15 | Master Points High-Density Relation | src-ts/config/masterSchema.ts, supabase/migrations/ | Introduced view_master_points to unify Locations, Contractors, and Payees. Implemented 2-row layout (Location/Contractor) for improved operational recognition. | User (Approved) | 承認 (PW: ｙ) |
| 2026-02-15 | Master Refinement Completion | src-ts/config/masterSchema.ts, src-ts/features/admin/ | Successfully refined all 4 masters (Driver, Vehicle, Point, Item) to Sanctuary standards. Resolved key mismatches and ensured practical operational alignment. | User (Approved) | 承認 (PW: ｙ) |
| 2026-02-15 | マスター整合性 & UX 改善 | src/App.jsx, masterSchema.js, RPC | 全マスタ対応 RPC 復元、ID不整合修正、URL同期（初期ロード）改善 | 済 | (PW: ｙ) |
| 2026-02-15 | Generalized RPC 復元と Vitest 環境設定の修正 | supabase/migrations/, vitest.config.ts | 全マスタ対応 RPC の復帰によりデータ整合性を確保し、Vitest のエイリアス設定修正によりテスト環境の安定性を向上 | User (Approved) | 承認 (PW: ｙ) |
| 2026-02-15 | Master Data Registration & Integrity Fix | src-ts/config/masterSchema.ts, src/config/masterSchema.js, supabase/migrations/20260215234500_restore_general_rpc_v5.sql | Resolved silent registration failures and normalized ID casting for all master tables. | User (Approved) | 承認 (PW: ｙ) |
| 2026-02-15 | Logo & Logo Text Sync (SANCTUARY) | src/components/Sidebar.jsx | 5174/配車盤UIとロゴおよびテキスト（SANCTUARY Route Command）を同期。 | 済 | (PW: ｙ) |

---

## 申請詳細: Logo & Logo Text Sync (SANCTUARY) (2026-02-15)

### 1. 概要 (State)
管理ポータル (5173) のロゴテキストが旧来の "RePaper" のままであり、配車盤 (5174相当) のデザイン案 "SANCTUARY" と不整合が発生している。

### 2. 判断 (Decision)
- `Sidebar.jsx` のロゴテキストを "RePaper" から "SANCTUARY" に変更。
- サブテキスト "ROUTE COMMAND" は維持し、ブランドの統一性を確保する。

### 3. 理由 (Reason)
- ユーザー指示に基づき、5174 の UI（配車盤）と管理ポータルのブランディングを同期・統合するため。
