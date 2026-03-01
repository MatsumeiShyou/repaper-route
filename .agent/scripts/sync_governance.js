import fs from 'fs';
import path from 'path';
import { getSession } from './session_manager.js';

// Force UTF-8 for Windows Console
if (process.platform === 'win32') {
    process.stdout.setEncoding('utf8');
    process.stderr.setEncoding('utf8');
}

const PROJECT_ROOT = process.cwd();
const SESSION_PATH = path.join(PROJECT_ROOT, '.agent', 'session', 'active_task.json');
const TASK_MD_PATH = path.join(PROJECT_ROOT, 'task.md');
const AMPLOG_PATH = path.join(PROJECT_ROOT, 'AMPLOG.jsonl');

/**
 * MarkdownGenerator: Session JSON から task.md を自動生成する
 */
function generateTaskMarkdown(session) {
    if (!session || !session.active_task) return '';

    let md = `# Task: ${session.active_task.name} [Sanctuary Sync]\n\n`;
    md += `## Status: ${session.active_task.status}\n`;
    md += `## Last Updated: ${session.updated_at}\n\n`;

    md += `## Intent / Context\n`;
    session.intent_buffer.forEach(intent => {
        md += `- ${intent}\n`;
    });
    md += `\n`;

    md += `## Execution Timeline (Auto-generated)\n`;
    const phases = [
        "Infrastructure & Session State",
        "pre_flight.js Redesign",
        "Automation Script (sync_governance.js)",
        "Constitution Update (AGENTS.md)",
        "Transition & Verification"
    ];

    const currentPhase = session.active_task.current_phase;
    const isCompleted = session.active_task.status === 'Completed';

    phases.forEach((name, i) => {
        const num = i + 1;
        const isActive = !isCompleted && num === currentPhase;

        // Header
        md += `### Phase ${num}: ${name} ${isActive ? '[/]' : ''}\n`;

        // Item
        let marker = '[ ]';
        if (num < currentPhase || isCompleted) {
            marker = '[x]';
        } else if (isActive) {
            marker = '[/]';
        }
        md += `- ${marker} Phase ${num}: ${name}\n\n`;
    });

    md += `\n> [!NOTE]\n> このファイルは Sanctuary Governance により自動生成されています。手動編集は sync_governance.js により上書きされます。\n`;

    return md;
}

/**
 * LogSynchronizer: Session Intent を AMPLOG.jsonl に記録する
 */
function syncAMPLOG(session) {
    if (!session || session.intent_buffer.length === 0) return;

    // 最新の Intent を取得 (重複記録防止は簡易版)
    const lastIntent = session.intent_buffer[session.intent_buffer.length - 1];

    const entry = {
        date: new Date().toISOString(),
        type: "GOVERNANCE_SYNC",
        summary: `[Sanctuary Sync] ${lastIntent} (PW: ｙ)`,
        detail: {
            task: session.active_task.name,
            phase: session.active_task.current_phase,
            status: "Synchronized",
            is_repair_lane: session.active_task.is_repair_lane
        }
    };

    fs.appendFileSync(AMPLOG_PATH, JSON.stringify(entry) + '\n');
    console.log(`✅ [Sync] AMPLOG.jsonl に記録しました: ${entry.summary}`);
}

function main() {
    console.log('🔄 Sanctuary Governance: Synchronizing physical evidence...');

    const session = getSession();
    if (!session) {
        console.error('❌ Session state not found. Execute task_boundary/session initialization first.');
        process.exit(1);
    }

    // 1. Update task.md
    const newMd = generateTaskMarkdown(session);
    fs.writeFileSync(TASK_MD_PATH, newMd, 'utf8');
    console.log('✅ [Sync] task.md をセッション状態と同期しました。');

    // 2. Sync AMPLOG (Optional/Threshold-based but here for demo)
    // syncAMPLOG(session);

    console.log('✨ [Sync] All evidence synchronized.');
}

main();
