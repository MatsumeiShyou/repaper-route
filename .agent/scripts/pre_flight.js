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

// Force UTF-8 for Windows Console
if (process.platform === 'win32') {
    if (process.stdout.isTTY) process.stdout.setEncoding('utf8');
    if (process.stderr.isTTY) process.stderr.setEncoding('utf8');
}

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
 * 変更がドキュメントや除外パターンのみに限定されているかを判定する統合関数
 */
function isDocOnlyValidation(changedFiles) {
    if (changedFiles.length === 0) return true;
    try {
        if (fs.existsSync(RULES_PATH)) {
            const { exemptPatterns: rawPatterns } = JSON.parse(fs.readFileSync(RULES_PATH, 'utf8'));
            const exemptPatterns = rawPatterns.map(p => new RegExp(p));
            return changedFiles.every(file => {
                const normalizedFile = file.replace(/\\/g, '/');
                return exemptPatterns.some(pattern => pattern.test(normalizedFile));
            });
        }
    } catch (e) { }
    return false;
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
    const cached = execSync('git diff --cached --name-only', { encoding: 'utf8' });
    const workspace = execSync('git ls-files --others --modified --exclude-standard', { encoding: 'utf8' });
    const changed = [...new Set([...cached.split('\n'), ...workspace.split('\n')])].filter(f => f.trim());

    if (isDocOnlyValidation(changed)) {
        console.log('✅ [TASK Gate] 非コード資産（ドキュメント等）の変更のみ。タスクチェックをバイパスします。');
        return;
    }

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
 * [Phase 2] 決定論的 Cognitive Checkpoint (Binary Validation)
 * `task.md` の全完了（`active_task.json` の status: Completed）時に、
 * 物理的証跡（DEBT_AND_FUTURE.md または AMPLOG.jsonl）の更新が伴っているかを検証する。
 */
function validateCognitiveCheckpoint(changedFiles) {
    const session = getSession();
    // 完了宣言であるかを判定
    if (session?.active_task?.status === 'Completed') {
        // 変更ファイルの中に物理証跡が含まれているか
        const hasEvidence = changedFiles.some(file =>
            file.includes('DEBT_AND_FUTURE.md') ||
            file.includes('AMPLOG.jsonl') ||
            file.includes('AMPLOG.md')
        );

        if (!hasEvidence) {
            if (isDocOnlyValidation(changedFiles)) {
                console.log('✅ [CCP Gate] 分析・ドキュメント更新のみのため、CCP物理証跡要件を免除します。');
                return;
            }
            console.error('\n🚫───────────── [ EPISTEMIC LOCK: CCP ] ─────────────🚫');
            console.error('❌ Cognitive Checkpoint (CCP) 検証失敗: 物理的証跡の更新がありません。');
            console.error('   → タスク完了 (`status: Completed`) を宣言する際は、必ず本実行による');
            console.error('     「副作用の自己反駁」を DEBT_AND_FUTURE.md に 1行以上追記するか、');
            console.error('     AMPLOG に履歴情報を記録してください。');
            console.error('   → [根本解決]: DEBT_AND_FUTURE.md 等に変更を加えた上で再試行してください。');
            console.error('🚫─────────────────────────────────────────────────────🚫\n');
            process.exit(1);
        } else {
            console.log('✅ [CCP Gate] 完了宣言に伴う物理的証跡の更新を確認しました。');
        }
    }
}

/**
 * [Phase 3] Smart DB Sync Validation
 * Git差分に `supabase/migrations/` の変更が含まれる場合のみ、
 * ローカルDBに対する差分チェック（DRY-RUN）を発動し、GRANT漏れやエラーを防ぐ。
 */
function validateSmartDbSync(changedFiles) {
    const hasMigrationChanges = changedFiles.some(file =>
        file.replace(/\\/g, '/').includes('supabase/migrations/') && file.endsWith('.sql')
    );

    if (hasMigrationChanges) {
        console.log('\n🗄️  [Smart DB Gate] マイグレーションの変更を検知。Dry-Run検証を開始します...');
        try {
            // ローカルで実行して構文エラーや依存関係エラーが出ないかテスト
            // (db push 等は重い可能性があるので、今回は db diff で変更分が適用可能か簡易確認するアプローチもアリだが、
            //  確実なのは "supabase status" 等でローカルDBが動いているか確認し、
            //  "supabase db diff --local"等で致命的エラーを見ること)
            console.log('   Running: npx supabase db diff --local');
            execSync('npx supabase db diff --local', { cwd: PROJECT_ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
            console.log('✅ [Smart DB Gate] Dry-Run 成功。SQL構成は正常です。');
        } catch (err) {
            console.error('\n🚫───────────── [ DATABASE SYNC LOCK ] ─────────────🚫');
            console.error('❌ DBマイグレーションの Dry-Run に失敗しました。');
            console.error('   → 構文エラー、またはVIEW変更時の GRANT 追従漏れの可能性があります。');
            console.error('   → エラー詳細:');
            if (err.stdout && err.stdout.trim()) console.error(err.stdout);
            if (err.stderr && err.stderr.trim()) console.error(err.stderr);
            console.error('   → [根本解決]: SQLエラーを修正し、ローカルでテストを通過させてください。');
            console.error('🚫─────────────────────────────────────────────────────🚫\n');
            process.exit(1);
        }
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
                console.log(`DEBUG: Violation found in ${file} for rule ${rule.id} (${rule.name})`);
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

/**
 * [Phase 5/6] Context-Aware Verification Routing (CAVR) Enforcement
 * 実装の性質（Route A/B/C）がタスク境界または task.md で宣言されているか検証する。
 */
function validateCAVR(changedFiles) {
    console.log('\n🛤️  [CAVR Gate] 検証ルート（Route A/B/C）の宣言を確認中...');

    const session = getSession();
    const isRepairLane = session?.active_task?.is_repair_lane || false;
    if (isRepairLane) {
        console.log('🚀 [CAVR Gate] Repair Lane を検知。ルートチェックをバイパスします。');
        return;
    }

    // ドキュメントのみの変更は自動的に Route C とみなす
    if (isDocOnlyValidation(changedFiles)) {
        console.log('✅ [CAVR Gate] Route C [Fast-Path] を自動適用（ドキュメント更新のみ）。');
        return;
    }

    const routePatterns = [
        { id: 'Route A', regex: /Route\s*A|Preview-Driven/i, desc: 'UI/UX (Preview URL 必須)' },
        { id: 'Route B', regex: /Route\s*B|Local-Logic/i, desc: 'ロジック (自動テスト重視)' },
        { id: 'Route C', regex: /Route\s*C|Fast-Path/i, desc: 'ドキュメント/設定 (検証スキップ)' }
    ];

    let declaredRoute = null;

    // 1. セッション情報の Intent/Summary から検索
    if (session?.active_task) {
        const textToScan = `${session.active_task.name} ${session.active_task.summary}`;
        for (const route of routePatterns) {
            if (route.regex.test(textToScan)) {
                declaredRoute = route;
                break;
            }
        }
    }

    // 2. Fallback: task.md の進行中項目 [/] から検索
    if (!declaredRoute && fs.existsSync(TASK_MD_PATH)) {
        const content = fs.readFileSync(TASK_MD_PATH, 'utf8');
        const lines = content.split('\n');
        const inProgressLine = lines.find(l => l.includes('[/]'));
        if (inProgressLine) {
            for (const route of routePatterns) {
                if (route.regex.test(inProgressLine)) {
                    declaredRoute = route;
                    break;
                }
            }
        }
    }

    // 3. Final Fallback: AMPLOG.jsonl の最新エントリから検索 (物理証跡)
    const AMPLOG_PATH = path.join(PROJECT_ROOT, 'AMPLOG.jsonl');
    if (!declaredRoute && fs.existsSync(AMPLOG_PATH)) {
        const content = fs.readFileSync(AMPLOG_PATH, 'utf8');
        const lines = content.trim().split('\n');
        const lastLines = lines.slice(-5).reverse(); // 直近5件を逆順にチェック
        for (const line of lastLines) {
            for (const route of routePatterns) {
                if (route.regex.test(line)) {
                    declaredRoute = route;
                    break;
                }
            }
            if (declaredRoute) break;
        }
    }

    if (declaredRoute) {
        console.log(`✅ [CAVR Gate] 宣言されたルートを確認: ${declaredRoute.id} (${declaredRoute.desc})`);
        return;
    }

    console.error('\n🚫───────────── [ VERIFICATION ROUTE LOCK ] ─────────────🚫');
    console.error('❌ 検証ルート（Route A/B/C）が宣言されていません。');
    console.error('   → AGENTS.md §F: 変更の性質に応じた検証経路を明示せよ。');
    console.error('   → [解決案]: task_boundary ツールの summary 等に "Route A" (UI修正) ');
    console.error('     または "Route B" (ロジック修正) を追記してください。');
    console.error('   → 理由: 臨機応変な対応を「構造的に強制」するため、AIの意思表示が必要です。');
    console.error('🚫─────────────────────────────────────────────────────🚫\n');
    process.exit(1);
}

async function main() {
    console.log('🛡️  Antigravity Dynamic Governance: Pre-flight Check');
    console.log('==================================================');

    const charsetOk = runCheck('Encoding Sentinel', `node "${path.join(SCRIPTS_DIR, 'guardian_charset.js')}"`);
    if (!charsetOk) process.exit(1);

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

    validateCognitiveCheckpoint(allChangedFiles);
    validateSmartDbSync(allChangedFiles);
    validateCAVR(allChangedFiles);
    validateGovernanceCompliance(allChangedFiles);
    validateAntiSpiral();

    // 1a. Fast-Path Block
    console.log('\n🏎️  [Fast-Path Gate] Mandatory check passed.');

    // 1b. Epistemic Cache logic
    const skipHeavyChecks = isDocOnlyValidation(allChangedFiles);

    if (skipHeavyChecks) {
        console.log('\n✅ [Epistemic Cache] ドキュメント更新のみ。統治・シール確認ゲートを軽量化（バイパス）します。');
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
