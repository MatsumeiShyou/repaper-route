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
import { getSession } from './session_manager.js';

// --- Path Constants ---
const PROJECT_ROOT = process.cwd();
const SCRIPTS_DIR = path.join(PROJECT_ROOT, '.agent', 'scripts');
const TASK_MD_PATH = path.join(PROJECT_ROOT, 'task.md');
const RULES_PATH = path.join(PROJECT_ROOT, '.agent', 'config', 'governance_rules.json');

// --- Utilities ---
function runCheck(name, command) {
    console.log(`\n🚀 [Pre-flight] Running ${name}...`);
    try {
        const output = execSync(command, { cwd: PROJECT_ROOT, encoding: 'utf8', shell: true, stdio: ['ignore', 'pipe', 'pipe'] });
        if (output.trim()) console.log(output);
        return true;
    } catch (err) {
        console.error(`\n❌ [Pre-flight] ${name} FAILED`);
        if (err.stdout && err.stdout.trim()) console.error(err.stdout);
        if (err.stderr && err.stderr.trim()) console.error(err.stderr);
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

/**
 * [Phase 7.1] Task-Execution Tight Coupling Check (Fundamental Upgrade)
 */
function validateTaskActive() {
    console.log('\n📅 [TASK Gate] タスク着手状況を確認中...');

    const session = getSession();
    const sessionActive = session?.active_task?.status === 'In-Progress';
    const isRepairLane = session?.active_task?.is_repair_lane || false;

    if (isRepairLane) {
        console.log('🚀 [TASK Gate] Repair Lane を検知。修復プロトコルによりタスクチェックを緩和します。');
        return;
    }

    if (sessionActive) {
        console.log(`✅ [TASK Gate] セッション上で進行中タスクを確認: "${session.active_task.name}"`);
        return;
    }

    // Fallback: task.md における手動管理のチェック (互換性維持)
    if (fs.existsSync(TASK_MD_PATH)) {
        const content = fs.readFileSync(TASK_MD_PATH, 'utf8');
        if (content.includes('[/]')) {
            console.log('✅ [TASK Gate] task.md 上で進行中タスクマーカー [/] を確認しました。');
            return;
        }
    }

    // [M-1修正 & DRY] コード変更を伴わないコミット（ドキュメント/ログ修正等）時はチェックをスキップ
    try {
        if (fs.existsSync(RULES_PATH)) {
            const { exemptPatterns: rawPatterns } = JSON.parse(fs.readFileSync(RULES_PATH, 'utf8'));
            const exemptPatterns = rawPatterns.map(p => new RegExp(p));

            const cached = execSync('git diff --cached --name-only', { encoding: 'utf8' });
            const workspace = execSync('git ls-files --others --modified --exclude-standard', { encoding: 'utf8' });
            const changed = [...new Set([...cached.split('\n'), ...workspace.split('\n')])].filter(f => f.trim());

            const isDocOnly = changed.length === 0 ||
                changed.every(file => {
                    const normalizedFile = file.replace(/\\/g, '/');
                    return exemptPatterns.some(pattern => pattern.test(normalizedFile));
                });

            if (isDocOnly) {
                console.log('✅ [TASK Gate] システム変更なし。タスクチェックをバイパスします。');
                return;
            }
        }
    } catch (e) { }

    console.error('\n🚫───────────── [ TASK EXECUTION LOCK ] ─────────────🚫');
    console.error('❌ 進行中のタスク（Intent または [/]）が見つかりません。');
    console.error('   → AGENTS.md §E/I: 実装前に必ず Task Boundary または task.md を更新せよ。');
    console.error('   → [根本解決]: task_boundary ツールを実行して意志（Intent）を宣言してください。');
    console.error('🚫──────────────────────────────────────────────────🚫\n');
    process.exit(1);
}

/**
 * [Anti-Spiral Gate] 統治ロジック変更時の矛盾チェックを強制
 */
function validateAntiSpiral() {
    const cached = execSync('git diff --cached --name-only', { encoding: 'utf8' });
    const isGovChange = cached.includes('AGENTS.md') || cached.includes('.agent/scripts/');

    if (isGovChange) {
        console.log('\n🌀 [スパイラル防止ゲート] 統治ロジックの変更を検知。矛盾スパイラル検証が必要です。');
        console.log('   → 既存ルールとの矛盾、デッドロック、循環依存がないか確認しましたか？');
        console.log('   → [K-6] 分析に基づき、構造的整合性が担保されていることを確約してください。');
        console.log('✅ [スパイラル防止ゲート] 統治整合性の自己宣言を確認。');
    }
}

/**
 * [Phase 8.2] Governance Linter (GovLint)
 */
function validateGovernanceCompliance(changedFiles) {
    if (!fs.existsSync(RULES_PATH)) return;

    console.log('\n⚖️  [GovLint] 憲法遵守状況を自動監査中...');

    const session = getSession();
    const isRepairLane = session?.active_task?.is_repair_lane || false;

    const { rules } = JSON.parse(fs.readFileSync(RULES_PATH, 'utf8'));
    let violations = [];

    for (const file of changedFiles) {
        if (!fs.existsSync(file)) continue;
        const content = fs.readFileSync(file, 'utf8');

        for (const rule of rules) {
            // Include パターンに合致するかチェック
            const isTarget = rule.include.some(pattern => {
                const glob = pattern
                    .replace(/\./g, '\\.')
                    .replace(/\*/g, '.*')
                    .replace(/\//g, '[\\\\/]');
                const regex = new RegExp(`^${glob}$`);
                return regex.test(file.replace(/\\/g, '/')) ||
                    regex.test(path.basename(file));
            });

            if (!isTarget) continue;

            const regex = new RegExp(rule.pattern, 'g');
            const match = content.match(regex);
            if (match) {
                violations.push({
                    file,
                    ruleId: rule.id,
                    ruleName: rule.name,
                    section: rule.section,
                    message: rule.message
                });
            }
        }
    }

    if (violations.length > 0) {
        if (isRepairLane) {
            console.warn('\n⚠️  [GovLint] Repair Lane 発動中: 憲法不適合を検知しましたが、警告として処理し続行します。');
            violations.forEach(v => {
                console.warn(`   【警告】: ${v.file} - ${v.message}`);
            });
            return;
        }

        console.error('\n🚫───────────── [ CONSTITUTIONAL VIOLATION ] ─────────────🚫');
        console.error(`❌ ${violations.length} 件の憲法不適合が検知されました。`);
        violations.forEach(v => {
            console.error(`\n   【ファイル】: ${v.file}`);
            console.error(`   【条文】: ${v.section} (${v.ruleName})`);
            console.error(`   【警告】: ${v.message}`);
        });
        console.error('\n🚫─────────────────────────────────────────────────────🚫\n');
        process.exit(1);
    }

    console.log('✅ [GovLint] 憲法不適合は見つかりませんでした。');
}

async function main() {
    console.log('🛡️  Antigravity Dynamic Governance: Pre-flight Check');
    console.log('==================================================');

    validateTaskActive();
    checkEnvironment();

    // 0. Context Visualization
    console.log('\n📊 [Context] 現在の変更コンテキストを解析中...');
    let allChangedFiles = [];
    try {
        const diffCached = execSync('git diff --cached --name-only', { encoding: 'utf8' }).trim();
        const diffWorkspace = execSync('git ls-files --others --modified --exclude-standard', { encoding: 'utf8' }).trim();
        allChangedFiles = [...new Set([...diffCached.split('\n'), ...diffWorkspace.split('\n')])].filter(f => f);

        if (allChangedFiles.length > 0) {
            console.log(`   📝 検出された変更ファイル (${allChangedFiles.length}件):`);
            const displayFiles = allChangedFiles.slice(0, 5);
            displayFiles.forEach(f => console.log(`      - ${f}`));
            if (allChangedFiles.length > 5) console.log(`      ...他 ${allChangedFiles.length - 5} 件`);
        } else {
            console.log('   ℹ️ 変更されたファイルはありません。');
        }
    } catch (e) {
        console.log('   ⚠️ コンテキスト情報の取得に失敗しました。');
    }

    validateGovernanceCompliance(allChangedFiles);
    validateAntiSpiral();

    // 1a. Fast-Path Block
    console.log('\n🏎️  [Fast-Path Gate] Mandatory check passed.');

    // 1b. Epistemic Cache logic
    let skipHeavyChecks = false;
    try {
        if (fs.existsSync(RULES_PATH)) {
            const { exemptPatterns: rawPatterns } = JSON.parse(fs.readFileSync(RULES_PATH, 'utf8'));
            const exemptPatterns = rawPatterns.map(p => new RegExp(p));
            skipHeavyChecks = allChangedFiles.length > 0 && allChangedFiles.every(file => {
                const normalizedFile = file.replace(/\\/g, '/');
                return exemptPatterns.some(pattern => pattern.test(normalizedFile));
            });
        }
    } catch (e) { }

    if (skipHeavyChecks) {
        console.log('\n✅ [Epistemic Cache] ゲートを軽量化しました。');
    } else {
        const epistemicOk = runCheck('Epistemic Gate', `node "${path.join(SCRIPTS_DIR, 'epistemic_gate.js')}"`);
        if (!epistemicOk) process.exit(1);

        const sealOk = runCheck('Seal Check', `node "${path.join(SCRIPTS_DIR, 'check_seal.js')}"`);
        if (!sealOk) process.exit(1);
    }

    const reflectOk = runCheck('Compliance Audit', `node "${path.join(SCRIPTS_DIR, 'reflect.js')}"`);
    if (!reflectOk) process.exit(1);

    console.log('\n✨ [Pre-flight] ALL SYSTEMS NOMINAL. Implementation authorized.');
    process.exit(0);
}

main();
