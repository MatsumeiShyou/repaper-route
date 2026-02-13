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

const AMPLOG_PATH = path.join(process.cwd(), 'AMPLOG.md');
const REQUIRED_SEAL = '(PW: ｙ)';

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
        }
    }
    return args;
}

function recordEntry(title, scope, impact, approver) {
    if (!fs.existsSync(AMPLOG_PATH)) {
        console.error(`❌ Error: AMPLOG.md not found at ${AMPLOG_PATH}`);
        process.exit(1);
    }

    const date = new Date().toISOString().split('T')[0];
    const entry = `| ${date} | ${title} | ${scope} | ${impact} | ${approver} | 承認 ${REQUIRED_SEAL} |`;

    try {
        const content = fs.readFileSync(AMPLOG_PATH, 'utf8');
        const newContent = content.trimEnd() + '\n' + entry + '\n';
        fs.writeFileSync(AMPLOG_PATH, newContent, 'utf8');

        console.log('✅ Successfully recorded to AMPLOG.md');
        console.log(`📍 Entry: ${entry}`);
        return entry;
    } catch (err) {
        console.error('❌ Failed to write to AMPLOG.md:', err.message);
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

    const entry = `| ${date} | ${title} | ${scope} | ${impact} | ${approver} | 承認 ${REQUIRED_SEAL} |`;

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

    recordEntry(title, scope, impact, approver);
    rl.close();
}

async function main() {
    const args = parseArgs(process.argv);

    // Non-interactive mode (CLI arguments provided)
    if (args.title && args.scope && args.impact) {
        const approver = args.approver || 'User (Approved)';
        console.log('📝 AMPLOG Auto-Recording (Non-Interactive Mode)');
        console.log('================================================\n');
        recordEntry(args.title, args.scope, args.impact, approver);
    } else if (args.title || args.scope || args.impact) {
        // Partial args = error
        console.error('❌ Non-interactive mode requires --title, --scope, and --impact');
        console.error('Usage: node record_amp.js --title "X" --scope "Y" --impact "Z"');
        process.exit(1);
    } else {
        // Interactive mode
        await interactiveMode();
    }
}

main();
