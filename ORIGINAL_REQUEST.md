# Original User Request

## Initial Request — 2026-07-10T08:24:47+09:00

プロジェクトの目的:
コードベースに残存する約120箇所の `any` 型を、安全かつ段階的に厳格な型（`unknown` や具体的なインターフェース）へリファクタリングする。

Working directory: `C:\Users\shiyo\開発中APP\RePaper Route` および `TBNY DXOS` の関連領域

## Requirements (リスク排除のための制約)

### R1. ドメインごとの段階的アプローチ (Phased Execution)
一括（ビッグバン）修正は絶対に行わず、`features/board`, `lib/supabase`, などのドメイン（またはディレクトリ）単位でタスクを分割すること。

### R2. 厳格な検証ゲート (Verification Gates)
各ドメインの修正が完了するごとに、必ず `npm run type-check` および Lint を実行し、コンパイルレベルでの整合性を証明（Positive Proof）してから次のドメインへ進むこと。

### R3. ランタイム安全性の確保
`any` を剥がした結果として、既存のランタイムロジックに影響を与えないこと。型の不確実性が高い外部データ（API等）の境界では、バリデーションロジックや `unknown` を適切に用いること。

## Acceptance Criteria

- [ ] 全ての `any` 指定が排除、または正当な理由付きの `unknown` に置換されていること。
- [ ] 最終的にリポジトリ全体で `npm run type-check` がエラーゼロで通過すること。
- [ ] 修正による機能退行（デグレ）が起きていないことが、主要画面のレンダリングで確認できること。
