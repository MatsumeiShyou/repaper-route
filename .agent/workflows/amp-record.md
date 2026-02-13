---
description: AMP (資産変更申請) の承認記録を AMPLOG.md に自動追加する
---

// turbo-all

1. **AMP情報の収集**
   - ユーザーに以下の情報を確認してください:
     - **Title**: 変更名称 (例: "Feature Implementation")
     - **Scope**: 変更対象範囲 (例: "Add new API endpoint")
     - **Impact**: 期待される効果 (例: "Improved performance")
   - ユーザーが情報を省略した場合、直前のコンテキストから自律的に推定してください。

2. **非対話モードで記録**
   ```powershell
   node .agent/scripts/record_amp.js --title "<Title>" --scope "<Scope>" --impact "<Impact>"
   ```

3. **Seal検証**
   ```powershell
   node .agent/scripts/check_seal.js
   ```
   - `[SUCCESS]` を確認したら完了を報告してください。
   - エラーの場合は Stop Protocol を発動してください。
