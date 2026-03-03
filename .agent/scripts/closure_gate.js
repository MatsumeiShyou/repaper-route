#!/usr/bin/env node

/**
 * 100pt Closure Gate (pre-push hook) — v5.0
 * 憲法 §L. 完遂プロトコル（リスク比例型）に基づく物理門番
 */

import { execSync } from 'child_process';
import { existsSync, readdirSync, statSync, readFileSync } from 'fs';
import { join } from 'path';

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
                    // Windows/Unix 双方で動作するよう fs を使用 (existsSync は先頭で import 済み)
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

        // [§L] tsc & vitest Check（ティア制御）
        if (!bypassEligible && activeTier !== 'T1') {
            Log.info(`Running Type Check (tsc --noEmit) [${activeTier || 'FULL'}]...`);
            try {
                execSync('npx tsc --noEmit', { stdio: 'inherit' });
                Log.success('Type Check passed.');
            } catch (e) {
                Log.error('Type Check (tsc) failed.');
                throw new Error('Verification Block (G8.1.4): Type errors detected.');
            }

            Log.info('Running Full Test Suite (vitest run)...');
            try {
                // Now running full suite thanks to Quarantine strategy (skipping broken tests via .skip)
                execSync('npx vitest run', { stdio: 'inherit' });
                Log.success('All active tests passed (Legacy tests quarantined/skipped).');
            } catch (e) {
                Log.error('Vitest failed.');
                throw new Error('Verification Block (G8.1.4): One or more tests failed.');
            }
        }

        Log.sealed(activeTier);
        process.exit(0);

    } catch (error) {
        Log.error('Closure Protocol failed.');
        if (error.message) console.error(error.message);
        Log.error('Push rejected. Please resolve the issues and try again.');
        process.exit(1);
    }
}

main();
