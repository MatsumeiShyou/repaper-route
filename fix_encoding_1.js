const fs = require('fs');
const path = require('path');

const basePath = 'C:\\Users\\shiyo\\開発中APP\\RePaper Route';
const adrPath = path.join(basePath, 'governance', 'ADR');

if (!fs.existsSync(adrPath)) {
    fs.mkdirSync(adrPath, { recursive: true });
}

// Write AGENTS.md
fs.writeFileSync(path.join(basePath, 'AGENTS.md'), # Sanctuary Governance Constitution (v8.0)

> **[PLEDGE] 100点の物理証跡なき行動は即時Locker対象。**
> **破壊的な一括削除コマンド（\git clean -fdX\ 等）の実行を永久に禁止する。**
> **[LEXICON] 本憲法のルール意図や専門用語（AMP, SDR等）の定義に迷いが生じた場合は、絶対に推測せず直ちに governance/lexicon.json を参照せよ。**

## 1. CORE DIRECTIVES (絶対律)
- **[No Guessing]**: 推測実装禁止。事実(State)なき実装は即時終了せよ。
- **[SSOT Scan]**: 構造不明時はタスク開始時に必ず \
pm run agent:scan --target=all\ を実行せよ。未実行は完遂ゲートで物理的に遮断される。
- **[F-SSOT]**: 派生状態の \useState\ 保存禁止。\useMemo\ による純粋導出を義務とする。
- **[No Leakage & Honesty]**: 秘密情報のハードコード禁止。不明点は「不明」と明示せよ。
- **[GaC Protocol]**: 役割分離（Analyzer/Executor）を遵守せよ。「計画」「設計」の指示時は即座にPLANNINGモードへ復帰せよ。
- **[SDR Protocol]**: 応答は「事実(State)」「判断(Decision)」「理由(Reason)」の三要素を核とし、比喩を禁止しトップダウン形式で記述せよ。T3時は明示的ラベルで5層分離せよ。
- **[Design Compliance]**: 実装前には必ず、現在作業中のワークスペース内にある \governance/ADR/\ または \.agent/ADR/\ ディレクトリの最新決定事項を読み込み遵守せよ。方針変更時は既存ADRを修正せず新ADRを作成し「Superseded」扱いとすること。

## 2. EXECUTION GATES (実行プロトコル)
- **[Tier Check]**: ティア判定は \governance/risk_matrix.json\ を参照せよ。
  - **T1**: 低リスク。即実行。
  - **T2**: 中リスク。自動テスト合格が承認条件。
  - **T3**: 高リスク。提案→承認（PW:\ｙ\）→実行。AMPLOG(JSONL)への記録（\design_ref\ 必須）。
- **[Physical Verification (CAVR)]**: \governance/rules/compliance.json\ に従え。UI/UX変更(Route A)はPreview実機確認必須。バイパス時は \
pm run done -- --interactive\ で理由を回答し、\DEBT_AND_FUTURE.md\ に記録せよ。
- **[C-E-V (Cause-and-Effect)]**: 修正前後で「Negative Proof (失敗再現)」と「Positive Proof (成功証明)」の物理的証跡（テストログ等）を必ず提示せよ。
- **[Sanctuary Purge]**: \/push\ 提案前に必ず \git status\ を確認し、\
ode .agent/scripts/reflect.js --purge\ を実行して不純物を排除せよ。
- **[Seal Protocol]**: 実装完了時は必ず単一コマンド \
pm run done\ を実行し、最終報告の直前に出力されたGSEALコードを引用提示せよ。

## 3. DOMAIN RULES (領域別・現場統治)
- **[DOM Observation]**: DOM操作ツール実行前後で \[Loading]\, \[Ready]\, \[Stable]\ の3段階状態を物理的に観測・報告せよ。
- **[SQL Sync]**: スキーマ変更時は必ず \
px supabase db diff\ を実行し、生成SQLを提示せよ。変更内容は即時 \SCHEMA_HISTORY.md\ に記録せよ。
- **[Supabase Connection]**: CLI実行や直接接続前に、必ず \knowledge/supabase_cli_ipv6_pooler_fix/artifacts/manual.md\ を読み込み遵守せよ。
- **[Debt Loan]**: \DEBT_AND_FUTURE.md\ への記録は「借金」であり、完済するまで関連モジュールの新規機能提案を禁止する。
- **[Boundary Enforcement]**: \pps/\ -> \eatures/\ -> \shared/\ の単方向依存を厳守し、無秩序な参照を禁止する。
- **[SVP (Single Version)]**: 全体で同一バージョンのライブラリを使用し、幽霊依存を根絶せよ。
- **[TGS Trace]**: T3/不具合修正前は \grep_search\ 等でワークスペースを走査し、SDRに明記せよ。
- **[ADR]**: 統治構造の変更（AGENTS.md等）は必ず \governance/ADR/\ に記録せよ。
- **[Zero-Fallback]**: 統治設定読込失敗時はデフォルト値にフォールバックせず、即座に自己破壊（\process.exit(1)\）せよ。判断時は参照キー名を標準出力せよ。
- **[Cognitive Gov]**: ティア比例型の思考ステップを義務付ける。理由なき再設計は制限される。
, 'utf8');

