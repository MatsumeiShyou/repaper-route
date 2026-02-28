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
        const output = execSync(command, { cwd: PROJECT_ROOT, encoding: 'utf8', shell: true, stdio: ['ignore', 'pipe', 'inherit'] });
        console.log(output);
        return true;
    } catch (err) {
        console.error(`\n❌ [Pre-flight] ${name} FAILED`);
        if (err.stdout) console.error(err.stdout);
        // stderr は stdio で inherit しているため自動出力される
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
 * [Phase 7.1] Task-Execution Tight Coupling Check
 * task.md に進行中タスク [/] が存在するか検証する
 */
const TASK_MD_PATH = path.join(PROJECT_ROOT, 'task.md');

function validateTaskActive() {
    console.log('\n📅 [TASK Gate] タスク着手状況を確認中...');

    if (!fs.existsSync(TASK_MD_PATH)) {
        console.warn('   ⚠️  task.md が見つかりません。チェックをスキップします。');
        return;
    }

    const content = fs.readFileSync(TASK_MD_PATH, 'utf8');
    const hasInProgress = content.includes('[/]');

    // [M-1修正 & DRY] コード変更を伴わないコミット（ドキュメント/ログ修正等）時は [/] チェックをスキップ
    if (!hasInProgress) {
        try {
            const RULES_PATH = path.join(PROJECT_ROOT, '.agent', 'config', 'governance_rules.json');
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
                console.log('✅ [TASK Gate] ドキュメント/一時ファイルの変更のみを確認。タスク着手チェックをバイパスします。');
                return;
            }
        } catch (e) {
            // git error等
        }
    }

    if (!hasInProgress) {
        console.error('\n🚫───────────── [ TASK EXECUTION LOCK ] ─────────────🚫');
        console.error('❌ task.md に進行中タスク「[/]」が見つかりません。');
        console.error('   → AGENTS.md §D/I: 実装前に必ずタスクを着手状態にせよ。');
        console.error('   → task.md を更新し、対応する項目に [/] を付与してください。');
        console.error('🚫──────────────────────────────────────────────────🚫\n');
        process.exit(1);
    }

    console.log('✅ [TASK Gate] 進行中タスクを確認しました。実装を続行します。');
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
 * 憲法条文に基づき、禁止パターンを物理的にスキャンする
 */
const RULES_PATH = path.join(PROJECT_ROOT, '.agent', 'config', 'governance_rules.json');

function validateGovernanceCompliance(changedFiles) {
    if (!fs.existsSync(RULES_PATH)) return;

    console.log('\n⚖️  [GovLint] 憲法遵守状況を自動監査中...');
    const { rules } = JSON.parse(fs.readFileSync(RULES_PATH, 'utf8'));
    let violations = [];

    for (const file of changedFiles) {
        if (!fs.existsSync(file)) continue;
        const content = fs.readFileSync(file, 'utf8');

        for (const rule of rules) {
            // Include パターンに合致するかチェック (簡易)
            const isTarget = rule.include.some(pattern => {
                const glob = pattern.replace(/\*/g, '.*').replace(/\//g, '[\\\\/]');
                return new RegExp(`^${glob}$`).test(file.replace(/\\/g, '/')) ||
                    new RegExp(`${glob}`).test(file.replace(/\\/g, '/'));
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

    // [Phase 7.1] Task-Execution Lock
    validateTaskActive();

    // [AGENTS.md §9] Environmental Compliance Check
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

    // [Phase 8.2] Governance Linter
    validateGovernanceCompliance(allChangedFiles);

    // 1a. [AGENTS.md §F + FAST_PATH.md §4] Fast-Path Mandatory Self-Check
    // § B-1(AMP)遵守のため、Proposal段階でFast-Path適用可否を宣言することを物理的に強制する。
    console.log('\n🏎️  [Fast-Path Gate] 変更の軽量化資格チェック...');
    console.log('   ╔══════════════════════════════════════════════════════════╗');
    console.log('   ║  [MANDATORY] EXECUTOR はこの問いに必ず回答してから進め   ║');
    console.log('   ╚══════════════════════════════════════════════════════════╝');
    console.log('   ┌─ Fast-Path 適用資格 (全て ✅ → Fast-Path 申請を検討せよ) ─┐');
    console.log('   │ 1. 今回の変更は「表示層のみ」か？（CSS/文言/静的コンテンツ）│');
    console.log('   │ 2. useState/useEffect/API呼出し等のロジックに触れないか？  │');
    console.log('   │ 3. 既存のSADAテスト・CIの結果を破壊しないか？            │');
    console.log('   └──────────────────────────────────────────────────────────┘');
    console.log('   💡 全て YES → Proposalで「Fast-Path適用を申請」と宣言すること');
    console.log('   💡 一つでも NO → 通常AMP（フルゲート）で進むこと');
    console.log('   ⚠️  この問答を無言でスキップすることは § B-1 統治違反である。\n');

    // 1b. [AGENTS.md §K-6] Epistemic Transparency Gate
    // 高リスク分析時の認識論的マーカー（層分離・自己批判・確信度開示）の物理検証
    const epistemicOk = runCheck('Epistemic Gate', `node "${path.join(SCRIPTS_DIR, 'epistemic_gate.js')}"`);
    if (!epistemicOk) process.exit(1);

    // 1. Seal Check (Identity & Permissions)
    const sealOk = runCheck('Seal Check', `node "${path.join(SCRIPTS_DIR, 'check_seal.js')}"`);
    if (!sealOk) process.exit(1);

    // 2. Self-Reflection (Compliance Audit)
    const reflectOk = runCheck('Compliance Audit', `node "${path.join(SCRIPTS_DIR, 'reflect.js')}"`);
    if (!reflectOk) process.exit(1);

    // 3. Context Injection (Anti-Recurrence) - [AGENTS.md §K]
    console.log('\n🧠 [Prevention] 過去の失敗パターンを参照中...');
    try {
        // 現在の変更ファイル名をキーワードとして inject_context に渡す
        const changedFiles = execSync('git diff --cached --name-only', { encoding: 'utf8' }).trim().split('\n').join(' ');
        const injection = execSync(`node "${path.join(SCRIPTS_DIR, 'inject_context.js')}" --task "${changedFiles}"`, {
            cwd: PROJECT_ROOT,
            encoding: 'utf8'
        });
        if (injection.trim()) {
            console.log('\n' + injection);
        } else {
            console.log('   ✅ 関連する既知の失敗パターンは見つかりませんでした。');
        }
    } catch (e) {
        console.log('   ⚠️ コンテキスト注入スキップ（解析エラー）');
    }

    // 3. State Capture は reflect.js 内で GOVERNANCE_REPORT.md として完結するため、
    //    ここでの追記は不要（追記するとコミットループが発生するため削除）

    console.log('\n✨ [Pre-flight] ALL SYSTEMS NOMINAL. Implementation authorized.');
    process.exit(0);
}

main();
