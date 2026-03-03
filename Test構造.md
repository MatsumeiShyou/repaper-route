# RePaper Route テスト構造・仕様書 (v5.0対応版)

本ドキュメントは、現在の開発環境におけるテストの構造、実行ロジック、および隔離（Quarantine）戦略について他のAIエージェントに説明するための仕様書です。

## 1. テストフレームワークとアーキテクチャ

本プロジェクトでは **Vitest** を採用し、**Workspace機能 (`vitest.workspace.js`)** を用いてテスト環境を物理的に分離する「Atomic Testing」アーキテクチャを採用しています。

### 1-1. テストワークスペースの構成

テストは以下の2つのプロジェクト（ワークスペース）に分割されて実行されます。

#### ① `logic` ワークスペース
- **対象**: ビジネスロジック、ユーティリティ、純粋な関数
- **環境**: `node` (JS DOM非依存で高速に動作)
- **パス**: `src/features/logic/**/*.test.ts`
- **特徴**: UIコンポーネントを含まない純粋なTypeScriptロジックのテスト。最優先でパスすべき中核機能のテスト。

#### ② `ui` ワークスペース
- **対象**: Reactコンポーネント、カスタムフック、UIインタラクション
- **環境**: `jsdom` (ブラウザ環境をエミュレート)
- **パス**: `src/**/*.test.{ts,tsx}` (`logic` 以外のすべてのテスト)
- **セットアップ**: `src/test/setup.ts` にて Testing Library などの初期化を実施

### 1-2. 除外ディレクトリ
両ワークスペース共通で、以下のディレクトリはVitestの実行対象から除外されます。
- `**/node_modules/**`
- `tests/vlm/**` (外部VLMテスト等)
- `tests/e2e/**` (Playwright等のE2Eテスト)

## 2. 実行ロジックとガバナンス連携

テスト実行は `closure_gate.js`（100pt Closure Gate）と密接に連携しており、コード修正時の品質担保（Verification）の証跡として機能します。

- **実行コマンド**: `npx vitest run` (または `npm run test`)
- **T2/T3ティアのブロック条件**:
  `tsc --noEmit`（型チェック）および `vitest run` でエラーが1件でも発生した場合、Pushは物理的にブロック（Verification Block G8.1.4）されます。

## 3. 隔離（Quarantine）戦略とスキップ仕様 (改訂版)

現在、不安定なテストや既存の未解決バグによりテストスイート全体がブロックされるのを防ぐため、**Quarantine（隔離）戦略** が導入されています。ただし、無期限の隔離は禁止され、`DEBT_AND_FUTURE.md` による台帳（Ledger）管理へと移行しました。

### 3-1. 隔離ルールの厳格化と `closure_gate.js` による監視
1. **Quarantine Ledger (隔離テスト台帳)**: 隔離対象（`.quarantine`）となったファイルはすべて `DEBT_AND_FUTURE.md` に理由と復帰条件（Exit Criteria）を記載する必要があります。
2. **上限とTTL**: 同時に隔離できるファイルは **最大5本**、1ファイルあたりの隔離期間（TTL）は **最大14日** です。Gate実行時に隔離ファイル数が5本を超えると警告（Violation）となります。
3. **Smokeテストの手厚い保護**: `Smoke.test.tsx` はいかなる理由があっても `.quarantine` や `.skip` にしてはいけません。万一Gateが検知した場合は**即時Fatal Error（Exit 1）**として弾かれます。
4. **Skipの監視**: `*.test.tsx` 等の内部に `describe.skip` や `it.skip` を追加した場合、`closure_gate.js` が差分を検知し警告ログを出力します。無断のスキップは避け、必ずLedgerに記載してください。

### 3-2. 隔離されたテストファイル (現在)
現在、以下のファイルが `DEBT_AND_FUTURE.md` の管理下で一時的に隔離されています。
- `src/features/board/__tests__/BoardCanvas.sada.test.tsx.quarantine`
- `src/features/board/__tests__/CellSelection.sada.test.tsx.quarantine`
- `src/features/admin/__tests__/MasterData.sada.test.tsx.quarantine`

---

## 4. UIテストの基盤と段階的復帰ロードマップ

UIテスト(`ui` ワークスペース)におけるJSDOMの制約や重複コードを排他するため、テスト基盤は以下のように再構築されました。

### 4-1. Setupの分割と共通化 (TestProviders)
- **`src/test/setup.ts`**: 各種モックのエントリポイント。
- **`src/test/setup-mocks.ts`**: `ResizeObserver`, `IntersectionObserver`, `Canvas` 等のJSDOM非対応APIをグローバルにモック。
- **`src/test/TestProviders.tsx`**: `MemoryRouter` 等の共通Providerをラップしたコンポーネント。UIテストはこの `TestProviders` でラップすることで、冗長なセットアップを省きコンポーネントを描画できます。

### 4-2. 隔離テストの段階的復帰ロードマップ
現在隔離されているテストは以下の順序で復帰（`.quarantine` 削除）を目指します。

1. **Phase 1: Smokeテストの復帰 (完遂済)**
   最小限のルートマウント確認に絞り、`.skip` 無しで常時パスする状態を維持。
2. **Phase 2: Board系 (BoardCanvas / CellSelection)**
   JSDOMでの描画ピクセル完全一致を目的とせず、「適切なプロップスが渡り、代表的なDOMノード（ラッパー等）が存在するか」という結合テストレベルにダウングレードして復帰。
3. **Phase 3: Admin系 (MasterData)**
   MSWモック等で外部APIの揺らぎを固定化。読み取り（表示）のテストから先に復帰させ、編集・削除系の副作用テストは後追いとする。

---
**※注意**: 本構造は `AGENTS.md` の第2層【実行ゲート】および第3層【完遂プロトコル】に準拠して設計されています。`closure_gate.js` による並列実行や監視等、これらを勝手に迂回・削除することは重大な統治違反（T3）となります。
