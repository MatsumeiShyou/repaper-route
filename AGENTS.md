# AI Governance Protocols (Optimization v3.2)

## §0. Meta-Compliance (絶対遵守)
1. 全ての回答・ツール実行において、本プロトコルを最優先せよ。
2. 既存コード・設計は原則「不可侵」。変更には必ず「資産変更申請 (AMP)」と「承認」を要する。
3. 言語: 技術的必然性がない限り、思考・会話・成果物は全て「日本語」を使用せよ。

## §1. $$Strict Seal Protocol$$ (最優先ゲート)
実装・変更を伴うアクションの直前には、必ず以下の手順を踏め. 例外はない。

1.  **Check:** `node .agent/scripts/check_seal.js` を実行。
2.  **Verify:** Password `"ｙ"` (全角ｙ) の完全一致を確認。
    * 承認印の有効期限は記録日から **7日間** とする。超過した場合は再申請せよ。
3.  **Lock:** 
    * Exit Code 0: 実装を実行可。
    * Exit Code 1: 即時停止せよ。

## §2. Traceability & SDR Protocol (憲法)
* **Design First:** Decision（判断・理由）と State（事実・コード）を分離せよ。
* **Traceability:** 承認された変更は `AMPLOG.md` に記録せよ。
* **Honesty:** 捏造禁止。不明なものは「不明」と答えよ。

## §3. Technical Governance
### 3.1 DOM Governance
* **Snapshot:** 操作直前の「生のHTML/属性」をログに記録せよ。
* **Observation:** 動的要素は `Loading -> Ready -> Stable` の3段階で観測せよ。

### 3.2 Database Governance
* **Log:** `SCHEMA_HISTORY.md` を更新せよ。
* **Integrity:** カラム存在証明、インデックス確認を必須とする。手動編集禁止。

## §4. Stop & Retry Protocol (SVP)
* **Retry:** 同一エラーのリトライは最大1回。2回失敗で思考停止・上申せよ。
* **No Guessing:** 当てずっぽうの実装は禁止。§11 (Fact over Logic) を徹底せよ。

## §5. Resource & Clean-up Governance
* **Clean-up:** タスク完了時、一時ファイル（debug_*, fix_*, *.bak, *.txt）を即座に削除せよ。
* **Efficiency:** 20ファイル以上の操作、画像解析前には見積もりを提示し承認を得よ。
* **Debt:** `DEBT_AND_FUTURE.md` へ負債を記録せよ。
* **Log Management:** 100KBを超えるログファイルは圧縮または削除せよ。

## §6. Self-Reflection Protocol (SRP)
* **Audit:** 開発サイクルごとに `node .agent/scripts/reflect.js` を実行し、ガバナンス遵守状況を自己監査せよ。
* **Rectify:** 違反が検出された場合、直ちに是正アクションを起こせ。形骸化を許すな。

## §7. Pre-flight Check (統合ゲート)
* コミット直前、あるいは実装開始の節目には `node .agent/scripts/pre_flight.js` を実行し、全ての統治チェックをパスせよ。

## §8. Output Audit (出力前最終チェック)
回答出力の最終段階で、内部的に以下を自問せよ。
1. `check_seal.js` (PW: "ｙ") を通過したか？
2. 1000トークン以上の無駄はないか？
3. DOM/DBの整合性は確認したか？
4. クリーンアップは完了しているか？
