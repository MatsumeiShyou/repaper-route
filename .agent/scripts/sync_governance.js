import fs from 'fs';
import path from 'path';
import gov from './lib/gov_core.js';
// session_manager is still used for the active_task logic 
// which is broader than gov_core for now.
import { getSession } from './session_manager.js';

const PROJECT_ROOT = process.cwd();
const TASK_MD_PATH = path.join(PROJECT_ROOT, 'task.md');
const AMPLOG_PATH = path.join(PROJECT_ROOT, 'AMPLOG.jsonl');

/**
 * MarkdownGenerator: Session JSON から task.md を自動生成する
 */
function generateTaskMarkdown(session) {
    if (!session || !session.active_task) return '';

    let md = `# Task: ${session.active_task.name} [Sanctuary Sync]\n\n`;
    md += `## Status: ${session.active_task.status}\n`;
    md += `## Last Updated: ${new Date().toISOString()}\n\n`;

    md += `## Intent / Context\n`;
    (session.intent_buffer || []).forEach(intent => {
        md += `- ${intent}\n`;
    });
    md += `\n`;

    md += `## Execution Timeline (Auto-generated)\n`;

    // GaC: task_templates.json からフェーズ名を取得
    const phases = gov.getRule('task_templates', 'governance_refactoring') || [
        "Infrastructure & Session State",
        "pre_flight.js Redesign",
        "Automation Script (sync_governance.js)",
        "Constitution Update (AGENTS.md)",
        "Transition & Verification"
    ];

    const currentPhase = session.active_task.current_phase || 1;
    const isCompleted = session.active_task.status === 'Completed';

    phases.forEach((name, i) => {
        const num = i + 1;
        const isActive = !isCompleted && num === currentPhase;

        md += `### Phase ${num}: ${name} ${isActive ? '[/]' : ''}\n`;

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

function main() {
    console.log('🔄 Sanctuary Governance: Synchronizing physical evidence...');

    const session = getSession();
    if (!session) {
        console.error('❌ Session state not found. Execute task_boundary first.');
        process.exit(1);
    }

    // 1. Update task.md
    const newMd = generateTaskMarkdown(session);
    fs.writeFileSync(TASK_MD_PATH, newMd, 'utf8');
    console.log('✅ [Sync] task.md をセッション状態と同期しました。');

    console.log('✨ [Sync] All evidence synchronized.');
}

main();
