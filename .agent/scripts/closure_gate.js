#!/usr/bin/env node

/**
 * 100pt Closure Gate (pre-push hook) — v5.0
 * 憲法 §L. 完遂プロトコル（リスク比例型）に基づく物理門番
 */

import { execSync, spawn } from 'child_process';
import { existsSync, readdirSync, statSync, readFileSync } from 'fs';
import { join } from 'path';
import { parseArgs } from 'util';

// --- Configuration & Constants ---
const REFLECT_FLAG = process.argv.includes('--reflect');
const BRANCH = 'main';

// --- ティア判定 ---
function getActiveTier() {
    const sessionPath = join(process.cwd(), '.agent', 'session', 'active_task.json');
    try {
        if (existsSync(sessionPath)) {
            const session = JSON.parse(readFileSync(sessionPath, 'utf8'));
            return session?.active_task?.tier || null;
        }
    } catch (e) { /* ignore */ }
    return null;
}

// --- Logger Utility ---
const Log = {
    info: (msg) => console.log(`\x1b[36m[CLOSURE GATE]\x1b[0m ${msg}`),
    success: (msg) => console.log(`\x1b[32m[CLOSURE GATE] ✓ ${msg}\x1b[0m`),
    warn: (msg) => console.log(`\x1b[33m[CLOSURE GATE] ⚠️ ${msg}\x1b[0m`),
    error: (msg) => console.error(`\x1b[31m[CLOSURE GATE] ❌ ${msg}\x1b[0m`),
    sealed: (tier) => console.log(`\x1b[42m\x1b[30m [CLOSURE GATE] All checks passed. 100pt Sealed (${tier || 'LEGACY'}). \x1b[0m\n`)
};

// --- Execution Helper ---
const runCommand = (cmd, allowFail = false) => {
    try {
        return execSync(cmd, { encoding: 'utf-8', stdio: 'pipe' }).trim();
    } catch (error) {
        if (!allowFail) {
            throw error;
        }
        return error.stdout ? error.stdout.toString().trim() : '';
    }
};

