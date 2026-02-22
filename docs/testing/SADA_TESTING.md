# SADA Testing Guide (Semantic-Aware Delta Assertion)

## 概要 (Overview)
**SADA (Semantic-Aware Delta Assertion) テスト** は、AIによるDOM関連テストの「トークン消費削減」と「検証制度の向上」を両立するために設計された、本プロジェクトにおける**最優先のテストアーキテクチャ**です。

テストスクリプト上でシナリオ（アクションの連続）を実行し、その過程で変化した「意味のあるDOM差分（セマンティクス）」のみを抽出し、AIに一括して検証（アサーション）させるアプローチをとります。

## コアコンポーネント (Core Components)

SADAテストは以下の3つのモジュールから構成されます（`src/test/ai/` 配下）。

### 1. `SemanticExtractor`
`dom-accessibility-api` をラップし、DOMから「AIが画面を理解するために必要な情報（Role, Name, Value, State, Text Content）」だけを抽出してJSON化するモジュールです。
- **Merkle Tree Hash**: 各ノードは自身の情報と「子孫ノードのハッシュリスト（出現順）」からハッシュを計算します。これにより、ルートノードのハッシュを比較するだけで、DOMツリーのどこかに変化があったかを O(1) で判定できます。
- **Pruning**: 意味を持たないラッパー要素（単なるスタイル用の `<div>` や `<span>`）は結果から自動的に枝刈り（Prune）され、トークンを節約します。
- **擬似要素の制約**: `jsdom` 環境では `::before` 等の CSS 疑似要素から内容を取得できません。アイコン等に意味を持たせている場合は、コンポーネント側に `aria-label` を付与して抽出可能にする必要があります。

### 2. `DeltaManager`
前回取得したDOMスナップショットと比較し、**変更があった部分のサブツリーだけ**を出力するステートフルなフィルターです。
- 変更のないノードは `{ unchanged: true, tag, role, name }` に圧縮されるため、コンテキストを維持しつつ長大なJSONの送信を防ぎます。
- **注意**: テストの並列実行による競合を防ぐため、`DeltaManager` はグローバルに持たず、テストシナリオ・バッチごとにインスタンス化して使用します。

### 3. `AITestBatcher`
シナリオ全体のアクション（操作ログ）と Delta を記録し、効率的にAIプロンプトを生成するためのフロー制御クラスです。

---

## 使い方 (How to Write SADA Test)

AIを用いたコンポーネントテスト（機能検証）を行う場合は、以下のパターンに従って記述してください。

```typescript
import { render, fireEvent } from '@testing-library/react';
import { AITestBatcher, PromptData } from '../../test/ai/AITestBatcher';
import { MyComponent } from './MyComponent';

describe('MyComponent SADA Test (Scenario Example)', () => {
    it('generates prompt data for complex user flow', async () => {
        // 1. バッチャーのインスタンス化
        const batcher = new AITestBatcher();

        // 2. コンポーネントのレンダリング
        const { container, getByRole } = render(<MyComponent />);

        // 3. 初期状態のスナップショット記録（必須）
        batcher.start(container);

        // --- シナリオ実行 ---
        
        // アクション 1: ユーザー操作
        fireEvent.change(getByRole('textbox', { name: 'Search' }), { target: { value: 'query' } });
        // バッチャーに変更内容とその結果の差分を記録
        batcher.recordAction(container, 'Searched for "query"', 'searchInput');

        // アクション 2: ボタンクリック
        fireEvent.click(getByRole('button', { name: 'Submit' }));
        batcher.recordAction(container, 'Clicked submit button', 'submitBtn');

        // --- AI プロンプト生成 ---
        
        // 目標とする検証内容を文字列として渡し、プロンプトデータを生成する
        const promptData: PromptData = batcher.generatePromptData(
            'Verify that searching for "query" and submitting displays the loading skeleton, then the results.'
        );

        // --- (この後、promptData を使って AI (LLM) エンドポイントへ投げるか、コンソールに出力して目視確認する) ---
        
        // プロトタイプ確認用であれば以下のようにスナップショットにしておくことも有効です。
        // expect(promptData).toMatchSnapshot();
    });
});
```

## エラーリカバリ (Error Diagnostics)
`getByRole` 等で要素が見つからず、テスト自体がクラッシュした場合、そこまでの「操作ログ」と「クラッシュ直前の状態」をAIに渡して原因を分析させることができます。

```typescript
try {
    // 操作...
    fireEvent.click(getByRole('button', { name: 'Not exists' }));
} catch (error) {
    // どこまで実行できて、DOMがどうなっていたかを診断用データとして抽出
    const diagnostic = batcher.generateErrorDiagnostic(error as Error, container);
    // これをAIに投げて修正案を推論させる
    console.error("Diagnostic Data for AI:", JSON.stringify(diagnostic, null, 2));
    throw error;
}
```

## 制約とベストプラクティス
- **Deterministic First**: 「ボタンが存在するか」「テキストが一致するか」などの確定的な（機械的に判定可能な）検証は、従来通り `expect(...).toBe(...)` のアサーションを使用してください。SADA（AI）に任せるのは「この一連のDOMの変化は、ユーザーシナリオとして破綻していないか・要件を満たしているか」という**曖昧さを含む総合的判断**のみに限定します。
- **キャッシュのライフサイクル**: `AITestBatcher` は `start()` が呼ばれるたびに内部の差分キャッシュ（`DeltaManager`）をリセットします。各テストケース (`it`) またはテストスイートごとなど、適切なタイミングで `start()` を呼んで初期化してください。
