import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IDENTITY_FILE_PATH = path.join(__dirname, '.identity');
const VALID_IDENTITIES = ['ANALYZER', 'EXECUTOR'];

class StateManager {
    /**
     * 現在の active_identity を外部ファイルから取得する
     * 未定義・不正値の場合は即時エラーをスローしてプロセスをブロックする
     * @returns {string} 'ANALYZER' または 'EXECUTOR'
     */
    static getActiveIdentity() {
        if (!fs.existsSync(IDENTITY_FILE_PATH)) {
            throw new Error('[FATAL ERROR]: .identity file not found. System blocked.');
        }

        const identity = fs.readFileSync(IDENTITY_FILE_PATH, 'utf-8').trim();

        if (!VALID_IDENTITIES.includes(identity)) {
            throw new Error(`[FATAL ERROR]: Invalid identity '${identity}'. System blocked.`);
        }

        return identity;
    }

    /**
     * active_identity を外部ファイルに書き込む
     * @param {string} identity 'ANALYZER' または 'EXECUTOR'
     */
    static setActiveIdentity(identity) {
        if (!VALID_IDENTITIES.includes(identity)) {
            throw new Error(`[FATAL ERROR]: Invalid identity '${identity}'. System blocked.`);
        }

        fs.writeFileSync(IDENTITY_FILE_PATH, identity, 'utf-8');
    }
}

export default StateManager;
