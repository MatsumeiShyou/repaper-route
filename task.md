# アクティブタスク: RePaper Route 実装フェーズ

## フェーズ 1: 脱・仮初め (De-mocking)
- [x] **Core Auth**: `App.jsx` / `AdminDashboard.jsx` のモック認証を撤廃し、正規フローへ移行 + profilesテーブル作成完了 <!-- id: 6 -->
- [x] **Board Data**: `BoardCanvas.jsx` の初期データロードを正規リポジトリ経由に変更 <!-- id: 7 -->
- [x] **GAS Link**: `gasApi.js` の実URL接続設定とTODO消化 <!-- id: 8 -->

## フェーズ 1.5: スキーマ最適化 (Schema Optimization)
- [x] **Schema Unification**: 3つのSQLファイルを統合し、実行順序を明確化 <!-- id: 9 -->
- [x] **Verification Enhancement**: 検証スクリプトに profiles テーブル確認を追加 <!-- id: 10 -->

## フェーズ 2: 機能強化 (Enhancement)
- [ ] **Concurrency**: 配車盤の編集競合防止ロジック (`BoardCanvas.jsx` TODO) の実装
