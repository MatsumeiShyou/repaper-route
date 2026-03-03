# RePaper Route テスト構造・仕様書 (v6.0 アジャイル対応版)

本ドキュメントは、現在の開発環境におけるテストの構造と、アーキテクチャ転換（Route B / Route D への移行）について他のAIエージェントに説明するための仕様書です。

## 1. テストフレームワークとアーキテクチャの転換

本プロジェクトでは **Vitest** を採用していますが、UIに関する静的なアサーション（JSDOMを利用したSemantic ARIA DOM Assertion = 通称SADAテスト）は、多大なモック保守コストとCanvas関連の制約から**公式に廃止されました。**

現在のテストは完全に**ロジックテスト中心（Route B）**へ寄せられ、UIの検証は実機（Route A）または一時的な捨てスクリプト（Route D）に委譲されています。

### 1-1. テストワークスペースの構成（ロジック専用）

テスト基盤は現在「純粋なロジック関数」のみを対象とする設定になっています。

#### `logic` ワークスペース（唯一のテスト空間）
- **対象**: ビジネスロジック、ユーティリティ、純粋な関数 (ConstraintEngine, TemplateManager 等)
- **環境**: `node` (JSDOMなどのブラウザモックを持たず超高速で動作)
- **パス**: `src/features/logic/**/*.test.ts`
- **特徴**: UIコンポーネントを含まない純粋なTypeScriptロジックのテスト。エラーが起きた場合は即座に Push が物理ブロックされます。

### 1-2. 除外ディレクトリ (SADA-Exempt)
UIに関わるコンポーネントは、Vitestの実行対象から意図的に隔離されています。
- `**/node_modules/**`
- `src/features/board/components/**`
- `src/features/admin/components/**`
- `tests/vlm/**` / `tests/e2e/**` (Playwright等のE2Eテストは別枠)

## 2. 実行ロジックとガバナンス連携

テスト実行は `closure_gate.js`（100pt Closure Gate）と密接に連携しており、コード修正時の品質担保（Verification）の証跡として機能します。

- **実行コマンド**: `npx vitest run`
- **T2/T3ティアのブロック条件**:
  `tsc --noEmit`（型チェック）および `vitest run` でエラーが1件でも発生した場合、Pushは物理的にブロック（Verification Block）されます。

## 3. Quarantinesの廃止とスキップ仕様

古いSADAパラダイムで使用されていた `Quarantine Ledger (隔離テスト台帳)` および `.quarantine` ファイルによる監視システムは、SADAテストの削除に伴い**完全に撤廃されました。** レガシーエラーは既に存在しません。

ただし、**ロジックテスト（Route B）における無断なスキップは依然として警告の対象**となります。
- `*.test.ts` 内に `describe.skip` や `it.skip` を追加した場合、`closure_gate.js` が差分を検知し警告ログを出力します。もしロジックテストを一時的にスキップする必要が出た場合は、必ず `DEBT_AND_FUTURE.md` に理由を記載し、技術的負債として記録を行ってください。

## 4. UIの検証アプローチ (Route A / Route D)

UI実装・改修時は、以下のいずれかのアプローチを選択し検証を行います（Vitestは原則書きません）。

- **Route A (Preview-Driven)**: 
  フロントエンドのスタイルレイアウト・ユーザーフローの修正。コードプッシュ後に自動デプロイされる Preview URL での実機検証（人間の目視を含む）を必須とするルートです。
- **Route D (Disposable-Test)**:
  複雑なDOMインタラクション等で確証を得たい場合。使い捨ての一時スクリプトとしてPlaywrightテスト等を `temp_verify.js` として作成・実行します。このスクリプトは `walkthrough.md` に検証証跡（標準出力など）を記録したのち、タスク完了時に破棄されます。

---
**※注意**: 本構造は `AGENTS.md` の【実行ゲート】および【完遂プロトコル】に準拠して設計されています。`closure_gate.js` による並列実行や監視等、これらを勝手に迂回・削除することは重大な統治違反（T3）となります。
