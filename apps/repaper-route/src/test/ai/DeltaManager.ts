import { SemanticNode } from './SemanticExtractor';

export interface DeltaNode extends Partial<SemanticNode> {
    unchanged?: boolean;
    children?: any[];
}

/**
 * マークルツリー型の状態比較を提供し、AIへの送信データ量を削減するマネージャー。
 * Vitest等の並列テスト実行時の競合を避けるため、テストケース（シナリオ）ごとに
 * インスタンス化して使用する設計としています。
 */
export class DeltaManager {
    // 過去に存在したすべてのノードのハッシュを平坦に記録するセット
    private knownHashes = new Set<string>();

    /**
     * 新しいツリーの差分を取り出し、キャッシュを更新する
     */
    public getDelta(currentTree: SemanticNode): DeltaNode {
        // 初回実行時：全ツリーをそのまま返し、ハッシュをキャッシュ
        if (this.knownHashes.size === 0) {
            this.updateCache(currentTree);
            return currentTree;
        }

        // ルートハッシュから全く変化がない場合
        if (this.knownHashes.has(currentTree.hash)) {
            return { unchanged: true, hash: currentTree.hash, role: currentTree.role, name: currentTree.name };
        }

        // 差分ツリーを構築
        const delta = this.buildDelta(currentTree);

        // 生成後に新しい状態をキャッシュ
        this.updateCache(currentTree);

        return delta;
    }

    /**
     * 再帰的に既知のハッシュと一致するノードを枝刈り（Prune）する
     */
    private buildDelta(node: SemanticNode): DeltaNode {
        if (this.knownHashes.has(node.hash)) {
            // このサブツリー全体は前回と完全に同じ状態（構造・プロパティ包含）であるため、内容を省略する。
            // AIに「ここにはこの要素が以前のまま存在する」というコンテキストだけは与えるため、tag/role/nameは残す。
            return {
                unchanged: true,
                tag: node.tag,
                role: node.role,
                name: node.name
            };
        }

        // 自身が新しい、または子孫のどこかが変更されている場合
        return {
            ...node,
            children: node.children.map(c => this.buildDelta(c))
        };
    }

    private updateCache(tree: SemanticNode) {
        this.knownHashes.clear();
        this.collectHashes(tree);
    }

    private collectHashes(node: SemanticNode) {
        this.knownHashes.add(node.hash);
        node.children.forEach(c => this.collectHashes(c));
    }
}
