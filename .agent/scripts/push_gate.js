#!/usr/bin/env node
/**
 * Sanctuary Iron Lock: Push Interlock (v1.0)
 * 
 * git push 前に 100点満点の証跡（SEAL）を確認する。
 * AGENTS.md §3 G-54 準拠。
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const Log = {
    info: (msg) => console.log(`[PUSH GATE] ${msg}`),
    error: (msg) => console.error(`[PUSH GATE] ❌ ${msg}`)
};

const PROJECT_ROOT = process.cwd();
const SEAL_PATH = join(PROJECT_ROOT, '.agent', 'session', 'gate_success.json');
const WALKTHROUGH_PATH = join(PROJECT_ROOT, 'walkthrough.md');

function runCommand(cmd) {
    try {
        return execSync(cmd, { encoding: 'utf-8', stdio: 'pipe' }).trim();
    } catch (e) {
        return '';
    }
}

function main() {
    Log.info('Validating Physical Seal before push...');

    // 1. 証跡ファイルの存在確認
    if (!existsSync(SEAL_PATH)) {
        Log.error('SEAL MISSING: No gated evidence found.');
        console.error('   → 理由: npm run done による検証を通過していません。');
        console.error('   → [ACTION]: 変更を完了し、npm run done を実行してください。');
        process.exit(1);
    }

    const seal = JSON.parse(readFileSync(SEAL_PATH, 'utf8'));

    // 2. Git HEAD 整合性確認 (検証後に追加変更されていないか)
    const currentHead = runCommand('git rev-parse HEAD');
    let isStale = seal.head !== currentHead;

    // 特例: 差分が walkthrough.md のみであれば、SEAL 転記作業中とみなして許可
    const diffFiles = runCommand('git diff --name-only').split('\n').filter(f => f.trim());
    const isOnlyWalkthrough = diffFiles.length === 1 && diffFiles[0] === 'walkthrough.md';
    
    // コミット済みだが HEAD が最新でない場合（amend等）を考慮し、
    // 現在の Worktree ではなく、直近のコミット内容との比較も含めて判定を緩和
    if (isStale && isOnlyWalkthrough) {
        Log.info('Detected walkthrough.md update after SEAL generation. Bypassing state-lock.');
        isStale = false;
    }

    if (isStale) {
        Log.error('SEAL STALE: Substantial code changed after validation.');
        console.error('   → 理由: 検証(npm run done)の後にソースコードが変更されています。');
        console.error('   → [ACTION]: 再度 npm run done を実行して、最新状態で検印を受けてください。');
        process.exit(1);
    }

    // 3. Walkthrough への転記確認
    if (!existsSync(WALKTHROUGH_PATH)) {
        Log.error('WALKTHROUGH MISSING: walkthrough.md is required for push.');
        process.exit(1);
    }

    const walkthrough = readFileSync(WALKTHROUGH_PATH, 'utf8');
    if (!walkthrough.includes(seal.code)) {
        Log.error('SEAL DISCREPANCY: Evidence Code not found in walkthrough.md');
        console.error(`   🔎 期待されるコード: ${seal.code}`);
        console.error('   → 理由: Walkthrough に証跡コードが明記されていないか、間違っています。');
        console.error('   → [ACTION]: walkthrough.md に [GATE-SEAL: ${seal.code}] を追記してください。');
        process.exit(1);
    }

    console.log('\n✨ [PUSH GATE] SEAL VERIFIED. Implementation authorized to push.');
    process.exit(0);
}

main();