// Write 0000
fs.writeFileSync(path.join(adrPath, '0000-template.md'), # ADR-[ID]: [Title]

* **Status**: [Draft | Proposed | Accepted | Deprecated | Superseded]
* **Date**: [YYYY-MM-DD]
* **Decider**: [AI Agent | User]

## Context and Problem Statement
[状況と解決すべき課題を記述]

## Decision Drivers
* [判断の要因 1]
* [判断の要因 2]

## Considered Options
1. [選択肢 1]
2. [選択肢 2]

## Decision Outcome
Chosen option: "[Option X]", because [選んだ理由・正当性].

### Consequences
* **Positive**: [メリット]
* **Negative**: [デメリット・負債]

## Validation Plan
* [How will we verify this decision stays effective?]
, 'utf8');

// Write 0001
fs.writeFileSync(path.join(adrPath, '0001-gaas-introduction.md'), # ADR-0001: 統治構造の外部化とデータ駆動型化 (Transition to GaC)

* **Status**: Accepted
* **Date**: 2026-03-08
* **Decider**: AI Agent (Antigravity) & User

## Context and Problem Statement
v5.0 までの統治（AGENTS.md）は、自然言語（Markdown）によるルール記述に依存していました。
これにより、以下の「変数」が制御不能になり、開発プロセスの破綻を引き起こしていました。
1. **OS/Shell環境**: Windows PowerShell固有の挙動（tailコマンドの欠如、エンコーディング不整合）をAIがその都度「推測(Guessing)」で補完し、失敗を繰り返していた。
2. **認知負荷**: ルールが170行を超え、AIが重要な制約（10ファイル制限等）を見落とすリスクが増大していた。
3. **SSOTの未分化**: 「何が正しい手順か」が Markdown と JS スクリプトの両方に分散しており、不整合が発生していた。

## Decision Drivers
* 開発速度の向上（環境エラーによる停止の排除）
* 認知負荷の最小化（AIが読むべき情報の構造化）
* 統治の物理的強制力（JSからの直接的なデータ参照）

## Considered Options
1. **案1**: \AGENTS.md\ への詳細手順の追記継続（現状維持）
2. **案2**: 統治メタデータの外部構造化（governance ディレクトリへの委譲、HALの導入）

## Decision Outcome
Chosen option: "**案2**", because テキストベースの統治はスケーラビリティの限界に達しており、機械可読な「データ（JSON）」と環境を吸収する「コード（HAL）」の導入が、開発リスクを15% 以下に抑える唯一の構造的解決策であるため。

### Consequences
* **Positive**: OS環境に左右されない安定した完了プロトコルの確立。AIの「解釈」ミスを防ぐ物理的ガードレール。
* **Negative**: 初期設計コストの発生、およびスクリプトメンテナンス（GaC）の手間の増加。

## Validation Plan
* \
ode scripts/pre_flight.js\ が JSON ルールを正常にパースし、不整合を検知できること。
* Windows PowerShell 環境で tail 相当の操作を伴う \check_seal.js\ がノーエラーで完遂すること。
, 'utf8');

