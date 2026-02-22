import { SemanticExtractor, SemanticNode } from './SemanticExtractor';
import { DeltaManager, DeltaNode } from './DeltaManager';

export interface BatchOperation {
    action: string;
    target?: string;
    delta?: DeltaNode; // アクション実行後のDOM構造の差分
}

export interface PromptData {
    goal: string;
    initialState: SemanticNode;
    steps: BatchOperation[];
}

export interface ErrorDiagnosticData {
    error: string;
    stack?: string;
    executedSteps: BatchOperation[];
    failedState: SemanticNode | null;
}

/**
 * AIによる判定プロセスをバッチ化（シーケンシャル化）し、
 * APIコールの回数削減と、エラー時のコンテキストリカバリを提供するマネージャー。
 * テストシナリオごとにインスタンスを生成して使用する。
 */
export class AITestBatcher {
    private operations: BatchOperation[] = [];
    private deltaManager: DeltaManager;
    private initialTree: SemanticNode | null = null;

    constructor() {
        this.deltaManager = new DeltaManager();
    }

    /**
     * バッチの検証コンテキストを開始する。
     * 画面の初期状態を記録する。
     */
    public start(container: Element) {
        this.initialTree = SemanticExtractor.extract(container);
        this.deltaManager.getDelta(this.initialTree); // 初期キャッシュの構築
        this.operations = [];
    }

    /**
     * ユーザーのアクション（クリック、文字入力等）とその結果生じたUI差分を記録する。
     */
    public recordAction(container: Element, actionDescription: string, targetTestId?: string) {
        if (!this.initialTree) {
            throw new Error("AITestBatcher requires calling start() before recordAction()");
        }

        const currentTree = SemanticExtractor.extract(container);
        const delta = this.deltaManager.getDelta(currentTree);

        this.operations.push({
            action: actionDescription,
            target: targetTestId,
            delta
        });
    }

    /**
     * 記録された初期状態とすべてのアクション差分を結合し、
     * AIへのプロンプトに添付するためのデータを生成する。
     * AIには「このgoalを達成するためのUI操作履歴として、整合性があるか（期待する状態推移か）」を問う。
     */
    public generatePromptData(goal: string): PromptData {
        if (!this.initialTree) {
            throw new Error("No data recorded. Call start() at least.");
        }
        return {
            goal,
            initialState: this.initialTree,
            steps: this.operations
        };
    }

    /**
     * テスト環境側での要素取得エラーなど、アクション実行中に例外が起きた場合に、
     * AIに失敗原因を自己推論させるためのデバッグデータを生成する。
     */
    public generateErrorDiagnostic(error: Error, currentContainer?: Element): ErrorDiagnosticData {
        return {
            error: error.message,
            stack: error.stack,
            executedSteps: this.operations,
            failedState: currentContainer ? SemanticExtractor.extract(currentContainer) : null
        };
    }
}
