# Technical Debt & Future Roadmap (RePaper Route)

## 1. Technical Debt (技術的負債)
*解決すべき技術的課題、リファクタリング対象*

- [ ] **[Path Fragility] 統治ツールのパス脆性**: 依然として `process.cwd()` に依存しているスクリプトが存在し、ワークスペース内での実行が不安定。
- [ ] **[Supabase Sync] インフラ統合**: ルートと `apps/repaper-route` の `supabase/` フォルダの完全な一本化と環境変数の同期。
- [ ] **[Type Boundary] 循環参照の懸念**: `features/logic` と `features/board` 間での型定義の重複および依存関係の整理。
- [ ] **[Git Hooks Sync]**: `husky` がモノレポ構造を正しく認識し、全ワークスペースの `lint-staged` をトリガーできているかの検証。

## 2. Future Roadmap (将来構想)
*未実装の機能、将来的な拡張計画*

### Phase 6: AI-Enhanced Scheduling (現在着手中)
- [ ] **DeltaManager**: 配車の差分分析および変更インパクトの予測エンジンの構築。
- [ ] **SemanticExtractor**: 業務ドキュメントからの意味抽出とマスタデータへの自動マッピング。
- [ ] **VLM-Based Validation**: ビジュアル言語モデル（VLM）を用いた、配車ボードの整合性視覚チェック。

### Phase 7: TBNY DXOS Standard Integration
- [ ] **AuthAdapter**: 全社標準 Staff スキーマへの完全準拠と OAuth2 基盤への移行。
- [ ] **Audit Trail v2**: 変更履歴の分散型台帳（JSONL + DB）への二重記録。

---
> [!IMPORTANT]
> 本書は `governance/` 配下の SSOT（単一真実源）として管理されます。
