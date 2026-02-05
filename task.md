# アクティブタスク: RePaper Route 実装フェーズ

## フェーズ 1: 脱・仮初め (De-mocking)
- [x] **Core Auth**: `App.jsx` / `AdminDashboard.jsx` のモック認証を撤廃し、正規フローへ移行 + profilesテーブル作成完了 <!-- id: 6 -->
- [x] **Board Data**: `BoardCanvas.jsx` の初期データロードを正規リポジトリ経由に変更 <!-- id: 7 -->
- [x] **GAS Link**: `gasApi.js` の実URL接続設定とTODO消化 <!-- id: 8 -->

## フェーズ 1.5: スキーマ最適化 (Schema Optimization)
- [x] **Schema Unification**: 3つのSQLファイルを統合し、実行順序を明確化 <!-- id: 9 -->
- [x] **Verification Enhancement**: 検証スクリプトに profiles テーブル確認を追加 <!-- id: 10 -->

## フェーズ 2.5: 実構造反映 (Actual Schema Reflection)
- [x] **Schema Investigation**: Supabase実構造の完全調査（9テーブル確認）
- [x] **Schema Creation**: supabase_schema_actual.sql 作成（冪等性対応、簡潔な構造、履歴コメント付き）
- [x] **Routes Table Addition**: 配車計画保存用routesテーブル追加
- [x] **Verification Update**: supabase_schema_verification.sql をPhase 2.5対応に更新
- [x] **Application Verification**: ブラウザ動作確認完了（物理的証拠：スクリーンショット）
- [x] **Project Cleanup**: 不要ファイル削除、試作品を_archived/prototypes/へ移動

## フェーズ 2: 機能強化 (Enhancement)
- [ ] **Concurrency**: 配車盤の編集競合防止ロジック (`BoardCanvas.jsx` TODO) の実装