// --- Parallel Execution Helper ---
const runCommandAsync = (cmd, args) => {
    return new Promise((resolve, reject) => {
        const proc = spawn(cmd, args, { stdio: 'inherit', shell: true });
        proc.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Command ${cmd} ${args.join(' ')} failed with exit code ${code}`));
            }
        });
    });
};

// --- [Adjustment 2] Zombie Process Cleanup ---
function cleanZombieProcesses() {
    if (process.platform !== 'win32') return;
    Log.info('Scanning for zombie test processes holding file locks...');
    try {
        // 特定のキーワードを含む Node プロセスを強制終了（このスクリプト自体は除外されるはずだが安全のため Stop-Process を使用）
        const cmd = 'powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { ($_.Name -eq \'node.exe\') -and ($_.CommandLine -like \'*vitest*\' -or $_.CommandLine -like \'*npm test*\') } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"';
        runCommand(cmd, true);
        Log.success('Physical process cleanup successful.');
    } catch (e) {
        Log.warn('Process cleanup skipped or failed.');
    }
}

// --- [Adjustment 1] Reflection Chain ---
function executeReflection(tier) {
    Log.info('Starting Atomic Reflection Chain (Pull -> Commit -> Push)...');

    try {
        // 1. Stage all changes first to allow rebase
        Log.info('  -> Staging changes (git add -A)...');
        runCommand('git add -A');

        // 2. Pre-push Sync
        Log.info('  -> Syncing with remote (git pull --rebase)...');
        try {
            runCommand(`git pull --rebase origin ${BRANCH}`);
        } catch (pullError) {
            Log.warn('Rebase failed. Attempting to resolve via stash...');
            runCommand('git stash');
            runCommand(`git pull --rebase origin ${BRANCH}`);
            runCommand('git stash pop', true);
            runCommand('git add -A');
        }

        // 3. Inventory check
        const status = runCommand('git status --porcelain');
        if (!status) {
            Log.success('No local changes to commit. Push skipped.');
            return;
        }

        // 4. Generate Commit Message (v6.0 Logic)
        const commitMsg = `[${tier || 'T3'}] Automated Task Closure (GaC v6.0) [事実] 物理連鎖ゲートによる自動反映 [理由] 反映漏れの構造的防止`;

        // 5. Commit
        Log.info(`  -> Committing changes: ${commitMsg}`);
        runCommand(`git commit -m "${commitMsg}" --no-verify`);

        // 6. Final Push
        Log.info('  -> Pushing to origin...');
        runCommand(`git push origin ${BRANCH}`);

        Log.success('Reflection Chain SEALED.');
    } catch (error) {
        Log.error('Reflection Chain aborted due to fatal error.');
        throw error;
    }
}

async function main() {
    const activeTier = getActiveTier();
    Log.info(`Initiating 100pt Closure Protocol (Tier: ${activeTier || 'AUTO'})...`);

    try {
        // [§L] Epistemic Bypass Check + ティア統合
        Log.info('Checking changed files (Epistemic Bypass + Tier)...');
        let changedFilesStr = '';
        try {
            changedFilesStr = runCommand('git diff --name-only @{u} HEAD');
        } catch (e) {
            Log.warn('Could not determine upstream branch. Epistemic Bypass disabled (Full check enforced).');
            changedFilesStr = runCommand('git diff --name-only --cached');
        }

        const changedFiles = changedFilesStr.split('\n').map(f => f.trim()).filter(f => f.length > 0);

        // T1 は即パス（テスト不要）
        if (activeTier === 'T1') {
            Log.success('T1 (低リスク): テスト検証をバイパスします。');
        }

        // Epistemic Bypass（ドキュメントのみ）
        let bypassEligible = false;

        if (changedFiles.length > 0) {
            const isBypassable = (file) => {
                return file.endsWith('.md') ||
                    file.endsWith('.json') ||
                    file.endsWith('AMPLOG.md') ||
                    file.startsWith('.vscode') ||
                    file.startsWith('.agent/');
            };
            bypassEligible = changedFiles.every(isBypassable);

            if (bypassEligible) {
                Log.success('Epistemic Bypass Activated: Only documents/configs changed. Skipping heavy tests.');
            } else {
                Log.info(`Code changes detected (${changedFiles.length} files). Full Verification Required.`);
            }
        } else {
            Log.info('No unpushed file changes detected. Proceeding with standard gate.');
        }

        // [G8.1.3] Safety Block Check
        Log.info('Checking for uncleaned temporary files (Safety Block)...');
        const findCmd = process.platform === 'win32'
            ? 'powershell -NoProfile -Command "Get-ChildItem -Path . -Recurse -Exclude node_modules,.git,.supabase,dist -Include *.bak,debug_*,temp_*,test_report* | Select-Object -ExpandProperty FullName"'
            : 'find . -type d \\( -name node_modules -o -name .git -o -name .supabase -o -name dist \\) -prune -o -type f \\( -name "*.bak" -o -name "debug_*" -o -name "temp_*" -o -name "test_report*" \\) -print';

        const garbageFiles = runCommand(findCmd, true);
        if (garbageFiles && garbageFiles.length > 0) {
            Log.warn('Temporary files detected. Executing Auto-Cleanup (Safe Disposal)...');
            const filesToDelete = garbageFiles.split('\n').filter(f => f.trim() !== '');
            for (const file of filesToDelete) {
                try {
                    Log.info(`  -> Removing: ${file}`);
                    if (existsSync(file)) {
                        runCommand(process.platform === 'win32' ? `Remove-Item -Force "${file}"` : `rm -f "${file}"`, true);
                    }
                } catch (delErr) {
                    Log.error(`Failed to delete ${file}`);
                }
            }
            Log.success('Auto-Cleanup passed. Workspace is clean.');
        } else {
            Log.success('Workspace is clean.');
        }

        // [§L] tsc & vitest Check（ティア制御）+ Quarantine/Skip 監視
        if (!bypassEligible && activeTier !== 'T1') {
            Log.info('Analyzing git diff for Gate violations...');
            let gitDiffAdded = '';
            try {
                gitDiffAdded = runCommand('git diff --cached -U0', true);
            } catch (e) { /* ignore */ }

            if (gitDiffAdded) {
                const diffLines = gitDiffAdded.split('\n');
                let currentFile = '';
                for (const line of diffLines) {
                    if (line.startsWith('+++ b/')) {
                        currentFile = line.substring(6);
                    } else if (line.startsWith('+') && !line.startsWith('+++')) {
                        if (typeof currentFile === 'string' && (currentFile.endsWith('.test.ts') || currentFile.endsWith('.test.tsx'))) {
                            if (line.includes('describe.skip') || line.includes('it.skip') || line.includes('test.skip')) {
                                Log.warn(`[WARNING] A .skip directive was detected in ${currentFile}. Please ensure you documented this in DEBT_AND_FUTURE.md.`);
                            }
                        }
                    }
                }
            }

            Log.info(`Running Type Check and Test Suite in PARALLEL [${activeTier || 'FULL'}]...`);
            try {
                const typeCheck = runCommandAsync('npx', ['tsc', '--noEmit']);
                const vitestRun = runCommandAsync('npx', ['vitest', 'run']);
                await Promise.all([typeCheck, vitestRun]);
                Log.success('Parallel Type Check and Test Suite passed successfully.');
            } catch (e) {
                Log.error('Parallel Test Execution failed.');
                throw new Error('Verification Block (G8.1.4): Type errors or test failures detected.');
            }
        }

        // --- [GaC v6.0] Reflection Sequence ---
        if (REFLECT_FLAG) {
            cleanZombieProcesses();
            executeReflection(activeTier);
        } else {
            Log.info('Execution mode: Verification Only (--reflect flag not detected).');
        }

        Log.sealed(activeTier);
        process.exit(0);

    } catch (error) {
        Log.error('Closure Protocol failed.');
        if (error.message) console.error(error.message);
        Log.error('Process aborted. Reflection blocked.');
        process.exit(1);
    }
}

main();
