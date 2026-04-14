#!/usr/bin/env node
/**
 * Antigravity Pre-flight Gateway (v5.0)
 * 
 * リスク比例型ガバナンス (Risk-Proportional Governance) 対応。
 * ティア別の検証分岐を実施する。
 * Execution of this script is required by AGENTS.md §E.
 */

import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { getSession, captureGovSnapshot } from './session_manager.js';
import { readJsonStrict, findProjectRoot, PROJECT_ROOT } from './lib/gov_loader.js';

// §N Logic Binding: 'COMPLIANCE_LIMITS'
// §N Logic Binding: 'HANDOFF_AUDIT'

// Force UTF-8 for Windows Console
if (process.platform === 'win32') {
    if (process.stdout.isTTY) process.stdout.setEncoding('utf8');
    if (process.stderr.isTTY) process.stderr.setEncoding('utf8');
}

// --- Path Constants ---
// AGENTS.md §P: Dynamic Root Alignment (Rev 4.1 Sync)
// PROJECT_ROOT is now imported from gov_loader.js as a constant.
const SCRIPTS_DIR = path.join(PROJECT_ROOT, '.agent', 'scripts');
const TASK_MD_PATH = path.join(PROJECT_ROOT, 'task.md');
const RULES_PATH = path.join(PROJECT_ROOT, '.agent', 'config', 'governance_rules.json');
const SESSION_PATH = path.join(PROJECT_ROOT, '.agent', 'session', 'active_task.json');
const DENYLIST_PATH = path.join(PROJECT_ROOT, 'governance', 'preventions', 'denylist.json');
const SHADOW_REGISTRY_PATH = path.join(PROJECT_ROOT, 'governance', 'preventions', 'shadow_registry.json');

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
 * [AGENTS.md §H] Shell Environment Integrity Check
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

// ═══════════════════════════════════════════════════
// ティア判定（Risk-Proportional Governance）
// ═══════════════════════════════════════════════════

/**
 * [AGENTS.md §E] セッションからティア情報を取得する。
 * active_task.json の `tier` フィールドを正典として使用。
 * 未設定の場合はレガシー互換で null を返す。
 */
function getActiveTier() {
    const session = getSession();
    return session?.active_task?.tier || null;
}

/**
 * [AGENTS.md §E / 代替案Ω] git diff 静的解析によるティア自動検出
 * v6.5.1: `governance/risk_matrix.json` から動的にルールを読み込む
 */
/**
 * [AGENTS.md §E / 代替案Ω] git diff 静的解析によるティア自動検出
 * v6.7: §N (Zero-Fallback) 準拠
 */
function detectTierFromDiff(changedFiles) {
    if (changedFiles.length === 0) {
        console.log('[TRACE] Logic [TIER_DETECT] No files changed. Defaulting to T1.');
        return 'T1';
    }

    const normalized = changedFiles.map(f => f.replace(/\\/g, '/'));
    const matrixPath = path.join(PROJECT_ROOT, 'governance', 'risk_matrix.json');

    // §N: Zero-Fallback. 読み込み失敗時は Hard Crash される。
    const { rules, default_tier } = readJsonStrict(matrixPath, 'TIER_DEFINITION', 'Restore governance/risk_matrix.json');

    // 高リスク（T3）から順に評価
    const sortedRules = rules.sort((a, b) => (b.tier > a.tier ? 1 : -1));
    for (const rule of sortedRules) {
        const matchingFile = normalized.find(file => {
            if (rule.condition.includes('path.includes')) {
                const pattern = rule.condition.match(/'([^']+)'/)[1];
                return file.includes(pattern);
            }
            if (rule.condition.includes('path.endsWith')) {
                const pattern = rule.condition.match(/'([^']+)'/)[1];
                return file.endsWith(pattern);
            }
            return false;
        });

        if (matchingFile) {
            console.log(`[TRACE] Logic [TIER_MATCH] File [${matchingFile}] triggered Tier [${rule.tier}] via rule [${rule.id || 'anonymous'}]`);
            return rule.tier;
        }
    }

    const tier = default_tier || 'T1';
    console.log(`[TRACE] Logic [TIER_DEFAULT] No high-risk rules matched. Assigned: ${tier}`);
    return tier;
}

/**
 * ティア自動検出と自己申告の整合性を検証し、警告を出す
 */
