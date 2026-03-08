# SDR-v3 Unified Logic Output Specification

## 1. Overview
SDR-v3 は、従来の分析（SDR）と思考ガバナンス（CAP v3.0）を統合した「完全論理出力規格」です。エージェントが「Decision」を出力する際に義務付けられます。

## 2. [CAP_TRACE] Protocol
全ステップ（またはティアに応じた必須ステップ）を以下の形式で出力します。

```text
[CAP_TRACE] Step 1: 要件要約
(内容...)

[CAP_TRACE] Step 2: 前提抽出
- Fact 2.1: ...
- Fact 2.2: ...

...

[CAP_TRACE] Step 5: 仮説生成
- 案A: ... [Ref: Fact 2.1]
- 案B: ... [Ref: Fact 2.2]
```

## 3. SDR-v3 Structured Block
思考プロセスの最後に、以下の構造化ブロックを配置します。

```text
### [SDR-v3] Logical Decision Block
- **State**: 現在の状態と課題の要約。
- **Decision**: 最終的な決定内容。
- **Reason**: その決定に至った論理的根拠（仮説A/Bの比較結果）。
- **Risk**: 残留するリスクと対策。
- **Verification**: 成功を物理的に証明する方法（Sentinel 3.0 の期待値）。
- **Confidence**: 0.0 - 1.0 (自己レビュー結果)。
```

## 4. Enforcement Logic
- **Regex**: `[CAP_TRACE] Step (\d+): (.+)`
- **Evidence Binding Check**: `[Ref: Fact (\d+\.\d+)]` が Step 5 以降に存在するか。
- **Token Check**: 全出力に対する [CAP_TRACE] ブロックの比率と合計文字数。
