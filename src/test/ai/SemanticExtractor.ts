// @ts-ignore
import { computeAccessibleName } from 'dom-accessibility-api';

export interface SemanticNode {
    tag: string;
    role: string | null;
    name: string;
    value: string | null;
    content: string; // 行内のテキストノード情報
    state: Record<string, boolean | string>;
    hash: string;
    children: SemanticNode[];
    testId?: string | null;
}

/**
 * SHA-256ライクな簡易ハッシュ関数（同期処理用）
 * プロトタイプ用のため実行速度を優先
 */
function simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(16);
}

const RELEVANT_STATES = [
    'aria-checked',
    'aria-expanded',
    'aria-hidden',
    'aria-selected',
    'aria-grabbed',
    'aria-dropeffect',
    'aria-live',
    'aria-atomic',
    'aria-busy',
    'disabled',
    'readonly',
    'required'
];

/**
 * DOMツリーからAIフレンドリーなセマンティックツリーを抽出する
 */
export class SemanticExtractor {

    /**
     * 指定されたDOM要素を起点にセマンティックツリーを構築する
     */
    static extract(element: Element): SemanticNode {
        return this.traverse(element);
    }

    private static traverse(element: Element): SemanticNode {
        const role = element.getAttribute('role') || this.inferRole(element);
        const name = computeAccessibleName(element);
        const value = element.getAttribute('value') || (element as HTMLInputElement).value || null;

        let content = '';
        element.childNodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) {
                content += node.nodeValue?.trim() || '';
            }
        });

        const state: Record<string, boolean | string> = {};
        for (const attr of RELEVANT_STATES) {
            if (element.hasAttribute(attr)) {
                state[attr] = element.getAttribute(attr) || true;
            }
            // プロパティとしての状態もチェック
            if ((element as any)[attr] !== undefined && (element as any)[attr] !== null && attr !== 'aria-hidden') {
                state[attr] = (element as any)[attr];
            }
        }

        const testId = element.getAttribute('data-testid');

        const children: SemanticNode[] = [];
        for (let i = 0; i < element.children.length; i++) {
            const childElement = element.children[i];
            const childNode = this.traverse(childElement);
            if (this.isMeaningful(childNode, childElement)) {
                children.push(childNode);
            } else if (childNode.children.length > 0) {
                // 自身に意味はないが子孫に意味がある場合は、子孫を持ち上げる
                children.push(...childNode.children);
            }
        }

        // DOMの出現順で子ハッシュを結合
        const childHashes = children.map(c => c.hash).join('|');
        const stateString = Object.entries(state).sort(([k1], [k2]) => k1.localeCompare(k2)).map(([k, v]) => `${k}:${v}`).join(',');

        // 自身のプロパティと子ハッシュからマークルハッシュを計算
        const rawString = `${role || ''}::${name}::${value || ''}::${content}::${stateString}::[${childHashes}]::${element.id || ''}`;
        const hash = simpleHash(rawString);

        return {
            tag: element.tagName.toLowerCase(),
            role,
            name,
            value,
            content,
            state,
            hash,
            children,
            testId
        };
    }

    /**
     * デフォルトのRole推論
     */
    private static inferRole(element: Element): string | null {
        // ... (省略箇所はないが、インデント維持のためそのまま記述)
        const tag = element.tagName.toLowerCase();
        const type = element.getAttribute('type');

        if (tag === 'button') return 'button';
        if (tag === 'a' && element.hasAttribute('href')) return 'link';
        if (tag === 'input') {
            if (type === 'checkbox') return 'checkbox';
            if (type === 'radio') return 'radio';
            if (type === 'text' || !type) return 'textbox';
        }
        if (tag === 'select') return 'combobox';

        return null;
    }

    /**
     * AIにとって意味のあるノードかどうかを判定する
     */
    private static isMeaningful(node: SemanticNode, element: Element): boolean {
        // 1. 基本的な意味のあるプロパティ
        const hasBasicMeaning = Boolean(
            node.name ||
            node.content ||
            node.role ||
            node.value ||
            Object.keys(node.state).length > 0 ||
            node.testId
        );

        if (hasBasicMeaning) return true;

        // 2. 参照関係の保護: ID保持または他者からの参照元になりうる属性
        // aria-labelledby などの参照先（ID）となっている可能性があるため、IDを持つ要素は残す
        if (element.id) return true;

        // 自身が他者を参照している場合もコンテキストとして重要
        const hasAriaRelations = (
            element.hasAttribute('aria-labelledby') ||
            element.hasAttribute('aria-describedby') ||
            element.hasAttribute('aria-controls') ||
            element.hasAttribute('aria-owns') ||
            element.hasAttribute('aria-flowto') ||
            element.hasAttribute('aria-activedescendant')
        );

        return hasAriaRelations;
    }
}
