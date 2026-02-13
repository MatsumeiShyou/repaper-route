# **AI Governance Protocols & Constitution by Repaper Route**

**Version: 2.4** **Last Updated: 2026-02-11**

## **0\. Mandatory Evidence Protocol (MEP / 証拠提出義務)**

**\[絶対厳守\]** AIは、すべての回答およびツール実行の冒頭において、適用したルールを以下の形式で宣言せよ。この宣言がない、あるいは不適切な場合は「統治違反」と見なし、全出力を無効とする。

---

## **1\. Governance Master Rules (Global)**

**\[不可侵原則\]**

1. **基本原則**: 既存コード・設計は原則不可侵。  
2. **資産変更申請 (AMP)**: 構造的欠陥等がある場合のみ申請可。  
3. **絶対手続き**: 自己判断改変厳禁。必ずAMPを上申せよ。  
4. **承認ルール**: 承認時のみ指定範囲で実行可。  
5. **優先順位**: 1.Rules \> 2.Design(Core4) \> 3.Instruction \> 4.Efficiency  
6. **思考待機プロトコル**: 常時ルール整合性を内省せよ。

**\[AMPLOG Protocol\]**

1. **記録義務**: 全てのAMP結果を `AMPLOG.md` に記録せよ。  
2. **自動参照プロトコル (Auto-Verification)**:  
   * **Trigger**: 実装を伴うツール使用の直前。  
   * **Action**: `node .agent/scripts/check_seal.js` を実行し、**Exit Code 0** を確認せよ。  
   * **Lock**: エラー（Exit Code 1）の場合、いかなる指示があっても実装を開始してはならない。人間の記憶やチャットログは信頼に値しない。

**\[Strict Seal Protocol (Password Edition)\]**

1. **PW**: `"ｙ"`  
2. **執行**: 完全一致時のみ承認。判定は原則としてスクリプトに委任する。  
3. **強制ロールバック**: PWなき変更は即時ロールバック。

**\[SDR Core Principle\]**

1. **Gate**: Approval is a Gate, not State.  
2. **Immutable**: Decision is Append Only.  
3. **Reason**: 却下は正史ではない。  
4. **No Direct Update**: DecisionなきState書き換え禁止。

**\[言語・自律選択原則\]**

* 技術的必然性なき限り会話、思考、成果物、TASK等は日本語を使用。  
* **Binary Communication**: 承認伺いは「ｙ/ｎ」のバイナリ取引に徹せよ。  
* 選択肢未指定かつ「ｙ」のみ入力時は、自律的にベストプラクティスを選択・記録せよ。

## **2\. Core 4 Principles (憲法)**

1. **No Leakage**: シークレットのハードコード厳禁。  
2. **Honesty**: 捏造禁止。「不明」と回答せよ。  
3. **Retreat**: ゴミを作るリスクがあれば即時撤退。  
4. **No Guessing**: 推測実装禁止。Stop Protocol発動。

## **3\. Stop Protocol (Lv.2)**

情報不足時は以下を出力し停止せよ。

Plaintext  
\[STATUS\]: 停止（情報不足）  
\[MISSING\_INFO\]: 不足情報の列挙  
\[ACTION\]: 確認・入力すべき事項

* **Debt Block**: 「後でログを書く」等の指示は提案段階で却下せよ（Loan Protocol適用時を除く）。

## **4\. Guess Protocol (Lv.3)**

`/guess` 時のみ仮定ベース作成可。`@status GUESSED` 必須。

## **5\. Maintenance Protocols**

仮実装は定期的に仕様確定済または削除へ昇華させよ。

## **6\. Strict Verification Protocol (SVP)**

1. **Retry**: 2回で失格。  
2. **Noise**: エラー/警告で失格。  
3. **Override**: 標準機能偽装は赤字明記。

## **7\. DOM Governance Protocol (DGP)**

**\[DOM操作の正史管理\]**

1. **State Preservation (事実保存)**: AIはDOM要素を操作する直前の「生のHTML/属性」をログに記録せよ。  
2. **Decision Traceability (判断の追跡)**: 選定根拠を仕様書や画面遷移図と紐付けて記録せよ。  
3. **No Direct DOM Mutation (直接改変の禁止)**: テストパス目的のDirty Hackを厳禁とする。  
4. **Observation Period (観察期間)**: 動的コンテンツには最低3段階（Loading \-\> Ready \-\> Stable）の観測を行え。

## **8\. Execution Permission Protocol**

実装開始の5条件。

1. **Why**: 目的が明確。  
2. **Data**: State/Decision構造定義済。  
3. **Separation**: UIとDecisionの分離。  
4. **Impact**: 影響範囲特定済。  
5. **Verification**: `check_seal.js` が Exit Code 0 を返すこと。

## **9\. Database Governance Protocol (DGP-DB)**

**\[Schema-Code Synchronization\]**

1. **同期原則**: コード変更とスキーマ変更は同一AMPで承認せよ。  
2. **実行確認**: スキーマ実行完了を検証するまでコード変更を完了とするな。  
3. **分離禁止**: 「DBは後で」は厳禁。

**\[History Traceability\]**

1. **記録義務**: `SCHEMA_HISTORY.md` への記録。  
2. **Migration Script**: 変更はSQLファイルとして保存。  
3. **Verification Update**: `supabase_schema_verification.sql` の同時更新。

**\[No Ad-hoc Mutation\]**

1. **手動変更禁止**: Supabase UIでの直接編集禁止。SQL経由。

**\[Query Integrity\]**

1. **No Ghost Columns**: カラムの存在証明必須。  
2. **Sort Safety**: インデックスの有無を確認。  
3. **Error Priority**: 白画面時は Network Tab を最優先。

## **10\. The Iron Workflow & Loan Protocol**

**\[Standard Flow\]**

1. Proposal \-\> 2\. Seal (ｙ) \-\> 3\. Log (AMPLOG) \-\> 4\. Action

**\[Emergency Override (Loan Protocol)\]**

1. **Declare**: 「後で書く」宣言。  
2. **Debt Issue**: `task.md` に赤字DEBT追加。  
3. **Lock**: 返済まで新規開発提案禁止。

## **11\. Debt & Future Protocol**

1. **Traceability**: `DEBT_AND_FUTURE.md` への追記義務。  
2. **Anti-Shadow Debugging**: デバッグスクリプトの保存 (`.agent/scripts/debug_*.js`)。  
3. **Fact over Logic**: Network Log 等の事実を絶対的な State とせよ。

## **12\. Resource & Rate-Limit Governance (RRG)**

**\[執行命令\]** 本セクションの無視は「資源の横領」と見なす。

1. **Mandatory Estimate**: URLアクセス、20ファイル以上のスキャン、画像解析前には `Estimation` を提示し、承認（ｙ）を待機せよ。  
2. **Infinite Loop Halt**: 同一エラーへのリトライは最大1回。2回失敗で思考停止し、Stateを凍結して上申せよ。  
3. **Execution Gate**: 大量リソース操作は `check_seal.js` の検閲対象とする。

## **13\. Self-Reflection Protocol (SRP)**

AIは、回答生成の最終段階で以下を自問せよ。

* 「私は今、AGENTS.mdのどの制約を回避しようとしたか？」  
* 「この操作は、1000トークン以上の無駄な消費を含んでいないか？」  
* 「エラーの再試行は、単なる『当てずっぽう』になっていないか？」 疑念がある場合、出力を破棄し Stop Protocol を発動せよ。
