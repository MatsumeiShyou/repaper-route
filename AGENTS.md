# Sanctuary Governance Constitution (v8.0)

> **[PLEDGE] 100点の物理証跡なき行動は即時Locker対象。**
> **破壊的な一括削除コマンド（`git clean -fdX` 等）の実行を永久に禁止する。**
> **[LEXICON] 本憲法のルール意図や専門用語（AMP, SDR等）の定義に迷いが生じた場合は、絶対に推測せず直ちに governance/lexicon.json を参照せよ。**

## 1. CORE DIRECTIVES (絶対律)
- **[No Guessing]**: 推測実装禁止。事実(State)なき実装は即時終了せよ。
- **[SSOT Scan]**: 構造不明時はタスク開始時に必ず `npm run agent:scan --target=all` を実行せよ。未実行は完遂ゲートで物理的に遮断される。
- **[F-SSOT]**: 派生状態の `useState` 保存禁止。`useMemo` による純粋導出を義務とする。
- **[No Leakage & Honesty]**: 秘密情報のハードコード禁止。不明点は「不明」と明示せよ。
- **[GaC Protocol]**: 役割分離（Analyzer/Executor）を遵守せよ。「計画」「設計」の指示時は即座にPLANNINGモードへ復帰せよ。
- **[SDR Protocol]**: 応答は「事実(State)」「判断(Decision)」「理由(Reason)」の三要素を核とし、比喩を禁止しトップダウン形式で記述せよ。T3時は明示的ラベルで5層分離せよ。

## 2. EXECUTION GATES (実行プロトコル)
- **[Tier Check]**: ティア判定は `governance/risk_matrix.json` を参照せよ。
  - **T1**: 低リスク。即実行。
  - **T2**: 中リスク。自動テスト合格が承認条件。
  - **T3**: 高リスク。提案→承認（PW:`ｙ`）→実行。AMPLOG(JSONL)への記録（`design_ref` 必須）。
- **[Physical Verification (CAVR)]**: `governance/rules/compliance.json` に従え。UI/UX変更(Route A)はPreview実機確認必須。バイパス時は `npm run done -- --interactive` で理由を回答し、`DEBT_AND_FUTURE.md` に記録せよ。
- **[C-E-V (Cause-and-Effect)]**: 修正前後で「Negative Proof (失敗再現)」と「Positive Proof (成功証明)」の物理的証跡（テストログ等）を必ず提示せよ。
- **[Sanctuary Purge]**: `/push` 提案前に必ず `git status` を確認し、`node .agent/scripts/reflect.js --purge` を実行して不純物を排除せよ。
- **[Seal Protocol]**: 実装完了時は必ず単一コマンド `npm run done` を実行し、最終報告の直前に出力されたGSEALコードを引用提示せよ。

## 3. DOMAIN RULES (領域別・現場統治)
- **[DOM Observation]**: DOM操作ツール実行前後で `[Loading]`, `[Ready]`, `[Stable]` の3段階状態を物理的に観測・報告せよ。
- **[SQL Sync]**: スキーマ変更時は必ず `npx supabase db diff` を実行し、生成SQLを提示せよ。変更内容は即時 `SCHEMA_HISTORY.md` に記録せよ。
- **[Supabase Connection]**: CLI実行や直接接続前に、必ず `knowledge/supabase_cli_ipv6_pooler_fix/artifacts/manual.md` を読み込み遵守せよ。
- **[Debt Loan]**: `DEBT_AND_FUTURE.md` への記録は「借金」であり、完済するまで関連モジュールの新規機能提案を禁止する。
- **[Boundary Enforcement]**: `apps/` → `features/` → `shared/` の単方向依存を厳守し、無秩序な参照を禁止する。
- **[SVP (Single Version)]**: 全体で同一バージョンのライブラリを使用し、幽霊依存を根絶せよ。
- **[TGS Trace]**: T3/不具合修正前は `grep_search` 等で `C:\Users\shiyo\.gemini\antigravity\brain\` およびワークスペースを走査し、SDRに明記せよ。
- **[ADR]**: 統治構造の変更（AGENTS.md等）は必ず `governance/ADR/` に記録せよ。
- **[Zero-Fallback]**: 統治設定読込失敗時はデフォルト値にフォールバックせず、即座に自己破壊（`process.exit(1)`）せよ。判断時は参照キー名を標準出力せよ。
- **[Cognitive Gov]**: ティア比例型の思考ステップを義務付ける。理由なき再設計は制限される。