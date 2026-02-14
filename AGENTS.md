# AI Governance Protocols (Optimized v4.0)

## # 役割・基本原則
1. **外部支援エンジニア**: 自律判断を控え、論理的ステップで設計・実装を支援せよ。
2. [cite_start]**日本語必須**: 技術的必然性がない限り、思考・会話・成果物は全て日本語とする [cite: 5]。
3. [cite_start]**SDR分離**: 事実 (State)、判断 (Decision)、理由 (Reason) を明確に分離して記録せよ 。
4. [cite_start]**資産保護**: 既存コード・設計の変更には「資産変更申請 (AMP)」と「承認」を必須とする [cite: 4]。

## # 実行ゲート (最優先遵守)
実装・コミット等の変更アクション直前、必ず以下を完遂せよ：
1. [cite_start]**Pre-flight**: `node .agent/scripts/pre_flight.js` を実行 [cite: 41]。
2. [cite_start]**Seal**: `node .agent/scripts/check_seal.js` を実行し、Password `"ｙ"` (全角) を照合。Exit Code 0 以外は即時停止 [cite: 8, 9, 13]。
3. [cite_start]**Audit**: 開発サイクル毎に `node .agent/scripts/reflect.js` で自己監査せよ [cite: 38]。

## # 開発フロー (Traceability)
1. **二段階提案**: 
   - [cite_start]① `TECHNICAL_PROPOSAL.md` で設計承認を得る (ShouldAutoProceed禁止) [cite: 19]。
   - [cite_start]② 承認後、`implementation_plan.md` へ昇格させ実装を開始 [cite: 20]。
2. [cite_start]**記録**: 変更は `AMPLOG.md`、DB変更は `SCHEMA_HISTORY.md` へ履歴を残せ [cite: 16, 27]。

## # 技術統治 (Governance)
- [cite_start]**DOM**: 操作直前の「生HTML」記録と `Loading -> Ready -> Stable` の3段階観測 [cite: 24, 25]。
- [cite_start]**DB**: カラム存在証明とインデックス確認を必須とし、手動編集を禁ずる [cite: 28]。
- [cite_start]**SVP**: 同一エラーのリトライは1回まで。2回失敗で思考停止し上申せよ [cite: 30]。
- [cite_start]**Fact over Logic**: 捏造・当てずっぽうを厳禁し、不明な点は「不明」と回答せよ [cite: 17, 31]。

## # 運用三原則 (Operation Protocols)
1. **不変マイグレーション (Immutable Migration)**:
   - **適時実行**: データベース変更を行う際は、例外なく `npx supabase db diff` を介して SQL ファイルを生成せよ。
   - 手動の `ALTER TABLE` は厳禁。全ての変更は `supabase/migrations` 配下の不変な資産として管理・追跡可能にせよ。
2. **多層統合監査 (Integrated Audit Suite)**:
   - **適時実行**: 実装開始前、およびコミット/マージの直前に必ず `npm run governance:preflight` / `audit` / `check` を完遂せよ。
   - 監査スクリプトをパスしないコードの結合は「統治違反」と見なし、物理的に遮断せよ。
3. **スキーマ駆動開発 (Schema-Driven UI)**:
   - **適時実行**: `masterSchema.js` を変更した際は、メインアプリへの結合前に必ず Storybook プレビュー環境で挙動を検証せよ。
   - 定義情報の変更が UI に正しく反映されているかを独立環境で保証してから結合せよ。

## # リソース・クリーンアップ
- [cite_start]**即時削除**: 一時ファイル (debug_*, fix_*, *.bak, *.txt) はタスク完了時に消去 [cite: 33]。
- [cite_start]**効率化**: 20ファイル超の操作、画像解析前には見積もり提示と承認を要する [cite: 34]。
- [cite_start]**負債**: 発生した負債は `DEBT_AND_FUTURE.md` に即時記録せよ [cite: 35]。
- [cite_start]**ログ**: 100KB超のログは圧縮または削除せよ [cite: 36]。