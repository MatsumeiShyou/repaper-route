# Technical Debt & Future Roadmap (RePaper Route)

## 1. Technical Debt (技術的負債)
*解決すべき技術的課題、リファクタリング対象*

- [x] **[Path Fragility] 統治ツールのパス解決**: `gov_loader.js` の強化と各スクリプトでの `PROJECT_ROOT` SSOT化により解決。
- [ ] **[Supabase Sync] インフラ統括**: ルートと `apps/repaper-route` の `supabase/` フォルダの完全な一本化と環境変数の同期。
- [ ] **[AuthAdapter Integration] 全社標準 Staff スキーマ準拠**: `AuthAdapter.ts` を修正し、旧 profile 形式から Staff スキーマへ完全移行。これをもって全社標準への準拠を完了とする。
- [ ] **[Git Hooks Sync]**: `husky` がモノレポ構造を正しく認識し、全ワークスペースの `lint-staged` をトリガーできているかの検証。

## 2. Future Roadmap (将来構想)
*未実装の機能、将来的な拡張計画*

### Phase 6: Logic-Driven Efficiency (直近の優先事項)
> [!IMPORTANT]
> **【AI開発 ✕ 論理実装】原則 (ADR-0011)**
> AIエージェント（Antigravity等）による高度なコード構築・設計は強力に推奨する。一方で、アプリ内での実行ロジックは「論理的計算（アルゴリズム）」に限定する。

- [ ] **DeltaManager (Logic Edition)**: AIエージェントが設計する、配車の差分分析および変更インパクトの論理計算エンジンの構築。
- [ ] **Structural Validation**: AIを使わず、物理制約（10kg制約、営業時間、免許要件）に基づく厳格なバリデーションの実装。

### Phase 7: TBNY DXOS Standard Integration
- [ ] **Audit Trail v2**: 変更履歴の分散型台帳（JSONL + DB）への二重記録。
- [ ] **OAuth2 Transition**: Staff認証基盤の標準 OAuth2 プロトコルへの移行。

### Appendix: AI-Enhanced Intelligence (戦略的保留)
*コスト対効果を再評価し、SDRデータが十分に蓄積された段階で再開を検討する*

- [ ] **SemanticExtractor**: 業務ドキュメントからの意味抽出（LLM活用）。
- [ ] **VLM-Based Visual Check**: 視覚言語モデルを用いたボードの整合性確認。

---
> [!IMPORTANT]
> 本書は `governance/` 配下の SSOT（単一真実源）として管理されます。
