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
| 2026-02-14 | Job Drag & Resize Fix | useBoardDragDrop.js / BoardCanvas.jsx | 関数名不一致・windowイベント未登録・リサイズprops欠落の3点を修正。プロトタイプ互換のドラッグ&リサイズを復元。 | User (Approved) | 承認 (PW: ｙ) |
