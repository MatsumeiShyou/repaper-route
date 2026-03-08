import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const SESSION_PATH = path.join(process.cwd(), '.agent', 'session', 'active_task.json');

export const getSession = () => {
    if (!fs.existsSync(SESSION_PATH)) return null;
    return JSON.parse(fs.readFileSync(SESSION_PATH, 'utf8'));
};

export const updateSession = (data) => {
    const current = getSession() || {};
    // current_request_id が未定義の場合は null で初期化
    if (current.active_task && current.active_task.current_request_id === undefined) {
        current.active_task.current_request_id = null;
    }
    const updated = { ...current, ...data, updated_at: new Date().toISOString() };
    fs.writeFileSync(SESSION_PATH, JSON.stringify(updated, null, 4));
};

export const isTaskActive = () => {
    const session = getSession();
    return session?.active_task?.status === 'In-Progress';
};

export const incrementRetryCount = (reason = 'Unknown failure') => {
    const session = getSession();
    if (!session || !session.active_task) return;

    const currentCount = session.active_task.t2_retry_count || 0;
    const newCount = currentCount + 1;

    updateSession({
        active_task: {
            ...session.active_task,
            t2_retry_count: newCount
        }
    });

    // AMPlOG への最小限の記録 (物理証跡)
    const ampLogPath = path.join(process.cwd(), 'AMPLOG.jsonl');
    const logEntry = JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'WARN',
        event: 'RETRY_INCREMENT',
        reason: reason,
        count: newCount,
        task: session.active_task.name
    }) + '\n';

    try {
        // process.on('exit') 下で確実に書き込むため、依存を最小化した fs.appendFileSync を同期実行
        fs.appendFileSync(ampLogPath, logEntry, 'utf8');
    } catch (e) {
        // 緊急フォールバック: コンソールへの直接出力 (これすら exit 時には見えない可能性があるが)
        console.error(`FAILED TO APPEND AUDIT LOG: ${e.message}`);
    }
};

export const resetRetryCount = () => {
    const session = getSession();
    if (!session || !session.active_task) return;

    updateSession({
        active_task: {
            ...session.active_task,
            t2_retry_count: 0
        }
    });
};

/**
 * 原因と結果の検証 (C-E-V) 証跡を物理的にロックする
 * @param {'negative' | 'positive'} type 
 * @param {string} content 証跡内容 (ログ等)
 */
export const lockEvidence = (type, content) => {
    const session = getSession();
    if (!session || !session.active_task) return;

    const hash = crypto.createHash('sha256').update(content).digest('hex');
    const field = type === 'negative' ? 'negative_proof' : 'positive_proof';

    updateSession({
        active_task: {
            ...session.active_task,
            [field]: content,
            evidence_hash: hash // 常に最新のハッシュを保持
        }
    });

    // AMPLOG への記録
    const ampLogPath = path.join(process.cwd(), 'AMPLOG.jsonl');
    const logEntry = JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'INFO',
        event: 'EVIDENCE_LOCKED',
        type: type,
        hash: hash,
        task: session.active_task.name
    }) + '\n';

    try {
        fs.appendFileSync(ampLogPath, logEntry, 'utf8');
    } catch (e) {
        console.error(`FAILED TO APPEND AUDIT LOG: ${e.message}`);
    }
};

/**
 * CAP v3.0: 思考ログを更新する
 * @param {number} stepId 
 * @param {string} mode 
 * @param {string} content 
 */
export const updateThinkingLog = (stepId, mode, content) => {
    const session = getSession();
    if (!session || !session.active_task) return;

    const currentLog = session.active_task.thinking_log || [];
    const requestId = session.active_task.current_request_id || null;

    const newEntry = {
        step_id: stepId,
        mode: mode,
        content: content, // 監査のためにテキスト自体を保持
        content_hash: crypto.createHash('sha256').update(content).digest('hex'),
        request_id: requestId, // 指示 ID とのバインド
        timestamp: new Date().toISOString()
    };

    updateSession({
        active_task: {
            ...session.active_task,
            thinking_log: [...currentLog, newEntry]
        }
    });
};

/**
 * CAP v3.0: 再設計（思考やり直し）回数をインクリメントする
 */
