import StateManager from './state_manager.js';

class OutputGate {
    /**
     * LLMの出力結果を検査し、不適切な指示や分析が含まれていた場合は破棄し固定文字列を返す。
     * 
     * @param {string} response LLMからの出力テキスト
     * @returns {string} 検査済み出力 または 遮断メッセージ
     */
    static audit(response) {
        const identity = StateManager.getActiveIdentity();

        // 検査1：人格自己宣言・人格切替示唆のチェック
        const selfDeclarationPatterns = [
            /identity\s*=\s*(["']?)(ANALYZER|EXECUTOR)\1/gi,
            /私は(ANALYZER|EXECUTOR)です/gi,
            /私は.*人格です/gi,
            /active_identity/gi, // 出力内にこの変数をコントロールしようとする記載があること自体を禁止
            /人格を.*切り替え/gi
        ];

        for (const pattern of selfDeclarationPatterns) {
            if (pattern.test(response)) {
                return this._getBlockMessage();
            }
        }

        // 検査2：現在の人格に反する行為のチェック
        if (identity === 'ANALYZER') {
            // ANALYZER時：実行・設計・指示・コード・手順 → 即 INVALID
            // 実装のヒントやコードブロック、作業手順を出すことを禁止する
            const executorPatterns = [
                /```(javascript|js|typescript|ts|python|html|css)/gi, // コードブロック全般
                /実行手順/g,
                /実装手順/g,
                /ソースコード/g,
                /実装します/g,
                /修正します/g,
                /実行します/g
            ];

            for (const pattern of executorPatterns) {
                if (pattern.test(response)) {
                    return this._getBlockMessage();
                }
            }
        } else if (identity === 'EXECUTOR') {
            // EXECUTOR時：分析のみで停止・提案拒否・承認待ち → 即 INVALID
            const analyzerPatterns = [
                /分析のみ/g,
                /提案は行いません/g,
                /承認をお待ちして/g,
                /判断のみ/g,
                /承認をお願いします/g
            ];

            for (const pattern of analyzerPatterns) {
                if (pattern.test(response)) {
                    return this._getBlockMessage();
                }
            }
        }

        // 違反がない場合はそのままのレスポンスを通過させる
        return response;
    }

    static _getBlockMessage() {
        // 仕様で指定された固定レスポンス
        return `[REASON]: active_identity と不整合な出力を検出\n[ACTION]: Gate により遮断`;
    }
}

export default OutputGate;
