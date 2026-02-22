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
        const output = execSync(command, { cwd: PROJECT_ROOT, encoding: 'utf8', shell: true });
        console.log(output);
        return true;
    } catch (err) {
        console.error(`\n❌ [Pre-flight] ${name} FAILED`);
        if (err.stdout) console.error(err.stdout);
        if (err.stderr) console.error(err.stderr);
        return false;
    }
}

/**
 * [AGENTS.md §9] Shell Environment Integrity Check
 */
function checkEnvironment() {
    console.log('\n🔍 [Environment] Shell Compatibility Check...');
    const isWin = process.platform === 'win32';
    if (isWin) {
        console.log('   💻 OS: Windows');
        try {
            const psVersion = execSync('$PSVersionTable.PSVersion.Major', { shell: 'powershell.exe', encoding: 'utf8' }).trim();
            console.log(`   🐚 Shell: PowerShell v${psVersion}`);
            if (parseInt(psVersion) <= 5) {
                console.log('   ⚠️  NOTICE: PowerShell 5.1 detected. DO NOT use "&&" in shell commands. Use ";" instead.');
            }
        } catch (e) {
            console.log('   🐚 Shell: Standard Command Prompt / Unknown');
        }
    } else {
        console.log(`   💻 OS: ${process.platform} (Unix-like)`);
    }
}

async function main() {
    console.log('🛡️  Antigravity Dynamic Governance: Pre-flight Check');
    console.log('==================================================');

    // [AGENTS.md §9] Environmental Compliance Check
    checkEnvironment();

    // 0. Context Visualization
    console.log('\n📊 [Context] 現在の変更コンテキストを解析中...');
    try {
        const diffCached = execSync('git diff --cached --name-only', { encoding: 'utf8' }).trim();
        const diffWorkspace = execSync('git ls-files --others --modified --exclude-standard', { encoding: 'utf8' }).trim();
        const allFiles = [...new Set([...diffCached.split('\n'), ...diffWorkspace.split('\n')])].filter(f => f);

        if (allFiles.length > 0) {
            console.log(`   📝 検出された変更ファイル (${allFiles.length}件):`);
            const displayFiles = allFiles.slice(0, 5);
            displayFiles.forEach(f => console.log(`      - ${f}`));
            if (allFiles.length > 5) console.log(`      ...他 ${allFiles.length - 5} 件`);
        } else {
            console.log('   ℹ️ 変更されたファイルはありません。');
        }
    } catch (e) {
        console.log('   ⚠️ コンテキスト情報の取得に失敗しました。');
    }

    // 1. Seal Check (Identity & Permissions)
    const sealOk = runCheck('Seal Check', `node "${path.join(SCRIPTS_DIR, 'check_seal.js')}"`);
    if (!sealOk) process.exit(1);

    // 2. Self-Reflection (Compliance Audit)
    const reflectOk = runCheck('Compliance Audit', `node "${path.join(SCRIPTS_DIR, 'reflect.js')}"`);
    if (!reflectOk) process.exit(1);

    // 3. State Capture は reflect.js 内で GOVERNANCE_REPORT.md として完結するため、
    //    ここでの追記は不要（追記するとコミットループが発生するため削除）

    console.log('\n✨ [Pre-flight] ALL SYSTEMS NOMINAL. Implementation authorized.');
    process.exit(0);
}

main();