export const incrementRedesignCount = () => {
    const session = getSession();
    if (!session || !session.active_task) return;

    const currentCount = session.active_task.redesign_count || 0;

    updateSession({
        active_task: {
            ...session.active_task,
            redesign_count: currentCount + 1
        }
    });

    // AMPLOG への記録
    const ampLogPath = path.join(process.cwd(), 'AMPLOG.jsonl');
    const logEntry = JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'WARN',
        event: 'REDESIGN_INCREMENT',
        count: currentCount + 1,
        task: session.active_task.name
    }) + '\n';

    try { fs.appendFileSync(ampLogPath, logEntry, 'utf8'); } catch (e) { }
};

/**
 * CAP v3.0: 指示IDの変更を検知し、古い思考ログをアーカイブ（クリア）する
 * @param {string} newRequestId 
 */
export const archiveOldThoughts = (newRequestId) => {
    const session = getSession();
    if (!session || !session.active_task) return;

    const currentRequestId = session.active_task.current_request_id;
    if (currentRequestId !== newRequestId) {
        console.log(`[session_manager] Request-ID change detected: ${currentRequestId} -> ${newRequestId}. Archiving old thoughts.`);
        updateSession({
            active_task: {
                ...session.active_task,
                current_request_id: newRequestId,
                thinking_log: [] // ログをクリアして鮮度を保証
            }
        });
    }
};

/**
 * Sentinel 5.0: 憲法資産のスナップショットを撮影し記録する
 */
export const captureGovSnapshot = () => {
    const session = getSession();
    if (!session || !session.active_task) return;

    // すでにスナップショットが存在し、かつ立法モードでない場合は上書きしない
    const currentSnapshot = session.active_task.gov_snapshot || {};
    const hasSnapshot = Object.keys(currentSnapshot).length > 0;
    const isLegislationMode = session.active_task.mode === 'LEGISLATION'; // 未来の拡張用

    if (hasSnapshot && !isLegislationMode) {
        console.log('[session_manager] Gov snapshot already exists. Skipping capture to enforce immutability.');
        return;
    }

    const condPath = path.join(process.cwd(), 'governance', 'closure_conditions.json');
    if (!fs.existsSync(condPath)) return;

    const { governance_paths } = JSON.parse(fs.readFileSync(condPath, 'utf8'));
    const snapshot = {};

    function scan(target) {
        const absPath = path.isAbsolute(target) ? target : path.join(process.cwd(), target);
        if (!fs.existsSync(absPath)) return;

        if (fs.statSync(absPath).isDirectory()) {
            fs.readdirSync(absPath).forEach(file => scan(path.join(target, file)));
        } else {
            const content = fs.readFileSync(absPath, 'utf8');
            const hash = crypto.createHash('sha256').update(content).digest('hex');
            const relPath = path.relative(process.cwd(), absPath).replace(/\\/g, '/');
            snapshot[relPath] = hash;
        }
    }

    console.log('[session_manager] Capturing governance snapshot...');
    governance_paths.forEach(p => scan(p));

    updateSession({
        active_task: {
            ...session.active_task,
            gov_snapshot: snapshot
        }
    });
};

/**
 * Sentinel 5.2: ユーザー承認（ｙ）のタイムスタンプを物理的に記録する
 */
export const recordApproval = () => {
    const session = getSession();
    if (!session || !session.active_task) return;

    updateSession({
        active_task: {
            ...session.active_task,
            last_y_approval_at: new Date().toISOString()
        }
    });

    // AMPLOG への記録 (直近の ADR を引き継ぐ)
    const ampLogPath = path.join(process.cwd(), 'AMPLOG.jsonl');
    let adr = null;
    try {
        const lines = fs.readFileSync(ampLogPath, 'utf8').trim().split('\n');
        const lastEntry = JSON.parse(lines[lines.length - 1]);
        adr = lastEntry.adr || lastEntry.adr_ref || null;
    } catch (e) { }

    const logEntry = JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'INFO',
        event: 'USER_APPROVAL_RECORDED',
        task: session.active_task.name,
        adr: adr
    }) + '\n';
    try { fs.appendFileSync(ampLogPath, logEntry, 'utf8'); } catch (e) { }
};

/**
 * CAP v3.0: セッションの最終更新日時のみを更新する
 */
export const touchSession = () => {
    updateSession({});
};
