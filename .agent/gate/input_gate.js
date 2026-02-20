import StateManager from './state_manager.js';

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
        const identity = StateManager.getActiveIdentity();

        // "これは「指示」ではなく状態注入である" という要件に基づき、
        // LLMがプロンプト内容としてパースする最後尾に絶対的な状態変数として付与する
        const injectedState = `\n\n[SYSTEM STATE INJECTION]\nactive_identity = "${identity}"\n`;

        return prompt + injectedState;
    }
}

export default InputGate;
