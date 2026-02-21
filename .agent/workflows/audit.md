---
description: SVP 統治ロック発生時のAuditタグ記録と解除手順
---

# /audit ワークフロー: SVP ロック解除

## 使用タイミング
`npx pre_flight` または `git commit` の際に以下のエラーが表示されたとき:
```
⚠️ Governance violations detected
§4 停止およびリトライプロトコル (SVP) - 高
```

## 実行手順

1. **違反内容の確認**
   ```
   notepad GOVERNANCE_REPORT.md
   ```
   問題のファイル名と連続修正のコミット一覧を確認する。

2. **AMPLOG.md へ Audit タグを記録する**
   - `AMPLOG.md` を開き、**直近7日以内のテーブル行**（`| 日付 |` 形式）のいずれかに `[Audit: 原因・判断・根拠]` を付記する。
   - 書式:
     ```
     | 2026-xx-xx | 作業名 | 変更説明 [Audit: 連続修正の構造的原因。迷走ではなく計画的な段階実装であることを記載] | 済 | (PW: ｙ) |
     ```
   - **注意**: Audit タグ内は **5文字以上** であること。

3. **プリフライト確認（自動ロック解除）**
   ```
   node .agent/scripts/pre_flight.js
   ```
   `✅ [SVP Resolution] 有効な内省（Auditタグ）を検知しました。` と表示されれば解除成功。

4. **コミット実行**
   ```
   git add -A
   git commit -m "[事実] <変更内容> [理由] <変更理由>"
   git push
   ```

## 備考
- SVP ロックが発生する主な原因は「同一ファイルへの30分以内の3回以上の連続コミット」。
- バグ修正の連鎖など、論理的に正当なイテレーションは Audit タグで是認可能。
- 迷走（原因不明の試行錯誤）の場合は Stop Protocol を発動し、まず State を整理すること。
