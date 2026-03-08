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
