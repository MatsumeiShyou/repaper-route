#!/usr/bin/env node
/**
 * Antigravity Pre-flight Gateway (v4.0)
 * 
 * Consolidates all governance checks into a single command.
 * Execution of this script is required by AGENTS.md §1.
 */

import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

const PROJECT_ROOT = process.cwd();
const SCRIPTS_DIR = path.join(PROJECT_ROOT, '.agent', 'scripts');

function runCheck(name, command) {
    console.log(`\n🚀 [Pre-flight] Running ${name}...`);
    try {
        const output = execSync(command, { cwd: PROJECT_ROOT, encoding: 'utf8' });
        console.log(output);
        return true;
    } catch (err) {
        console.error(`\n❌ [Pre-flight] ${name} FAILED`);
        if (err.stdout) console.error(err.stdout);
        if (err.stderr) console.error(err.stderr);
        return false;
    }
}

async function main() {
    console.log('🛡️  Antigravity Dynamic Governance: Pre-flight Check');
    console.log('==================================================');

    // 1. Seal Check (Identity & Permissions)
    const sealOk = runCheck('Seal Check', `node "${path.join(SCRIPTS_DIR, 'check_seal.js')}"`);
    if (!sealOk) process.exit(1);

    // 2. Self-Reflection (Compliance Audit)
    const reflectOk = runCheck('Compliance Audit', `node "${path.join(SCRIPTS_DIR, 'reflect.js')}"`);
    if (!reflectOk) process.exit(1);

    // 3. State Capture (Automated Snapshot)
    console.log('\n📸 [Pre-flight] Capturing State Snapshot...');
    try {
        const diff = execSync('git diff --stat', { cwd: PROJECT_ROOT, encoding: 'utf8' });
        if (diff) {
            fs.appendFileSync(path.join(PROJECT_ROOT, 'GOVERNANCE_REPORT.md'), `\n### Recent Changes (Auto-Snapshot)\n\`\`\`\n${diff}\n\`\`\`\n`, 'utf8');
            console.log('✅ Changes recorded in GOVERNANCE_REPORT.md');
        } else {
            console.log('ℹ️ No pending changes to snapshot.');
        }
    } catch (err) {
        console.warn('⚠️ Warning: Could not capture git snapshot.');
    }

    console.log('\n✨ [Pre-flight] ALL SYSTEMS NOMINAL. Implementation authorized.');
    process.exit(0);
}

main();
