#!/usr/bin/env node
/**
 * Sanctuary Iron Lock: Setup Protocol (v1.0)
 * 
 * 統治環境と物理ゲートを一括設定する。
 */

import { writeFileSync, chmodSync, existsSync, readFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const PROJECT_ROOT = process.cwd();
const HOOK_PATH = join(PROJECT_ROOT, '.git', 'hooks', 'pre-push');

const hookContent = `#!/bin/sh
# Sanctuary Iron Lock: Pre-push Interlock
node .agent/scripts/push_gate.js
if [ $? -ne 0 ]; then
  exit 1
fi
`;

function setupHook() {
    console.log('[SETUP] Configuring Git Hooks...');
    if (!existsSync(join(PROJECT_ROOT, '.git'))) {
        console.error('❌ Error: .git directory not found. Are you in the project root?');
        return;
    }

    if (!existsSync(join(PROJECT_ROOT, '.git', 'hooks'))) {
        mkdirSync(join(PROJECT_ROOT, '.git', 'hooks'), { recursive: true });
    }

    writeFileSync(HOOK_PATH, hookContent.replace(/\r\n/g, '\n'), { encoding: 'utf8' });
    try {
        // Windows では chmod は完全には動作しないが、Git Bash 向けに設定を試みる
        chmodSync(HOOK_PATH, '755');
    } catch (e) {}
    console.log('✅ [SETUP] Pre-push hook installed.');
}

function updatePackageJson() {
    console.log('[SETUP] Updating package.json scripts...');
    const pkgPath = join(PROJECT_ROOT, 'package.json');
    if (!existsSync(pkgPath)) return;

    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    pkg.scripts = pkg.scripts || {};
    pkg.scripts['setup-governance'] = 'node .agent/scripts/setup_gate.js';
    pkg.scripts['done'] = 'node .agent/scripts/closure_gate.js --reflect';

    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf8');
    console.log('✅ [SETUP] scripts updated (setup-governance, done).');
}

function main() {
    console.log('\n🛡️  Sanctivity Iron Lock: INITIALIZING...');
    setupHook();
    updatePackageJson();
    console.log('✨ [SETUP] COMPLETED. Governance physical interlock is ACTIVE.\n');
}

main();
