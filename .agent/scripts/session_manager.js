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

export const incrementRetryCount = () => {
    const session = getSession();
    if (!session || !session.active_task) return;

    const currentCount = session.active_task.t2_retry_count || 0;
    updateSession({
        active_task: {
            ...session.active_task,
            t2_retry_count: currentCount + 1
        }
    });
};
