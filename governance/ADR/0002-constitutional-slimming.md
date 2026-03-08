# ADR-0002: 憲法 (AGENTS.md) のスリム化と GaC への完全委譲

* **Status**: Accepted
* **Date**: 2026-03-08
* **Decider**: AI Agent (Antigravity) & User

## Context and Problem Statement
v5.0 の `AGENTS.md` は 170行を超え、OS固有のコマンド（Windows PowerShellの制約等）や完了手順が混在していました。
これにより、AIの認知負荷が増大し、ルールの見落としや解釈ミスが発生する「統治の脆さ」が露呈していました。

## Decision Drivers
* 憲法の不可侵性と純粋性の維持
* 環境依存ロジックの物理的隠蔽（EAL）
* 機械可読なルールによる自動検証の強化

## Considered Options
1. **案A**: Markdown への詳細追記を維持（170行超）
2. **案B**: 哲学・原則と、実行ロジック（GaC）の完全分離（60行程度へのスリム化）

## Decision Outcome
Chosen option: "**案B**", because 技術的手順を JSON/コードへ委譲することで、AIの「解釈」という不確実な工程を排除し、環境適合を `govCore` に一任できるため。憲法は「何をすべきか（原則）」に専念し、「どう実行するか（技術）」は GaC 層が担保する。

### Consequences
* **Positive**: 憲法の可読性が劇的に向上。環境エラー（tail問題等）の再発防止。
* **Negative**: ルール構成の階層化により、新規参画者（または別のAI）が詳細を追う際に複数ファイルを参照する必要がある。

## Validation Plan
- `AGENTS.md` v5.1 が 60行以下に収まっていること。
- 新規追加した `/governance` ディレクトリへの正常なリンク。
- `pre_flight.js` 等のスクリプトが新設された GaC ルールに基づき正常動作すること。