function validateTierConsistency(declaredTier, changedFiles) {
    const detectedTier = detectTierFromDiff(changedFiles);
    const tierLevel = { 'T1': 1, 'T2': 2, 'T3': 3 };

    if (declaredTier && tierLevel[detectedTier] > tierLevel[declaredTier]) {
        console.warn(`\n⚠️  [ティア検証] 自己申告: ${declaredTier} ↔ 自動検出: ${detectedTier}`);
        console.warn(`   → 変更内容が申告ティアより高リスクの可能性があります。`);
        console.warn(`   → 安全側に倒して ${detectedTier} で進行することを推奨します。`);
        console.warn(`   → (現在は警告のみ。将来的にブロック化を検討)`);
    } else if (declaredTier) {
        console.log(`✅ [ティア検証] 自己申告: ${declaredTier} / 自動検出: ${detectedTier} — 整合性OK`);
    }

    return declaredTier || detectedTier;
}

/**
 * [AGENTS.md §E T2] T2 自律修正ループのリトライカウンター検証
 * 3回を超えた場合は T3 エスカレーションを要求
 */
function validateT2RetryCount() {
    const session = getSession();
    const retryCount = session?.active_task?.t2_retry_count || 0;
    const tier = session?.active_task?.tier;

    if (tier === 'T2' && retryCount > 3) {
        console.error('\n🚫───────────── [ T2 ESCALATION REQUIRED ] ─────────────🚫');
        console.error(`❌ T2 自律修正ループが ${retryCount} 回に到達しました（上限: 3回）。`);
        console.error('   → AGENTS.md §E T2: 3回で収束しない場合は T3 にエスカレーションせよ。');
        console.error('   → [解決]: ティアを T3 に昇格し、人間に【停止報告】を提出してください。');
        console.error('🚫─────────────────────────────────────────────────────🚫\n');
        process.exit(1);
    }

    if (tier === 'T2' && retryCount > 0) {
        console.log(`   🔄 [T2 修正ループ] 現在のリトライ回数: ${retryCount}/3`);
    }
}

// ═══════════════════════════════════════════════════
// 既存の検証関数群（ティア対応版）
// ═══════════════════════════════════════════════════

/**
 * [AGENTS.md §I] Task-Execution Tight Coupling Check
 */
function validateTaskActive(effectiveTier) {
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

    // Fallback: task.md
    if (fs.existsSync(TASK_MD_PATH)) {
        const content = fs.readFileSync(TASK_MD_PATH, 'utf8');
        if (content.includes('[/]')) {
            console.log('✅ [TASK Gate] task.md 上で進行中タスクマーカー [/] を確認しました。');
            return;
        }
    }

    const cached = execSync('git diff --cached --name-only', { encoding: 'utf8' });
    const workspace = execSync('git ls-files --others --modified --exclude-standard', { encoding: 'utf8' });
    const changed = [...new Set([...cached.split('\n'), ...workspace.split('\n')])].filter(f => f.trim());

    if (isDocOnlyValidation(changed)) {
        console.log('✅ [TASK Gate] 非コード資産（ドキュメント等）の変更のみ。タスクチェックをバイパスします。');
        return;
    }

    // T1 は警告のみ（ブロックしない）
    if (effectiveTier === 'T1') {
        console.warn('⚠️  [TASK Gate] T1: タスク宣言がありませんが、低リスクのため警告のみで続行します。');
        return;
    }

    console.error('\n🚫───────────── [ TASK EXECUTION LOCK ] ─────────────🚫');
    console.error('❌ 進行中のタスク（Intent または [/]）が見つかりません。');
    console.error('   → AGENTS.md §E/I: 実装前に必ず Task Boundary または task.md を更新せよ。');
    console.error('   → [FIX_REQUIRED]: task_boundary ツールを実行するか、');
    console.error('     task.md のマーカーを一時的に [/] (進行中) に戻してください。');
    console.error('🚫──────────────────────────────────────────────────🚫\n');
    process.exit(1);
}

/**
 * [Anti-Spiral Gate] 統治ロジック変更時の矛盾チェック（T3 のみ）
 */
function validateAntiSpiral(effectiveTier) {
    if (effectiveTier !== 'T3') return; // T1/T2 はスキップ

    const cached = execSync('git diff --cached --name-only', { encoding: 'utf8' });
    const isGovChange = cached.includes('AGENTS.md') || cached.includes('.agent/scripts/');

    if (isGovChange) {
        console.log('\n🌀 [スパイラル防止ゲート] 統治ロジックの変更を検知（T3）。矛盾スパイラル検証が必要です。');
        console.log('   → 既存ルールとの矛盾、デッドロック、循環依存がないか確認しましたか？');
        console.log('   → [K-6] 分析に基づき、構造的整合性が担保されていることを確約してください。');
        console.log('✅ [スパイラル防止ゲート] 統治整合性の自己宣言を確認。');
    }
}

