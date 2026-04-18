# ADR-0011: Defer AI Implementation and Prioritize Logical Calculation

* **Status**: Accepted
* **Date**: 2026-04-18
* **Decider**: User (shiyo) via AI Agent (Antigravity)

## Context and Problem Statement
アプリケーション利用者に提供する AI 機能（LLM 統合、自動予測エンジン等）は、高い計算コスト（KOスト）と、業務の結果に対する責任の所在の曖昧化を招く懸念があります。一方で、AI エージェントによる開発（本 OS の構築、リファクタリング、統治プロトコルの実行）は、開発速度と品質を担保するために不可欠です。

## Decision Drivers
* **Agentic Development**: AI による高度なコード生成と統治による開発効率の最大化（推奨）。
* **Logic-First Implementation**: アプリ利用者には、透明性が高くコストの低い「論理的計算」のみを提供（必須）。
* **Boundary Clarification**: 開発主体としての AI と、機能としての AI を厳格に分離する。

## Considered Options
1. **Full-AI**: 開発も機能も AI を活用する。
2. **AI-Driven Development, Logic-Driven App (Chosen)**: 開発は AI エージェント（Antigravity 等）が行い、アプリ内の機能は論理的計算で構築する。

## Decision Outcome
Chosen option: "Option 2", because AI による開発効率（推奨）を享受しつつ、アプリ機能におけるコストと無責任なブラックボックス化（禁止）を物理的に排除するため。

### Consequences
* **Positive**: 開発速度の向上、ランニングコストの抑制、ロジックの透明化と説明可能性（Explainability）の担保。
* **Negative**: 高度な非定型予測（遅延予測等）の精度が、純粋な統計/論理モデルに依存する。

## Persistence Protocol
本決定は、プロジェクトのコア方針として強力に記録され、AI SDK（openai等）が導入済みであっても、明示的な「AI実装承認」が得られるまでは論理計算による実直な実装を単一真実源（SSOT）とする。
