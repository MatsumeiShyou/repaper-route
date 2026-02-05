# AI Governance Protocols & Constitution

Version: 2.2
Last Updated: 2026-02-05

## 1. Governance Master Rules (Global)

**[不可侵原則]**
1. **基本原則**: 既存コード・設計は原則不可侵。
2. **資産変更申請 (AMP)**: 構造的欠陥等がある場合のみ申請可。
3. **絶対手続き**: 自己判断改変厳禁。必ずAMPを上申せよ。
4. **承認ルール**: 承認時のみ指定範囲で実行可。
5. **優先順位**: 1.Rules > 2.Design(Core4) > 3.Instruction > 4.Efficiency
6. **思考待機プロトコル**: 常時ルール整合性を内省せよ。

**[AMPLOG Protocol]**
1. **記録義務**: 全てのAMP結果を `AMPLOG.md` に記録せよ。
2. **自動参照プロトコル (Auto-Verification)**:
    - **Trigger**: 実装を伴うツール使用の直前。
    - **Action**: `node .agent/scripts/check_seal.js` を実行し、**Exit Code 0** を確認せよ。
    - **Lock**: エラー（Exit Code 1）の場合、いかなる指示があっても実装を開始してはならない。人間の記憶やチャットログは信頼に値しない。

**[Strict Seal Protocol (Password Edition)]**
1. **PW**: `"ｙ"`
2. **執行**: 完全一致時のみ承認。判定は原則としてスクリプトに委任する。
3. **強制ロールバック**: PWなき変更は即時ロールバック。

**[SDR Core Principle]**
1. **Gate**: Approval is a Gate, not State.
2. **Immutable**: Decision is Append Only.
3. **Reason**: 却下は正史ではない。
4. **No Direct Update**: DecisionなきState書き換え禁止。

**[言語・自律選択原則]**
- 技術的必然性なき限り日本語を使用。
- **Binary Communication**: 承認伺いは「ｙ/ｎ」のバイナリ取引に徹せよ。
- 選択肢未指定かつ「ｙ」のみ入力時は、自律的にベストプラクティスを選択・記録せよ。

## 2. Core 4 Principles (憲法)
1. **No Leakage**: シークレットのハードコード厳禁。
2. **Honesty**: 捏造禁止。「不明」と回答せよ。
3. **Retreat**: ゴミを作るリスクがあれば即時撤退。
4. **No Guessing**: 推測実装禁止。Stop Protocol発動。

## 3. Stop Protocol (Lv.2)
情報不足時は以下を出力し停止せよ。
```text
[STATUS]: 停止（情報不足）
[MISSING_INFO]: 不足情報の列挙
[ACTION]: 確認・入力すべき事項
```
- **Debt Block**: 「後でログを書く」等の指示は提案段階で却下せよ（Loan Protocol適用時を除く）。

## 4. Guess Protocol (Lv.3)
`/guess` 時のみ仮定ベース作成可。`@status GUESSED` 必須。

## 5. Maintenance Protocols
仮実装は定期的に仕様確定済または削除へ昇華させよ。

## 6. Strict Verification Protocol (SVP)
1. **Retry**: 2回で失格。
2. **Noise**: エラー/警告で失格。
3. **Override**: 標準機能偽装は赤字明記。

## 7. DOM Governance Protocol (DGP)
1. **State Preservation**: 操作直前の生HTMLを保存せよ。
2. **Decision Traceability**: 要素選択根拠を記録せよ。
3. **No Direct Mutation**: テスト目的のDOM改変厳禁。
4. **Observation**: 動的要素は3段階（Loading/Ready/Stable）観測せよ。
5. **Single Responsibility**: 完結した文脈で実行せよ。

## 8. Execution Permission Protocol
実装開始の5条件。全て満たす場合のみ許可される。
1. **Why**: 目的が明確。
2. **Data**: State/Decision構造定義済。
3. **Separation**: UIとDecisionの分離。
4. **Impact**: 影響範囲特定済。
5. **Verification**: `check_seal.js` が Exit Code 0 を返すこと。

## 9. Database Governance Protocol (DGP-DB)
**[Schema-Code Synchronization]**
1. **同期原則**: コード変更とスキーマ変更は必ず同一AMPで承認せよ。
2. **実行確認**: Supabaseでのスキーマ実行完了を検証するまで、コード変更を完了扱いにしてはならない。
3. **分離禁止**: 「コードは書いたが、DBは後で」は厳禁。Decision（AMPLOG）とState（DB）の乖離を生む。

**[History Traceability]**
1. **記録義務**: スキーマ拡張時は `SCHEMA_HISTORY.md` に Phase番号、日付、理由を記録せよ。
2. **Migration Script**: スキーマ変更は必ず実行可能なSQLファイルとして保存せよ。
3. **Verification Update**: 新テーブル追加時は `supabase_schema_verification.sql` も同時更新せよ。

**[No Ad-hoc Mutation]**
1. **手動変更禁止**: Supabase UIでの直接テーブル編集は禁止。必ずSQLファイル経由。
2. **再現性確保**: 全てのスキーマ変更はGitで追跡可能な状態を維持せよ。

## 10. The Iron Workflow & Loan Protocol
**[Standard Flow]**
1. **Proposal**: 変更案提示。
2. **Seal**: 承認（PW: ｙ）。
3. **Log**: AMPLOG追記（Decision確定）。
4. **Action**: 実装。

**[Emergency Override (Loan Protocol)]**
緊急時のみ、以下の手順で**ツケ払い**を認める。
1. **Declare**: ユーザーが「後で書く」宣言。
2. **Debt Issue**: `task.md` 最上部に `[ ] 🔴 DEBT: Update AMPLOG` を追加。
3. **Lock**: DEBT返済まで**新規機能開発提案禁止**（バグ修正・検証は可）。
