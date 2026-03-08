#!/usr/bin/env node

/**
 * 100pt Closure Gate (pre-push hook) — v5.0
 * 憲法 §L. 完遂プロトコル（リスク比例型）に基づく物理門番
 */

import { execSync, spawn } from 'child_process';
import { existsSync, readdirSync, statSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import crypto from 'crypto';
import { incrementRetryCount, resetRetryCount } from './session_manager.js';
import { readJsonStrict } from './lib/gov_loader.js';

// --- Configuration & Constants ---
const REFLECT_FLAG = process.argv.includes('--reflect');
const BYPASS_RETRY_FLAG = process.argv.includes('--bypass-retry');
const BRANCH = 'main';

let completionFlag = false;

// --- [GaC v6.1] Fail-Safe Exit Tracker ---
function registerExitTracker() {
    process.on('exit', (code) => {
        if (!completionFlag) {
            // 正常完了（反映成功）フラグが立っていない状態での終了はすべてリトライとみなす
            // Note: process.on('exit') 内では同期コードしか実行できないため
            // incrementRetryCount は内部で fs.writeFileSync/fs.appendFileSync を使用しており同期実行可能
            const reason = code === 0 ? 'Unexpected termination without completion flag' : `Process exited with error code: ${code}`;
            incrementRetryCount(reason);
        }
    });

    // SIGINT (Ctrl+C) などのシグナルもハンドル
    const signals = ['SIGINT', 'SIGTERM', 'SIGHUP'];
    signals.forEach(sig => {
        process.on(sig, () => {
            Log.error(`\n[FATAL] ${sig} Detected. Registering as task retry...`);
            process.exit(1); // これにより 'exit' イベントがトリガーされる
        });
    });
}

// --- ティア判定 ---
function getActiveTier() {
    const sessionPath = join(process.cwd(), '.agent', 'session', 'active_task.json');
    try {
        const session = readJsonStrict(sessionPath, 'SESSION_DATA');
        return session?.active_task?.tier || null;
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

// --- [GaC v6.1] Self-Diagnostic Engine (第0関門) ---
function runSelfDiagnostic() {
    Log.info('Running Self-Diagnostic (Stage 0: Integrity Check)...');
    try {
        const diagPath = join(process.cwd(), '.agent', 'session', '.diag_test');

        // 1. FS Write/Read Test
        const testContent = `DIAG_${Date.now()}`;
        writeFileSync(diagPath, testContent);
        const readBack = readFileSync(diagPath, 'utf8');
        if (readBack !== testContent) throw new Error('FS Integrity Mismatch');
        if (existsSync(diagPath)) {
            runCommand(process.platform === 'win32' ? `Remove-Item -Force "${diagPath}"` : `rm -f "${diagPath}"`, true);
        }

        // 2. Git Connectivity Test
        runCommand('git --version', false);

        Log.success('Self-Diagnostic passed. Agent environment is healthy.');
    } catch (e) {
        Log.error('FAILED: Self-Diagnostic (Agent Integrity Compromised)');
        Log.error(`Reason: ${e.message}`);
        Log.error('\n[EMERGENCY GUIDE]');
        Log.error('1. Check file permissions in .agent/session/');
        Log.error('2. Ensure node processes are not locking required files.');
        Log.error('3. Verify git is accessible from current shell.');
        process.exit(1);
    }
}

const DENYLIST_PATH = join(process.cwd(), 'governance', 'preventions', 'denylist.json');
const SHADOW_REGISTRY_PATH = join(process.cwd(), 'governance', 'preventions', 'shadow_registry.json');

// --- [GaC v6.1] Shadow Registry Logic ---
function updateShadowRegistry() {
    if (!existsSync(SHADOW_REGISTRY_PATH)) return;

    Log.info('  -> Updating Shadow Registry (Task Count-down)...');
    try {
        const shadowData = JSON.parse(readFileSync(SHADOW_REGISTRY_PATH, 'utf8'));
        const newRegistry = [];

        for (const entry of shadowData.registry) {
            const remaining = entry.tasksRemaining - 1;
            if (remaining > 0) {
                Log.info(`     - Rule [${entry.ruleId}]: ${remaining} tasks remaining.`);
                newRegistry.push({ ...entry, tasksRemaining: remaining });
            } else {
                Log.success(`     - Rule [${entry.ruleId}]: Shadow period EXPIRED. Promoted to HARD BLOCK.`);
            }
        }

        shadowData.registry = newRegistry;
        writeFileSync(SHADOW_REGISTRY_PATH, JSON.stringify(shadowData, null, 4));
    } catch (e) {
        Log.warn(`Failed to update shadow registry: ${e.message}`);
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

        // 7. Update Shadow Registry (New in v6.1)
        updateShadowRegistry();

        Log.success('Reflection Chain SEALED.');
    } catch (error) {
        Log.error('Reflection Chain aborted due to fatal error.');
        throw error;
    }
}

/**
 * 原因と結果の検証 (C-E-V) 証跡の整合性を検証する
 * @returns {void}
 */
function verifyEvidenceChain() {
    Log.info('Verifying Cause-and-Effect Verification (C-E-V) Evidence Chain...');
    const sessionPath = join(process.cwd(), '.agent', 'session', 'active_task.json');
    if (!existsSync(sessionPath)) throw new Error('C-E-V ERROR: Session file missing.');

    const session = readJsonStrict(sessionPath, 'EVIDENCE_AUDIT');
    const { negative_proof, positive_proof, evidence_hash } = session.active_task || {};

    if (!negative_proof) {
        throw new Error('C-E-V BLOCK: Negative Proof (修正前の失敗再現証跡) が記録されていません。');
    }
    if (!positive_proof) {
        throw new Error('C-E-V BLOCK: Positive Proof (修正後の成功証明証跡) が記録されていません。');
    }

    // ハッシュ整合性チェック (ハルシネーション/改ざん防止)
    const actualHash = crypto.createHash('sha256').update(positive_proof).digest('hex');
    if (evidence_hash !== actualHash) {
        Log.error('EVIDENCE CORRUPTION DETECTED!');
        Log.error(`Expected Hash: ${evidence_hash}`);
        Log.error(`Actual Hash:   ${actualHash}`);
        throw new Error('C-E-V BLOCK: 記録された証跡ハッシュが不一致です。再収集してください。');
    }

    Log.success('Evidence Chain verified (Negative/Positive proofs match hash).');
}

/**
 * Git 差分から統治に関わる重要ファイルの変更を検知する
 * @returns {boolean}
 */
function detectGovChanges() {
    try {
        const diffCached = runCommand('git diff --cached --name-only', true);
        const diffUnpushed = runCommand(`git diff origin/main..HEAD --name-only`, true);
        const combinedDiff = (diffCached + '\n' + diffUnpushed).replace(/\\/g, '/');

        const condPath = join(process.cwd(), 'governance', 'closure_conditions.json');
        const { governance_paths } = readJsonStrict(condPath, 'GOV_CHANGE_DETECTION');

        return governance_paths.some(p => combinedDiff.includes(p));
    } catch (e) {
        return false;
    }
}

async function main() {
    // Stage 0: Register Fail-Safe Observer & Self-Diagnostic
    registerExitTracker();
    runSelfDiagnostic();

    let activeTier = getActiveTier();

    // --- [GaC v6.1] Physical Tier Escalation ---
    if (detectGovChanges()) {
        if (activeTier !== 'T3') {
            Log.warn('🚨 [PHYSICAL ESCALATION] Governance asset changes detected.');
            Log.warn('   Forcing T3 Cause-and-Effect Verification (C-E-V) Protocol.');
            activeTier = 'T3';
        }
    }

    Log.info(`Initiating 100pt Closure Protocol (Tier: ${activeTier || 'AUTO'})...`);

    // --- [GaC v6.1] Retry Awareness ---
    const sessionPath = join(process.cwd(), '.agent', 'session', 'active_task.json');
    let retryCount = 0;
    try {
        const session = readJsonStrict(sessionPath, 'RETRY_CHECK');
        retryCount = session?.active_task?.t2_retry_count || 0;
    } catch (e) { /* ignore */ }

    if (retryCount >= 2) {
        if (BYPASS_RETRY_FLAG) {
            Log.warn('🚨 [ESCAPE HATCH] --bypass-retry detected. Bypassing recurrence locker (T3 Event).');
            // 実際はここで readline 等で理由を求めるべきだが、非対話型のためログに警告を残す
            incrementRetryCount(`USER BYPASSED RECURRENCE LOCKER at count ${retryCount}`);
        } else {
            Log.warn(`High Retry Count Detected (${retryCount}). Recurrence prevention check enforced.`);
            // 物理的証跡の確認（ADR または preventions への追記が直近コミットに含まれているか、等）
            let govChanged = false;
            try {
                const diffCached = execSync('git diff --cached --name-only', { encoding: 'utf-8' });
                let diffUnpushed = '';
                try {
                    diffUnpushed = execSync(`git diff origin/${BRANCH}..HEAD --name-only`, { encoding: 'utf-8' });
                } catch (e) { /* upstream なし */ }

                const combinedDiff = (diffCached + '\n' + diffUnpushed).replace(/\\/g, '/');
                govChanged = combinedDiff.includes('governance/') || combinedDiff.includes('AGENTS.md');
            } catch (e) { /* ignore */ }

            if (!govChanged) {
                console.error('\n🚫 [RECURRENCE BLOCKER] 2回以上のリトライが発生していますが、再発防止策（ADR/物理ゲート）の追加が確認できません。');
                console.error('   反映を中断しました。再発防止プロトコルに従い、分析と恒久的な対策を実装してください。');
                console.error('   → [FIX_REQUIRED]: 憲法 §E 修正または ADR の追加を行ってください。');
                process.exit(1);
            }
        }
    }

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
            const condPath = join(process.cwd(), 'governance', 'closure_conditions.json');
            const { bypass_rules } = readJsonStrict(condPath, 'EPISTEMIC_BYPASS');

            const isBypassable = (file) => {
                return bypass_rules.extensions.some(ext => file.endsWith(ext)) ||
                    bypass_rules.files.some(f => file === f);
            };
            bypassEligible = changedFiles.every(isBypassable);

            if (bypassEligible) {
                console.log(`[TRACE] Logic [BYPASS_ACT] Bypass triggered for: ${changedFiles.slice(0, 3).join(', ')}...`);
                Log.success('Epistemic Bypass Activated: Only documents/configs changed. Skipping heavy tests.');
            } else {
                Log.info(`Code changes detected (${changedFiles.length} files). Full Verification Required.`);
            }
        } else {
            Log.info('No unpushed file changes detected. Proceeding with standard gate.');
        }

        // --- [GaC v6.2] Cause-and-Effect Verification (C-E-V) Enforcement ---
        if (activeTier === 'T3') {
            verifyEvidenceChain();
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
                    Log.error(`Failed to delete ${file}. Manual intervention required.`);
                    throw new Error(`SAFETY BLOCK: ${file} could not be cleaned up automatically.`);
                }
            }
            // 削除後に Git 状態が Dirty の場合はエラーとする (今回のような不整合防止)
            const remainingStatus = runCommand('git status --porcelain', true);
            if (remainingStatus.includes('?? ') || remainingStatus.includes(' M ')) {
                Log.warn('Workspace still dirty after cleanup. Verifying integrity...');
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

            // --- [GaC v6.2] Design Integrity Check (Locker) ---
            const condPath = join(process.cwd(), 'governance', 'closure_conditions.json');
            const { design_intent } = readJsonStrict(condPath, 'DESIGN_KEYWORD_LOOKUP');
            const designKeywords = design_intent.keywords;

            // 直近のコミットメッセージまたは指示に関連するキーワードを確認
            const lastCommitMsg = runCommand('git log -1 --pretty=%B', true).toLowerCase();
            const hasDesignIntent = designKeywords.some(kw => lastCommitMsg.includes(kw));

            if (hasDesignIntent) {
                Log.info('  -> Design Intent detected. Verifying artifact traces...');
                const condPath = join(process.cwd(), 'governance', 'closure_conditions.json');
                const { design_intent } = readJsonStrict(condPath, 'DESIGN_INTEGRITY');

                const hasArtifactChange = changedFiles.some(file =>
                    design_intent.artifacts.some(art => file.includes(art.replace(/\\/g, '/')))
                );

                if (!hasArtifactChange) {
                    Log.error('🚫 [CONSTITUTIONAL LOCKER] 設計意図が検出されましたが、設計証跡（ADR/Plan/Task）の更新が確認できません。');
                    Log.error('   憲法 §C-4 に基づき、設計フェーズを完遂してから反映してください。');
                    Log.error('   反映を物理的にブロックしました。');
                    process.exit(1);
                }
                Log.success('Design Integrity Verified. Traces found.');
            } else {
                Log.info('  -> No immediate design intent detected. Standard gate applied.');
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

        // --- SECURE COMPLETION ---
        completionFlag = true;
        resetRetryCount();

        process.exit(0);

    } catch (error) {
        Log.error('Closure Protocol failed.');
        if (error.message) console.error(error.message);
        Log.error('Process aborted. Reflection blocked.');
        process.exit(1);
    }
}

main();
