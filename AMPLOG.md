# AMPLOG (Asset Modification Proposal Log)
Asset Modification Log governing project changes.

| ID | Status | Approval Date | Description | Note (Reason if Rejected) |
| :--- | :--- | :--- | :--- | :--- |
| AMP-001 | **Approved** | 2026-02-01 | ハイブリッド・トランザクション（DB失敗時もシートにエラー記録）の正式採用 | 正式実装済み (gas_spreadsheet_integration.js) |
| AMP-002 | **Approved** | 2026-02-01 | UI基盤をHTMLベースのPWAとして確定 | Phase 1 方針確定 |
| AMP-003 | **Approved** | 2026-02-01 | Phase 1 統合スプレッドシート設計 (Schema Design) | Rev.1: 日時カラム統合 (DateTime) |
| AMP-004 | **Approved** | 2026-02-01 | 資産命名規則 (Naming Convention) | File: RePaper_System_Hub / Sheet: @Daily_Jobs |
| AMP-005 | **Approved** | 2026-02-01 | 憲法改定 v1.5 (Strict Seal Protocol) | パスワード認証により発効 |
| AMP-006 | **Approved** | 2026-02-01 | 車両列追加 & 簡易マスタ管理 (Config Sheet) | Rev.3: Lite Model (ID管理なし、Dropdownのみ) |
| AMP-20260201-01 | **Approved** | 2026-02-01 | 憲法改定 v1.6 (Language Principle) | 日本語優先原則の追加 |
| AMP-007 | **Confirmed** | 2026-02-01 | Phase 1&2 疎通テスト完了（Schema v1.7準拠） | - |
| AMP-20260201-02 | **Approved** | 2026-02-01 | 憲法改定 v1.6 (SDR Deep Integration) | State/Decision/Reason分離原則の厳格化 |
| AMP-20260201-03 | **Approved** | 2026-02-01 | Phase 3 バックエンド更新 (Schema v1.8) | マルチトランザクション対応 & 新カラム(work_type, task_details)追加 |
| AMP-20260201-04 | **Approved** | 2026-02-01 | DriverApp.jsx v1.8 更新 | GAS接続、SDRペイロード構造、現場用巨大UIの実装 |
| AMP-20260201-05 | **Approved** | 2026-02-01 | 管理ダッシュボード実装 (SDR準拠) | 修正・承認を「上書き」ではなく「追記イベント」として扱う設計 |
| AMP-20260202-01 | **Approved** | 2026-02-02 | Driver App 手動モード＆CI/CD環境構築 | 手動報告機能の実装、Git導入、GitHub/Netlify連携による自動デプロイ体制の確立 |
| AMP-20260202-02 | **Approved** | 2026-02-02 | MVP Roadmap & Phase 1 Foundation Plan | SDR/L1基盤、オフライン対応を含むMVP実装計画とロードマップの策定 |
| AMP-20260202-03 | **Approved** | 2026-02-02 | State Machine Scope Refactoring | バグ修正: ステートマシンをJobCardごとのインスタンスに変更し、独立した状態管理を行うよう修正 |
| AMP-20260202-04 | **Approved** | 2026-02-02 | Governance Update: Strict Verification Protocol (SVP) | 憲法改定 v1.6.1: 検証における「再試行禁止」「エラーゼロ」基準の定義 |
| AMP-20260202-AUTO | **Approved (ｙ)** | 2026-02-02 | 憲法 7.1.2 準拠対応 | DriverApp.jsx から console.log を削除し、コンソールノイズを排除 |
| AMP-20260202-AUTO2 | **Approved (ｙ)** | 2026-02-02T14:44:47.439Z | UI更新: プレミアムModal/Toastの実装および環境変数ガードの導入 |