/**
 * [AGENTS.md §G] Cognitive Checkpoint（T3 のみ）
 */
function validateCognitiveCheckpoint(changedFiles, effectiveTier) {
    if (effectiveTier !== 'T3') return; // T1/T2 はスキップ

    const session = getSession();
    if (session?.active_task?.status === 'Completed') {
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
            console.error('   → T3 タスク完了時は DEBT_AND_FUTURE.md または AMPLOG.jsonl の更新が必須。');
            console.error('🚫─────────────────────────────────────────────────────🚫\n');
            process.exit(1);
        } else {
            console.log('✅ [CCP Gate] 完了宣言に伴う物理的証跡の更新を確認しました。');
        }
    }
}

/**
 * [AGENTS.md §F] Smart DB Sync Validation
 */
function validateSmartDbSync(changedFiles, effectiveTier) {
    if (effectiveTier === 'T1') return; // T1 はスキップ

    const hasMigrationChanges = changedFiles.some(file =>
        file.replace(/\\/g, '/').includes('supabase/migrations/') && file.endsWith('.sql')
    );

    if (hasMigrationChanges) {
        console.log('\n🗄️  [Smart DB Gate] マイグレーションの変更を検知。Dry-Run検証を開始します...');
        try {
            console.log('   Running: npx supabase db diff --local');
            execSync('npx supabase db diff --local', { cwd: PROJECT_ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
            console.log('✅ [Smart DB Gate] Dry-Run 成功。SQL構成は正常です。');
        } catch (err) {
            const errOutput = `${err.stdout || ''} ${err.stderr || ''}`;
            const isDockerUnavailable = /docker|daemon|container/i.test(errOutput);

            if (isDockerUnavailable) {
                // Docker未起動の場合は警告のみで続行（リモートDBへの適用済みを前提）
                console.warn('\n⚠️  [Smart DB Gate] ローカルDocker環境が利用できないため、Dry-Run検証をスキップします。');
                console.warn('   → リモートDBへのマイグレーション適用が完了していることを確認してください。');
            } else {
                console.error('\n🚫───────────── [ DATABASE SYNC LOCK ] ─────────────🚫');
                console.error('❌ DBマイグレーションの Dry-Run に失敗しました。');
                if (err.stdout && err.stdout.trim()) console.error(err.stdout);
                if (err.stderr && err.stderr.trim()) console.error(err.stderr);
                console.error('🚫─────────────────────────────────────────────────────🚫\n');
                process.exit(1);
            }
        }
    }
}

/**
 * [AGENTS.md §E] Governance Linter (GovLint)
 */
function validateGovernanceCompliance(changedFiles, effectiveTier) {
    if (effectiveTier === 'T1') return; // T1 はスキップ
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

/**
 * [GaC v6.1] Recurrence Prevention Scan
 */
function validateRecurrencePrevention(changedFiles, effectiveTier) {
    if (effectiveTier === 'T1' || changedFiles.length === 0) return;
    if (!fs.existsSync(DENYLIST_PATH)) return;

    console.log('\n🛡️  [Recurrence Gate] 再発防止アンチパターンをスキャン中...');

    try {
        const { rules } = JSON.parse(fs.readFileSync(DENYLIST_PATH, 'utf8'));
        let shadowRegistry = { registry: [] };
        if (fs.existsSync(SHADOW_REGISTRY_PATH)) {
            shadowRegistry = JSON.parse(fs.readFileSync(SHADOW_REGISTRY_PATH, 'utf8'));
        }

        let violations = [];
        let shadowWarnings = [];

        for (const file of changedFiles) {
            if (!fs.existsSync(file)) continue;
            const content = fs.readFileSync(file, 'utf8');

            for (const rule of rules) {
                // scope チェック (glob 簡易実装)
                const isTarget = rule.include.some(pattern => {
                    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
                    return regex.test(file.replace(/\\/g, '/')) || regex.test(path.basename(file));
                });

                if (!isTarget) continue;

                // パターンチェック
                const patternRegex = new RegExp(rule.pattern, 'g');
                if (patternRegex.test(content)) {
                    const isShadow = shadowRegistry.registry.some(s => s.ruleId === rule.id);
                    if (isShadow) {
                        shadowWarnings.push({ file, rule });
                    } else {
                        violations.push({ file, rule });
                    }
                }
            }
        }

        if (shadowWarnings.length > 0) {
            console.warn(`\n⚠️  [Recurrence Gate] シャドウ期間中のルール警告 (${shadowWarnings.length}件):`);
            shadowWarnings.forEach(v => {
                console.warn(`   【警告】: ${v.file} - ${v.rule.name} (Shadow Mode)`);
                console.warn(`   【詳細】: ${v.rule.message}`);
            });
        }

        if (violations.length > 0) {
            console.error('\n🚫───────────── [ RECURRENCE BLOCK ] ─────────────🚫');
            console.error(`❌ ${violations.length} 件の再発防止違反が検知されました。`);
            violations.forEach(v => {
                console.error(`\n   【ファイル】: ${v.file}`);
                console.error(`   【ルール】: ${v.rule.name}`);
                console.error(`   【警告】: ${v.rule.message}`);
                console.error(`   【理由】: 本パターンは過去にリトライが多発したアンチパターンとして登録されています。`);
            });
            console.error('\n🚫──────────────────────────────────────────────🚫\n');
            process.exit(1);
        }

        if (violations.length === 0 && shadowWarnings.length === 0) {
            console.log('✅ [Recurrence Gate] 再発防止違反は見つかりませんでした。');
        }

    } catch (e) {
        console.warn(`⚠️  [Recurrence Gate] スキャン実行中にエラーが発生しました: ${e.message}`);
    }
}

/**
 * [AGENTS.md §F] CAVR Enforcement
 */
function validateCAVR(changedFiles, effectiveTier) {
    if (effectiveTier === 'T1') return; // T1 はスキップ

    console.log('\n🛤️  [CAVR Gate] 検証ルート（Route A/B/C）の宣言を確認中...');

    const session = getSession();
    const isRepairLane = session?.active_task?.is_repair_lane || false;
    if (isRepairLane) {
        console.log('🚀 [CAVR Gate] Repair Lane を検知。ルートチェックをバイパスします。');
        return;
    }

    if (isDocOnlyValidation(changedFiles)) {
        console.log('✅ [CAVR Gate] Route C [Fast-Path] を自動適用（ドキュメント更新のみ）。');
        return;
    }

    const routePatterns = [
        { id: 'Route A', regex: /Route\s*A|Preview-Driven/i, desc: 'UI/UX (Preview URL 必須)' },
        { id: 'Route B', regex: /Route\s*B|Local-Logic/i, desc: 'ロジック (自動テスト重視)' },
        { id: 'Route C', regex: /Route\s*C|Fast-Path/i, desc: 'ドキュメント/設定 (検証スキップ)' },
        { id: 'Route D', regex: /Route\s*D|Disposable-Test/i, desc: '使い捨てテスト (SADA代替)' }
    ];

    let declaredRoute = null;

    // 1. セッション情報
    if (session?.active_task) {
        const textToScan = `${session.active_task.name} ${session.active_task.summary}`;
        for (const route of routePatterns) {
            if (route.regex.test(textToScan)) {
                declaredRoute = route;
                break;
            }
        }
    }

    // 2. task.md
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

    // 3. AMPLOG.jsonl
    const AMPLOG_PATH = path.join(PROJECT_ROOT, 'AMPLOG.jsonl');
    if (!declaredRoute && fs.existsSync(AMPLOG_PATH)) {
        const content = fs.readFileSync(AMPLOG_PATH, 'utf8');
        const lines = content.trim().split('\n');
        const lastLines = lines.slice(-5).reverse();
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
    console.error('🚫─────────────────────────────────────────────────────🚫\n');
    process.exit(1);
}

// ═══════════════════════════════════════════════════
// メイン実行
// ═══════════════════════════════════════════════════

/**
 * [CAP v2.2] Execution Handoff Validation
 */
function validateHandoff(effectiveTier) {
    if (effectiveTier !== 'T3') return;

    console.log('\n🤝 [Handoff Gate] 執行前のハンドオフ（design_ref）を検証中...');

    const session = getSession();
    const AMPLOG_PATH = path.join(PROJECT_ROOT, 'AMPLOG.jsonl');

    // 1. Session check
    if (session?.active_task?.design_ref) {
        console.log(`✅ [Handoff Gate] セッション上で承認済み設計を確認: ${session.active_task.design_ref}`);
        return;
    }

    // 2. AMPLOG check (v2.2 standard: last 10 entries)
    if (fs.existsSync(AMPLOG_PATH)) {
        try {
            console.log(`[TRACE] Logic [HANDOFF_AUDIT] Checking data from ${path.basename(AMPLOG_PATH)}`);
            const content = fs.readFileSync(AMPLOG_PATH, 'utf8');
            const lines = content.trim().split('\n').filter(l => l.trim()).reverse().slice(0, 10);

            for (const line of lines) {
                const entry = JSON.parse(line);
                // "design_ref" または "SDR-ID" または説明文中の特定の記録を探す
                const ref = entry.design_ref || entry.detail?.design_ref ||
                    (entry.summary && entry.summary.match(/design_ref:\s*([^\s,]+)/)?.[1]);

                if (ref) {
                    console.log(`✅ [Handoff Gate] AMPLOG より承認済み設計を確認: ${ref}`);
                    return;
                }
            }
        } catch (e) {
            console.warn(`⚠️  [Handoff Gate] AMPLOG 解析中にエラーが発生しました: ${e.message}`);
        }
    }

    console.error('\n🚫───────────── [ HANDOFF REQUIRED ] ─────────────🚫');
    console.error('❌ 執行フェーズ（Executor）に必要な設計指示（design_ref）が見つかりません。');
    console.error('   → CAP v2.2: Executor は承認済みの設計指示がない限り、動作を拒絶しなければなりません。');
    console.error('   → [解決案]: Analyzer プロセスで設計を完了し、AMPLOG に `design_ref` を記録してください。');
    console.error('🚫──────────────────────────────────────────────🚫\n');
    process.exit(1);
}

/**
 * [GaC v6.5.1] Inventory Sentinel (Self-Audit Engine)
 */
function validateInventory() {
    console.log('\n👁️  [Sentinel] ガバナンス・インベントリの整合性を監査中...');
    const inventoryPath = path.join(PROJECT_ROOT, 'governance', 'inventory.json');

    // §N: Zero-Fallback
    const { registry } = readJsonStrict(inventoryPath, 'INVENTORY_REGISTRY', 'Recover governance/inventory.json');
    const physicalScripts = fs.readdirSync(SCRIPTS_DIR).filter(f => f.endsWith('.js') || f.endsWith('.cjs'));

    // 1. Missing File Check
    for (const item of registry) {
        const fullPath = path.join(PROJECT_ROOT, item.path);
        if (!fs.existsSync(fullPath)) {
            console.error(`\n❌ [Sentinel] 定義済み資産の欠落: ${item.path}`);
            console.error(`   → [FIX_REQUIRED]: 資産 ID [${item.id}] を復元するか、インベントリを更新してください。`);
            process.exit(1);
        }
        if (!item.link_to_agents_md) {
            console.error(`\n❌ [Sentinel] 憲法追跡性の欠落: ${item.path}`);
            console.error(`   → [FIX_REQUIRED]: 資産 ID [${item.id}] に憲法条項 (§) を紐付けてください。`);
            process.exit(1);
        }
    }

    // 2. Unknown File Check (Ghost Logic Detection)
    const inventoryPaths = new Set(registry.map(item => path.normalize(item.path)));
    for (const script of physicalScripts) {
        const relPath = path.join('.agent', 'scripts', script);
        if (!inventoryPaths.has(path.normalize(relPath))) {
            console.warn(`\n⚠️  [Sentinel] 未登録の不純物を検知: ${relPath}`);
            console.warn('   → [FIX_REQUIRED]: 不要なスクリプトを削除するか、インベントリに正当性を登録してください。');
            // T3 の場合はハードブロック
            if (getActiveTier() === 'T3') {
                console.error('🚫 [Sentinel Block] T3 ティアにおいて正体不明の不純物混入は許されません。');
                process.exit(1);
            }
        }
    }
    console.log('✅ [Sentinel] インベントリ整合性 OK。物理資産は正典と一致しています。');
}

async function main() {
    console.log('🛡️  Antigravity Dynamic Governance: Pre-flight Check (v6.7 Ghost-Logic-Containment)');
    console.log('============================================================');

    // 0. Sentinel 自律監査 [v6.5.1 Activation]
    validateInventory();

    const charsetOk = runCheck('Encoding Sentinel', `node "${path.join(SCRIPTS_DIR, 'guardian_charset.js')}"`);
    if (!charsetOk) process.exit(1);

    checkEnvironment();

    // 0. 変更コンテキスト解析
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

    // 1. ティア判定
    const declaredTier = getActiveTier();
    const effectiveTier = validateTierConsistency(declaredTier, allChangedFiles);
    console.log(`\n🎯 [ティア] 適用ティア: ${effectiveTier}`);

    // [Sentinel 5.0] 憲法スナップショットの固定 (B-3 / §P)
    captureGovSnapshot();

    // 1.2 ハンドオフ検証 [v6.4 CAP-Sync]
    validateHandoff(effectiveTier);

    // 1.3 負債検証 [v6.5.1 Activation]
    // validateDebt(effectiveTier);

    // 1.5 零容認ゲート (Zero-Tolerance Gate) [v5.5]
    if (effectiveTier === 'T3') {
        console.log('\n🛡️  [Zero-Tolerance Gate] 潔白状態を検証中...');
        const untrackedFiles = execSync('git status --porcelain', { encoding: 'utf8' })
            .split('\n')
            .filter(line => line.startsWith('??'))
            .map(line => line.slice(3).trim());

        if (untrackedFiles.length > 0) {
            console.error('\n🚫───────────── [ REPOSITORY IMPURITY DETECTED ] ─────────────🚫');
            console.error(`❌ 未追跡ファイル（Untracked Files）が ${untrackedFiles.length} 件検出されました。`);
            untrackedFiles.slice(0, 5).forEach(f => console.error(`   - ${f}`));
            if (untrackedFiles.length > 5) console.error(`   ...他 ${untrackedFiles.length - 5} 件`);
            console.error('\n   → AGENTS.md §K-6 (v5.5): 100点統治において不純物の混入は許されません。');
            console.error('   → [解決案]: `node .agent/scripts/reflect.js --purge` を実行して自浄してください。');
            console.error('   → 手動で作成したファイルの場合は、gitignore に追加するか削除してください。');
            console.error('🚫──────────────────────────────────────────────────────────🚫\n');
            process.exit(1);
        }
        console.log('✅ [Zero-Tolerance Gate] 潔白（Clean State）が証明されました。');
    }

    // 2. T2 リトライカウンター検証
    validateT2RetryCount();

    // 3. ティア別ゲート検証
    validateTaskActive(effectiveTier);
    validateCognitiveCheckpoint(allChangedFiles, effectiveTier);
    validateRecurrencePrevention(allChangedFiles, effectiveTier);
    validateSmartDbSync(allChangedFiles, effectiveTier);
    validateCAVR(allChangedFiles, effectiveTier);
    validateGovernanceCompliance(allChangedFiles, effectiveTier);
    validateAntiSpiral(effectiveTier);

    // 4. Epistemic Cache（ティア統合版）
    const skipHeavyChecks = effectiveTier === 'T1' || isDocOnlyValidation(allChangedFiles);

    if (skipHeavyChecks) {
        console.log('\n✅ [Epistemic Cache] T1 またはドキュメント更新のみ。重量ゲートをバイパスします。');
    } else {
        const epistemicOk = runCheck('Epistemic Gate', `node "${path.join(SCRIPTS_DIR, 'epistemic_gate.js')}"`);
        if (!epistemicOk) process.exit(1);

        // T2: check_seal はバイパス（テスト通過が承認代替）
        // T3: check_seal を実行（承認印検証必須）
        if (effectiveTier === 'T3') {
            const sealOk = runCheck('Seal Check (T3)', `node "${path.join(SCRIPTS_DIR, 'check_seal.js')}"`);
            if (!sealOk) process.exit(1);
        } else {
            console.log('\n✅ [Seal Gate] T2: テスト通過が承認代替のため、AMPLOG承認印チェックをバイパス。');
        }
    }

    const reflectOk = runCheck('Compliance Audit', `node "${path.join(SCRIPTS_DIR, 'reflect.js')}"`);
    if (!reflectOk) process.exit(1);

    // 5. [CAP v3.0] Thought Audit (T3 Only Reinforced)
    if (effectiveTier === 'T3') {
        process.stdout.write('🔍 [Pre-flight] Validating Cognitive Governance (§P)... ');
        const thoughtOk = runCheck('Thought Audit (Sentinel 3.0)', `node "${path.join(SCRIPTS_DIR, 'thought_gate.js')}" --audit-session`);

        if (!thoughtOk) {
            console.error('\n❌ [CRITICAL] 統治監査に失敗しました。指示に対して [CAP_TRACE] による思考が記録されていないか、古い内容です。');
            process.exit(1);
        }
        console.log('PASS.');
    }

    console.log(`\n✨ [Pre-flight] ALL SYSTEMS NOMINAL (${effectiveTier}). Implementation authorized.`);
    process.exit(0);
}

main();
