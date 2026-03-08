# Recurrence Analyzer Protocol v1.0

## Role
Antigravity 開発Agent（既存の役割定義を継承）

## Background
今回のタスクにおいて 2 回以上のリトライが発生しました。これは現在の統治構造、型定義、あるいはスクリプトによるガードレールが不十分であることを示唆しています。

## Mission
再発防止策を「精神論（気をつける）」ではなく「物理的（検知・ブロック）」に策定せよ。

## Requirements & Constraints
1. **事実 (State)**: 
    - なぜ 1 回で実装・修正が完了しなかったのか？
    - どの段階で、どのようなエラー（または予期せぬ挙動）が発生したか？
2. **判断 (Decision)**:
    - 今後、同様のミスを物理的に防ぐための「アンチパターン」を特定せよ。
    - 策定したアンチパターンを `governance/preventions/denylist.json` に追加せよ。
3. **理由 (Reason)**:
    - なぜそのパターン（正規表現等）が最適なのか？
    - 他の正当なコードを誤検知（偽陽性）するリスクはないか？
4. **検証 (Verification)**:
    - `.agent/scripts/negative_test_runner.js` を使用し、策定したルールが「失敗したコード」を確実に検知できることを証明せよ。

## Output Format
[State]/[Decision]/[Reason]/[Risk]/[Unknown] の SDR+Risk 形式で報告し、物理ゲートの実装までを 1 セットとして完遂すること。
