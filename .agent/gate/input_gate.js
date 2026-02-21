import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import StateManager from './state_manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BOOTSTRAP_FILE_PATH = path.join(__dirname, '.bootstrap_identity_used');

class InputGate {
    /**
     * LLMへのリクエスト直前に呼び出され、active_identityという状態を強制注入する。
     * LLMが無視、改変、再解釈できないように、システムプロンプトの末尾などに
     * 物理的に結合する。
     * 
     * @param {string} prompt 元のプロンプト
     * @returns {string} 状態が注入されたプロンプト
     */
    static inject(prompt) {
        let identity;
        try {
            identity = StateManager.getActiveIdentity();
        } catch (error) {
            // Gate（StateManager）からの取得に失敗（ファイル未定義など）した場合の Bootstrap ロジック
            if (!fs.existsSync(BOOTSTRAP_FILE_PATH)) {
                identity = "ANALYZER";
                fs.writeFileSync(BOOTSTRAP_FILE_PATH, 'true', 'utf-8');
                console.log('[STATE RECORD]: BOOTSTRAP_ANALYZER_APPLIED');
            } else {
                // 2回目以降は完全停止
                throw new Error('[FATAL ERROR]: Bootstrap Identity already used. System blocked.');
            }
        }

        // 1. 宣言型入力の正規化 (Declarative Input Protocol)
        let normalizedPrompt = prompt;
        if (typeof prompt === 'string' && prompt.trim() !== '') {
            const declarativeKeys = [
                /State:/i, /Decision:/i, /Reason:/i, /Intent:/i,
                /Context:/i, /Assumption:/i, /Concern:/i
            ];

            const hasDeclarativeKey = declarativeKeys.some(regex => regex.test(prompt));

            if (!hasDeclarativeKey) {
                // 非宣言型入力を Intent として強制変換
                normalizedPrompt = `Intent:\n${prompt}`;
            }
        }

        // "これは「指示」ではなく状態注入である" という要件に基づき、
        // LLMがプロンプト内容としてパースする最後尾に絶対的な状態変数として付与する
        const injectedState = `\n\n[SYSTEM STATE INJECTION]\nactive_identity = "${identity}"\n`;

        return normalizedPrompt + injectedState;
    }
}

export default InputGate;
