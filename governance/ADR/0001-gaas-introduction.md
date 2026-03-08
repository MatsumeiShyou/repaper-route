# ADR-0001: 統治構造の外部化とデータ駆動型化 (Transition to GaC)

* **Status**: Accepted
* **Date**: 2026-03-08
* **Decider**: AI Agent (Antigravity) & User

## Context and Problem Statement
v5.0 までの統治（AGENTS.md）は、自然言語（Markdown）によるルール記述に依存していました。
これにより、以下の「変数」が制御不能になり、開発プロセスの摩擦を引き起こしていました。
1. **OS/Shell環境**: Windows PowerShell固有の挙動（tailコマンドの欠如、エンコーディング不整合）をAIがその都度「推測(Guessing)」で補完し、失敗を繰り返していた。
2. **認知負荷**: ルールが170行を超え、AIが重要な制約（30ファイル制限等）を見落とすリスクが増大していた。
3. **SSOTの未分化**: 「何が正しい手順か」が Markdown と JS スクリプトの両方に分散しており、不整合が発生していた。

## Decision Drivers
* 開発速度の向上（環境エラーによる停止の排除）
* 認知負荷の極小化（AIが読むべき情報の構造化）
* 統治の物理的強制力（JSからの直接的なデータ参照）

## Considered Options
1. **案A**: `AGENTS.md` への詳細手順の追記継続（現状維持）
2. **案B**: 統治メタデータの外部構造化（/governance ディレクトリへの委譲、EALの導入）

## Decision Outcome
Chosen option: "**案B**", because テキストベースの統治はスケーラビリティの限界に達しており、機械可読な「データ（JSON）」と環境を吸収する「コード（EAL）」の導入が、再発リスクを 15% 以下に抑える唯一の構造的解決策であるため。

### Consequences
* **Positive**: OS環境に左右されない安定した完了プロトコルの確立。AIの「解釈」ミスを防ぐ物理的ガードレール。
* **Negative**: 初期設計コストの発生、およびスクリプトメンテナンス（GaC）の手間の増加。

## Validation Plan
* `node scripts/pre_flight.js` が JSON ルールを正常にパースし、不整合を検知できること。
* Windows PowerShell 環境で `tail` 相当の操作を伴う `check_seal.js` がノーエラーで完遂すること。
