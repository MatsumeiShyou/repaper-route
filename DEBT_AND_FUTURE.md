# Technical Debt & Future Features (SDR Project)

このドキュメントは、プロジェクト進行中に「後回し (Pending/Future)」と判断された機能、およびコードベースに残された「技術的負債 (Technical Debt)」を記録・追跡するための台帳です。
**完了済みエントリは `DEBT_ARCHIVE.md` へ移動されます。**

---

## 1. Active Technical Debt (現存する技術的負債)
*早期の解決が望まれる、現在進行形でリスクとなっている項目。*

- [ ] **Supabase 401 Whiteout (Anon Role RLS)**
#type: fault_pattern, #domain: db, #severity: critical
#registered: 2026-02-23
  - **現状**: `anon` 権限での通信時に RLS ポリシー (`TO anon`) が欠落していると 401 Unauthorized が発生する。
  - **リスク**: ホワイトアウトによるサービス停止。

- [ ] **SADAテスト環境（Vitest/Vite）の不安定化**
#type: impl_debt, #domain: qa, #severity: medium
#registered: 2026-02-23
  - **事象**: `MasterPointList.sada.test.tsx` 等の実行時、Viteコアレベルのエラーでプロセスがクラッシュする。
  - **リスク**: UIのセマンティック検証が自動実行できず、デグレード検知が手動に依存。

- [ ] **VIEWの再定義およびGRANT引数不一致によるpushブロック**
#type: fault_pattern, #domain: db, #severity: medium
#registered: 2026-02-25
  - **事象**: VIEWの `CREATE OR REPLACE` 制限や、関数シグネチャ変更後の `GRANT` 追従漏れにより `db push` がブロックされた。
  - **対策**: `DROP VIEW ... CASCADE` を標準とし、変更時は影響範囲を解析する。

- [ ] **VLMテスト（Playwright等）のブラウザ環境起因エラー**
#type: impl_debt, #domain: qa, #severity: medium
#registered: 2026-02-26
  - **事象**: ブラウザ環境未構築に伴うエラー。
  - **対策**: E2Eテスト環境設定の見直し。

- [ ] **SADA: 32-bit Hash Collision Risk**
#type: impl_debt, #domain: sada, #severity: low
#registered: 2026-02-22
  - **現状**: 32-bitハッシュの大規模ツリーでの衝突リスク。

- [ ] **Unapproved Browser Use (SADA-First Rule Violation)**
#type: fault_pattern, #domain: governance, #severity: medium
#registered: 2026-02-24
  - **事象**: 憲法 §2.F を無視したブラウザ検証の実行。

---

## 2. Future Features (実装保留機能)
*仕様として提案されたが、優先度やリソースの都合で実装が見送られた機能リスト。*

- [ ] **User Permission Management UI**
  - **概要**: 管理画面からユーザーの編集権限やロールを変更するUI。

- [ ] **Deterministic Logic Integration (Logic Base)**
  - **概要**: 重量・時間・巡回順序に基づく決定論的な計算ロジックの統合。

- [ ] **Strict Master-First: 簡易マスタ登録UI**
  - **概要**: 案件生成と同時に簡易的にマスタ登録を行うUIモジュール。

---

## 3. Prevention & Lessons Learned (再発防止策と教訓)
*エラーから得られた知見。*

- **型不整合の早期発見 (2026-02-22)**: `npm run type-check` の徹底。
- **Windows PowerShell 環境でのログ損壊 (2026-02-22)**: UTF-8 エンコーディングの強制。
- **表示ガードと操作ガードの分離不足 (2026-02-23)**: `editMode` による閲覧阻害の防止。
- **タスク完了後のコミットロック (2026-02-28)**: `pre_flight.js` により、全てのタスクを `[x]` にするとコミットがブロックされる。プッシュ/完了処理用のタスクを一つ残すか、完了直前にコミットすることを徹底せよ。

---

## 4. Legacy JS 資産 棚卸台帳
*調査日: 2026-02-23*

| # | ファイル | 用途 | 備考 |
|---|---|---|---|
| 1 | `hooks/useJobStateMachine.js` | 状態遷移ロジック | 参考資料として価値あり |
| 2 | `lib/eventRepository.js` | イベント永続化 | Edge Functions への再設計が必要 |
| 3 | `lib/photoRepository.js` | 写真保存 | Storage 設計参考 |
| 4 | `lib/imageOptimizer.js` | 画像圧縮 | Canvas API 参考 |
| 5 | `lib/repositories/` (4件) | CRUD 抽象化 | リポジトリパターンの設計参考 |