// Write 0002
fs.writeFileSync(path.join(adrPath, '0002-constitutional-slimming.md'), # ADR-0002: 憲法 (AGENTS.md) のスリム化と GaC への完全委譲

* **Status**: Accepted
* **Date**: 2026-03-08
* **Decider**: AI Agent (Antigravity) & User

## Context and Problem Statement
v5.0 の \AGENTS.md\ は 170行を超え、OS固有のコマンド（Windows PowerShellの制約等）や完了手順が混在していました。
これにより、AIの認知負荷が増大し、ルールの見落としや解釈ミスが発生する「統治の緩み」が露呈していました。

## Decision Drivers
* 憲法の不可侵性と純粋性の維持
* 環境依存ロジックの物理的隠蔽（HAL）
* 機械可読なルールによる自動検証の強化

## Considered Options
1. **案1**: Markdown への詳細追記を継続（170行超）
2. **案2**: 哲学・原則と、実行ロジック（GaC）の完全分離（60行程度へのスリム化）

## Decision Outcome
Chosen option: "**案2**", because 技術的手順を JSON/コードへ委譲することで、AIの「解釈」という不確実な工程を排除し、環境適合を \govCore\ に一任できるため。憲法は「何をするべきか（原則）」に専念し、「どう実行するか（技術）」の GaC 層が担保する。

### Consequences
* **Positive**: 憲法の可読性が圧倒的に向上。環境エラー（tail問題等）の再発防止。
* **Negative**: ルール構成の階層化により、新規参画者（または別のAI）が詳細を追う際に複数ファイルを参照する必要がある。

## Validation Plan
- \AGENTS.md\ v5.1 が 60行以下に収まっていること。
- 新規追加した \/governance\ ディレクトリへの正常なリンク。
- \pre_flight.js\ 等のスクリプトが新設された GaC ルールに基づき正常動作すること。
, 'utf8');

// Write 0004
fs.writeFileSync(path.join(adrPath, 'ADR-004-CAP-ANALYZER.md'), # ADR-004: Analyzer/Executor Role Separation (CAP v2.2)

## Status
Proposed (2026-03-08)

## Context
AI エージェントによる大規模なシステム変更（T3）において、「設計」と「実行」が未分化な状態で進行すると、不適切な実装が承認前に混入するリスクや、設計の意図が不明確なまま実行されるリスクがありました。また、統治ドキュメントが分散しており、GaC (Governance as Code) の維持負荷が高まっていました。

## Decision
以下の 3 点を決定し、物理的に実装しました。

1. **思考エンジンの分離 (CAP v2.2)**: Analyzer（設計）と Executor（実行）を明確に分離し、それぞれ専用の正典プロンプト（\.agent/prompts/\）を物理化。
2. **引継ぎ (Handoff) 義務化**: Executor は承認済みの設計指示 (design_ref) が提示されない限り、物理的に動作を拒絶する仕組みを導入。
3. **統治ドキュメントの集約**: \governance/\ フォルダへリスクマトリクスやコンプライアンス定義を集約し、ライブラリ (\gov_core.js\) を追従。

## Consequences
- **Pros**: 設計品質の向上、監査証跡の 100% 追跡、不適切な自律実行の防止。
- **Cons**: 開発フローのステップ増加（Analyzer -> 承認 -> Executor）。
- **Risk**: フォルダ構造の変更に伴う既存スクリプトの互換性（\gov_core.js\ にて吸収済み）。

## Linkage
- **Constitution**: AGENTS.md Section H
- **Tooling**: scripts/verify_analyzer.js, scripts/verify_executor.js
, 'utf8');

console.log('Fixed Part 1');
