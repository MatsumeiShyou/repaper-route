# ADR-004: Analyzer/Executor Role Separation (CAP v2.2)

## Status
Proposed (2026-03-08)

## Context
AI エージェントによる大規模なシステム変更（T3）において、「設計」と「実行」が未分離な状態で進行すると、不適切な実装が承認前に混入するリスクや、設計の意図が不明確なまま実行されるリスクがありました。また、統治ドキュメントが分散しており、GaC (Governance as Code) の維持負荷が高まっていました。

## Decision
以下の 3 点を決定し、物理的に実装しました。

1. **思考エンジンの分離 (CAP v2.2)**: Analyzer（設計）と Executor（執行）を明確に分離し、それぞれ専用の正典プロンプト（`.agent/prompts/`）を物理化。
2. **引継ぎ（Handoff）義務化**: Executor は承認済みの設計指示 (design_ref) が提示されない限り、物理的に動作を拒絶する仕組みを導入。
3. **統治ドキュメントの集約**: `governance/` フォルダへリスクマトリクスやコンプラ定義を集約し、ライブラリ (`gov_core.js`) を追従。

## Consequences
- **Pros**: 設計品質の向上、監査証跡の 100% 追跡、不適切な自律実行の防止。
- **Cons**: 開発フローのステップ増加（Analyzer -> 承認 -> Executor）。
- **Risk**: フォルダ構造の変更に伴う既存スクリプトの互換性（`gov_core.js` にて吸収済み）。

## Linkage
- **Constitution**: AGENTS.md Section H
- **Tooling**: scripts/verify_analyzer.js, scripts/verify_executor.js
