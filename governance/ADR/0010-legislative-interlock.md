# ADR 0010: Legislative Interlock (Sentinel 5.1)

## Context
Sentinel 5.0 (Constitutional Guard) により、実装フェーズでのルール変更は遮断されたが、立法フェーズ（LEGISLATIONモード）において、ADR の作成や AMP への刻印を失念したまま「なし崩し」に憲法が変更されるリスクが残っていた。

## Decision
統治資産（AGENTS.md, governance/, .agent/scripts/）が変更された際、以下の 3 条件が物理的に満たされていない場合、反映（git push / npm run done）をハードロックする仕組みを `closure_gate.js` に実装する。

1.  **ADR 作成**: `governance/ADR/` 配下に新規ファイルがあり、`Status: Approved` または `ステータス: 承認済み` が含まれていること。
2.  **AMP 紐付け**: `AMPLOG.jsonl` の最新エントリーに ADR 参照（`adr_ref`）が含まれており、かつ出力印（`PW: ｙ`）があること。
3.  **プラン整合性**: `implementation_plan_*.md` が更新されており、内容に `立法`, `Legislation`, または `ADR` の検討キーワードが含まれていること。

STATUS: Approved

## Consequences
- AI は統治資産を変更する際、設計（ADR/Plan）と承認（AMP）を同時に行わなければならず、ガバナンスの形骸化が完全に防止される。
- 立法プロトコルの不備は `DEADLOCK_REPORT` として出力され、透明性が確保される。
