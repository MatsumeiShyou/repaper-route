import fs from 'fs';
import path from 'path';

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
        fs.appendFileSync(ampLogPath, logEntry);
    } catch (e) { /* silent fail for audit log */ }
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
