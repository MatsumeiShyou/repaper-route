#!/usr/bin/env node
/**
 * AMPLOG Auto-Recording Script
 * 
 * Usage:
 *   Interactive:  node .agent/scripts/record_amp.js
 *   Non-interactive: node .agent/scripts/record_amp.js --title "X" --scope "Y" --impact "Z"
 * 
 * Automatically appends entries to AMPLOG.md with (PW: ｙ) seal.
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import gov, { REQUIRED_SEAL } from './lib/gov_core.js';

const AMPLOG_PATH = path.join(process.cwd(), 'AMPLOG.jsonl');

function parseArgs(argv) {
    const args = {};
    for (let i = 2; i < argv.length; i++) {
        if (argv[i] === '--title' && argv[i + 1]) {
            args.title = argv[++i];
        } else if (argv[i] === '--scope' && argv[i + 1]) {
            args.scope = argv[++i];
        } else if (argv[i] === '--impact' && argv[i + 1]) {
            args.impact = argv[++i];
        } else if (argv[i] === '--approver' && argv[i + 1]) {
            args.approver = argv[++i];
        } else if (argv[i] === '--audit' && argv[i + 1]) {
            args.audit = argv[++i];
        }
    }
    return args;
}

function updateTaskMd() {
    const TASK_MD_PATH = path.join(process.cwd(), 'task.md');
    if (!fs.existsSync(TASK_MD_PATH)) return;

    try {
        let content = fs.readFileSync(TASK_MD_PATH, 'utf8');
        if (content.includes('[/]')) {
            const newContent = content.replace(/\[\/\]/g, '[x]');
            fs.writeFileSync(TASK_MD_PATH, newContent, 'utf8');
            console.log('✅ task.md: 自動完了を適用しました ( [/] -> [x] )');
        }
    } catch (err) {
        console.error('⚠️ task.md の更新に失敗しました:', err.message);
    }
}

function recordEntry(title, scope, impact, approver, audit) {
    if (!fs.existsSync(AMPLOG_PATH)) {
        console.error(`❌ Error: AMPLOG.jsonl not found at ${AMPLOG_PATH}`);
        process.exit(1);
    }

    const date = new Date().toISOString().split('T')[0];
    let sealStatus = `承認 ${REQUIRED_SEAL}`;
    if (audit) {
        sealStatus = `承認 [Audit: ${audit}] ${REQUIRED_SEAL}`;
    }

    const entry = {
        id: Date.now(),
        date,
        type: 'AMP',
        summary: title,
        detail: {
            title,
            scope,
            impact,
            status: sealStatus,
            approver: approver || 'User (Approved)'
        },
        timestamp: new Date().toISOString()
    };

    try {
        const jsonLine = JSON.stringify(entry);
        fs.appendFileSync(AMPLOG_PATH, jsonLine + '\n', 'utf8');

        console.log('✅ Successfully recorded to AMPLOG.jsonl');
        console.log(`📍 ID: ${entry.id}`);

        updateTaskMd();
        return entry;
    } catch (err) {
        console.error('❌ Failed to write to AMPLOG.jsonl:', err.message);
        process.exit(1);
    }
}

function question(rl, prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}

async function interactiveMode() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    console.log('📝 AMPLOG Auto-Recording System');
    console.log('================================\n');

    if (!fs.existsSync(AMPLOG_PATH)) {
        console.error(`❌ Error: AMPLOG.md not found at ${AMPLOG_PATH}`);
        rl.close();
        process.exit(1);
    }

    const date = new Date().toISOString().split('T')[0];
    console.log(`Date: ${date}`);

    const title = await question(rl, '📌 Title (e.g., "Feature Implementation"): ');
    const scope = await question(rl, '🎯 Scope (e.g., "Add new API endpoint"): ');
    const impact = await question(rl, '💡 Impact (e.g., "Improved performance"): ');
    const approver = (await question(rl, '👤 Approver (default: "User (Approved)"): ')) || 'User (Approved)';
    const audit = await question(rl, '🔍 Audit/Reflection (optional): ');

    let status = `承認 ${REQUIRED_SEAL}`;
    if (audit) {
        status = `承認 [Audit: ${audit}] ${REQUIRED_SEAL}`;
    }
    const entry = `| ${date} | ${title} | ${scope} | ${impact} | ${approver} | ${status} |`;

    console.log('\n📋 Preview:');
    console.log('---');
    console.log(entry);
    console.log('---\n');

    const confirm = await question(rl, '✅ Record this entry? (y/n): ');

    if (confirm.toLowerCase() !== 'y') {
        console.log('❌ Cancelled.');
        rl.close();
        process.exit(0);
    }

    recordEntry(title, scope, impact, approver, audit);
    rl.close();
}

async function main() {
    const args = parseArgs(process.argv);

    // [AMI] AI-Machine Interface 承認チェック
    const AMI_PATH = path.join(process.cwd(), '.agent', 'session', 'approval.json');
    let amiApproval = null;
    if (fs.existsSync(AMI_PATH)) {
        try {
            amiApproval = JSON.parse(fs.readFileSync(AMI_PATH, 'utf8')).last_approval;
            console.log(`[AMI] Detected approval token: ${amiApproval.token} (${amiApproval.scope})`);
        } catch (e) { }
    }

    // 非対話モード (CLI引数またはAMI承認がある場合)
    if (args.title && args.scope && args.impact) {
        const approver = args.approver || 'User (Approved)';
        console.log('📝 AMPLOG 自動記録 (非対話モード)');
        recordEntry(args.title, args.scope, args.impact, approver, args.audit);
    } else if (amiApproval && amiApproval.token === 'ｙ') {
        // AMI モード: タイトルとスコープを推論または AMI から取得
        console.log('📝 AMPLOG 自動記録 (AMI 承認モード)');
        const title = amiApproval.scope || 'System Refactoring';
        const scope = 'Structural improvement of governance system';
        const impact = 'Eliminated environmental errors and cognitive noise';
        recordEntry(title, scope, impact, 'User (via AMI)', 'Auto-approved by user PW session');
    } else if (args.title || args.scope || args.impact) {
        console.error('❌ 非対話モードには --title, --scope, --impact が必須です');
        process.exit(1);
    } else {
        await interactiveMode();
    }
}

main();
