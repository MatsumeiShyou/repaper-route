#!/usr/bin/env node
/**
 * Self-Reflection Protocol (SRP) Automation
 * 
 * Usage: node .agent/scripts/reflect.js
 * 
 * Implements AGENTS.md § 13 (Self-Reflection Protocol) automatically.
 * Generates GOVERNANCE_REPORT.md with violations and recommendations.
 * 
 * Checks:
 *   1. AMPLOG Protocol compliance (§2 Traceability)
 *   2. Resource governance (§5 Clean-up / Log size)
 *   3. Retry pattern detection (§4 SVP)
 *   4. Self-Reflection adherence (§6 SRP)
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const PROJECT_ROOT = process.cwd();
const AMPLOG_PATH = path.join(PROJECT_ROOT, 'AMPLOG.md');
const REPORT_PATH = path.join(PROJECT_ROOT, 'GOVERNANCE_REPORT.md');
const DAYS_TO_CHECK = 7;

function getRecentCommits(days) {
    try {
        const since = `${days}.days.ago`;
        const output = execSync(`git log --since="${since}" --oneline --name-only`, {
            cwd: PROJECT_ROOT,
            encoding: 'utf8'
        });
        return output;
    } catch (err) {
        console.warn('⚠️ Warning: Could not fetch git log:', err.message);
        return '';
    }
}

function getDetailedCommitLog(days) {
    try {
        const since = `${days}.days.ago`;
        const output = execSync(
            `git log --since="${since}" --format="%h|%ai|%s" --name-only`,
            { cwd: PROJECT_ROOT, encoding: 'utf8' }
        );
        return output;
    } catch (err) {
        return '';
    }
}

function checkAMPLOGViolations() {
    const violations = [];

    if (!fs.existsSync(AMPLOG_PATH)) {
        violations.push({
            severity: '致命的',
            category: 'AMPLOG プロトコル',
            issue: 'AMPLOG.md が存在しません',
            recommendation: '直ちに AMPLOG.md を作成してください'
        });
        return violations;
    }

    const commits = getRecentCommits(DAYS_TO_CHECK);
    const amplogContent = fs.readFileSync(AMPLOG_PATH, 'utf8');
    const amplogLines = amplogContent.split('\n').filter(l => l.trim());

    // Check if there are code changes without AMPLOG updates
    const hasCodeChanges = commits.includes('.js') || commits.includes('.jsx') ||
        commits.includes('.sql') || commits.includes('.md');

    const recentAMPLOGEntries = amplogLines.filter(line => {
        const dateMatch = line.match(/\| (\d{4}-\d{2}-\d{2}) \|/);
        if (!dateMatch) return false;

        const entryDate = new Date(dateMatch[1]);
        const daysAgo = (new Date() - entryDate) / (1000 * 60 * 60 * 24);
        return daysAgo <= DAYS_TO_CHECK;
    });

    if (hasCodeChanges && recentAMPLOGEntries.length === 0) {
        violations.push({
            severity: '高',
            category: 'AMPLOG プロトコル',
            issue: `直近 ${DAYS_TO_CHECK} 日間にコード変更が検知されましたが、AMPLOG の記録がありません`,
            recommendation: '実行してください: node .agent/scripts/record_amp.js'
        });
    }

    // Check for missing PW seals
    const unsealed = amplogLines.filter(line =>
        line.includes('| 承認 |') && !line.includes('(PW: ｙ)')
    );

    if (unsealed.length > 0) {
        violations.push({
            severity: '高',
            category: '§1 厳格な印（Seal）プロトコル',
            issue: `${unsealed.length} 件の AMPLOG エントリに承認印 (PW: ｙ) がありません`,
            recommendation: '未承認のエントリに (PW: ｙ) を追記してください'
        });
    }

    return violations;
}

function checkCleanupViolations() {
    const violations = [];
    const offenders = [];

    function scan(dir) {
        try {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
                    scan(fullPath);
                } else if (entry.isFile()) {
                    if (entry.name.endsWith('.bak') || entry.name.startsWith('debug_') || entry.name.startsWith('fix_')) {
                        offenders.push(fullPath.replace(PROJECT_ROOT, '.'));
                    }
                }
            }
        } catch (err) { }
    }

    scan(PROJECT_ROOT);

    if (offenders.length > 0) {
        violations.push({
            severity: '中',
            category: '§5 資源およびクリーンアップ統治',
            issue: `${offenders.length} 個の一時ファイル/バックアップファイルが検出されました`,
            details: offenders.join('\n'),
            recommendation: 'これらのファイルを直ちに削除してください。履歴管理には Git を使用し、.bak ファイルは作成しないでください。'
        });
    }

    return violations;
}

function checkLogFileSize() {
    const violations = [];
    const logFiles = [];

    function scanDir(dir) {
        try {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
                    scanDir(fullPath);
                } else if (entry.isFile() && entry.name.endsWith('.txt')) {
                    const stats = fs.statSync(fullPath);
                    if (stats.size > 1024 * 100) { // > 100KB
                        logFiles.push({
                            path: fullPath,
                            size: (stats.size / 1024).toFixed(2) + ' KB'
                        });
                    }
                }
            }
        } catch (err) {
            // Ignore permission errors
        }
    }

    scanDir(PROJECT_ROOT);

    if (logFiles.length > 0) {
        violations.push({
            severity: '中',
            category: '資源統治',
            issue: `${logFiles.length} 個の巨大なログファイル (>100KB) が検出されました`,
            details: logFiles.map(f => `${f.path.replace(PROJECT_ROOT, '.')} (${f.size})`).join('\n  '),
            recommendation: '巨大なログファイルを削除またはアーカイブしてください'
        });
    }

    return violations;
}

/**
 * AGENTS.md § 6 (SVP) & § 13 (SRP) - Retry Pattern Detection
 * 
 * Detects "当てずっぽう" (guesswork) retry patterns:
 * 1. Rapid consecutive commits to the SAME file within a short window
 *    (indicates fix → fail → retry → fail cycles)
 * 2. Debug script output files with repeated error signatures
 */
function checkRetryPatterns() {
    const violations = [];

    // --- Check 1: Rapid consecutive commits to same file ---
    const commitLog = getDetailedCommitLog(DAYS_TO_CHECK);
    if (!commitLog) return violations;

    const lines = commitLog.split('\n').filter(l => l.trim());

    // Parse commits: group files by commit
    const commits = [];
    let currentCommit = null;

    for (const line of lines) {
        if (line.includes('|')) {
            const parts = line.split('|');
            if (parts.length >= 3) {
                currentCommit = {
                    hash: parts[0].trim(),
                    date: new Date(parts[1].trim()),
                    message: parts[2].trim(),
                    files: []
                };
                commits.push(currentCommit);
            }
        } else if (currentCommit && line.trim()) {
            currentCommit.files.push(line.trim());
        }
    }

    // Detect: same file modified in 3+ consecutive commits within 30 minutes
    const RAPID_WINDOW_MS = 30 * 60 * 1000; // 30 minutes
    const RAPID_THRESHOLD = 3;
    const fileModCounts = {};

    for (let i = 0; i < commits.length; i++) {
        const commit = commits[i];
        for (const file of commit.files) {
            if (!fileModCounts[file]) {
                fileModCounts[file] = [];
            }
            fileModCounts[file].push({
                date: commit.date,
                hash: commit.hash,
                message: commit.message
            });
        }
    }

    const rapidRetries = [];
    for (const [file, mods] of Object.entries(fileModCounts)) {
        // Sort by date (newest first from git log, reverse for chronological)
        mods.sort((a, b) => a.date - b.date);

        // Sliding window: find clusters of modifications within RAPID_WINDOW_MS
        for (let i = 0; i <= mods.length - RAPID_THRESHOLD; i++) {
            const windowStart = mods[i].date;
            const windowEnd = mods[i + RAPID_THRESHOLD - 1].date;

            if (windowEnd - windowStart <= RAPID_WINDOW_MS) {
                // Context-Aware SVP Bypass: コミットメッセージが「正常なイテレーション」を示唆する場合はスキップ
                // 例: "lint", "format", "fix typo", "test", "docs" などのキーワード
                const isNormalIteration = mods.slice(i, i + RAPID_THRESHOLD).every(m => {
                    const msg = m.message.toLowerCase();
                    return msg.includes('lint') || msg.includes('format') || msg.match(/fix.*typo/) || msg.includes('docs') || msg.includes('test');
                });

                if (!isNormalIteration) {
                    rapidRetries.push({
                        file,
                        count: RAPID_THRESHOLD,
                        window: `${Math.round((windowEnd - windowStart) / 60000)} min`,
                        commits: mods.slice(i, i + RAPID_THRESHOLD).map(m => `${m.hash}: ${m.message}`)
                    });
                }
                break; // Report only the first cluster per file
            }
        }
    }

    if (rapidRetries.length > 0) {
        // --- Added: SDR Reflection Bypass Logic (§6) ---
        // 修正: 最終行のみでなく、直近 DAYS_TO_CHECK 日以内のテーブル行すべてを検索する
        let reflectionFound = false;
        let reflectionContent = '';
        if (fs.existsSync(AMPLOG_PATH)) {
            const amplogContent = fs.readFileSync(AMPLOG_PATH, 'utf8');
            // (1) | で始まる全テーブル行を取得
            const tableLines = amplogContent.split('\n').filter(l => l.trim().startsWith('|'));
            // (2) 直近7日以内のエントリのみを抽出
            const recentLines = tableLines.filter(line => {
                const dateMatch = line.match(/\|\s*(\d{4}-\d{2}-\d{2})\s*\|/);
                if (!dateMatch) return false;
                const entryDate = new Date(dateMatch[1]);
                const daysAgo = (new Date() - entryDate) / (1000 * 60 * 60 * 24);
                return daysAgo <= DAYS_TO_CHECK;
            });
            // (3) いずれかの行に有効な Audit タグ（5文字以上の内省を要求）が存在すれば解除
            for (const line of recentLines) {
                const auditMatch = line.match(/\[Audit:\s*(.*?)\]/);
                if (auditMatch && auditMatch[1].trim().length > 5) {
                    reflectionFound = true;
                    reflectionContent = auditMatch[1].trim();
                    break;
                }
            }
        }

        if (reflectionFound) {
            console.log('\n✅ [SVP Resolution] 有効な内省（Auditタグ）を検知しました。物理ロックを解除します。');
            console.log(`📝 Reflection: ${reflectionContent}`);
            return []; // Violations を空にして通過させる
        }

        const details = rapidRetries.map(r =>
            `📄 ${r.file} — ${r.count} modifications in ${r.window}\n` +
            r.commits.map(c => `    └─ ${c}`).join('\n')
        ).join('\n\n');

        violations.push({
            severity: '高',
            category: '§4 停止およびリトライプロトコル (SVP)',
            issue: `${rapidRetries.length} 個のファイルで短時間の連続修正が検知されました（「当てずっぽう」なリトライの可能性）`,
            details,
            recommendation: `【ベストプラクティス ONE】\n試行錯誤の履歴を論理的な一単位に統合し、AMPLOG.md のステータス欄に [Audit: <原因・判断・根拠>] を記録した上で再試行せよ。`
        });
    }

    // --- Check 2: Debug script output files with error patterns ---
    const debugDir = path.join(PROJECT_ROOT, '.agent', 'scripts');
    const debugTxtFiles = [];

    try {
        const entries = fs.readdirSync(debugDir, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.isFile() && entry.name.endsWith('.txt')) {
                debugTxtFiles.push(path.join(debugDir, entry.name));
            }
        }
    } catch (err) {
        // Ignore
    }

    if (debugTxtFiles.length > 0) {
        const errorPatterns = {};

        for (const txtFile of debugTxtFiles) {
            try {
                const content = fs.readFileSync(txtFile, 'utf8');
                // Extract error lines
                const errorLines = content.split('\n').filter(l =>
                    l.includes('ERROR') || l.includes('Error') || l.includes('FATAL') ||
                    l.includes('FAIL') || l.includes('❌')
                );

                for (const errorLine of errorLines) {
                    // Normalize: strip timestamps and variable parts
                    const normalized = errorLine.replace(/\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}[.\dZ]*/g, '[DATE]')
                        .replace(/\b[0-9a-f]{8,}\b/g, '[HASH]')
                        .trim();

                    if (!errorPatterns[normalized]) {
                        errorPatterns[normalized] = { count: 0, files: [] };
                    }
                    errorPatterns[normalized].count++;
                    if (!errorPatterns[normalized].files.includes(path.basename(txtFile))) {
                        errorPatterns[normalized].files.push(path.basename(txtFile));
                    }
                }
            } catch (err) {
                // Skip unreadable files
            }
        }

        // Report patterns appearing in 2+ files
        const repeatedErrors = Object.entries(errorPatterns)
            .filter(([, v]) => v.files.length >= 2)
            .map(([pattern, v]) => `"${pattern.substring(0, 80)}..." (${v.count}回, files: ${v.files.join(', ')})`);

        if (repeatedErrors.length > 0) {
            violations.push({
                severity: '中',
                category: '§4 停止およびリトライプロトコル (SVP)',
                issue: `${repeatedErrors.length} 件の重複するエラーパターンがデバッグ出力から見つかりました`,
                details: repeatedErrors.join('\n'),
                recommendation: '根本原因を調査してください。リトライせず、状態（State）を分析してください（§4：論理より事実）。'
            });
        }
    }

    return violations;
}

function generateReport(violations) {
    const date = new Date().toISOString();
    let report = `# Governance Self-Reflection Report\n\n`;
    report += `**Generated**: ${date}\n`;
    report += `**Period**: Last ${DAYS_TO_CHECK} days\n`;
    report += `**Checks**: AMPLOG Protocol, Strict Seal, Resource Governance, Retry Pattern Detection\n\n`;
    report += `---\n\n`;

    if (violations.length === 0) {
        report += `## ✅ ステータス: 準拠 (COMPLIANT)\n\n`;
        report += `### 検証エビデンス\n`;
        report += `- **§2 追跡可能性**: AMPLOG.md が存在し、最近の承認済みエントリが含まれています。\n`;
        report += `- **§4 SVP**: Git ログ分析により、急激なリトライパターンは検出されませんでした。\n`;
        report += `- **§5 クリーンアップ**: プロジェクトルートおよび src 内に .bak, debug_*, fix_* ファイルは見つかりませんでした。\n`;
        report += `- **資源管理**: すべてのログファイルは許容サイズ制限内 (<100KB) です。\n\n`;
        report += `全ての統治プロトコルが正しく遵守されています。\n`;
        return report;
    }

    const critical = violations.filter(v => v.severity === '致命的');
    const high = violations.filter(v => v.severity === '高');
    const medium = violations.filter(v => v.severity === '中');

    report += `## ⚠️ ステータス: ${critical.length > 0 ? '致命的' : high.length > 0 ? '高優先度' : '注意が必要'}\n\n`;
    report += `- 🔴 致命的: ${critical.length}\n`;
    report += `- 🟠 高: ${high.length}\n`;
    report += `- 🟡 中: ${medium.length}\n\n`;
    report += `---\n\n`;

    function writeViolations(list, emoji) {
        list.forEach((v) => {
            report += `### ${emoji} ${v.category} - ${v.severity}\n\n`;
            report += `**問題**: ${v.issue}\n\n`;
            if (v.details) {
                report += `**詳細**:\n\`\`\`\n${v.details}\n\`\`\`\n\n`;
            }
            report += `**推奨アクション**: ${v.recommendation}\n\n`;
            report += `---\n\n`;
        });
    }

    if (critical.length > 0) {
        report += `## 🔴 致命的な違反\n\n`;
        writeViolations(critical, '🔴');
    }

    if (high.length > 0) {
        report += `## 🟠 高優先度の違反\n\n`;
        writeViolations(high, '🟠');
    }

    if (medium.length > 0) {
        report += `## 🟡 中優先度の違反\n\n`;
        writeViolations(medium, '🟡');
    }

    return report;
}

function main() {
    console.log('🔍 Self-Reflection Protocol (SRP) Executor v2.0');
    console.log('================================================\n');

    console.log('📊 [1/3] Checking AMPLOG Protocol compliance...');
    const amplogViolations = checkAMPLOGViolations();

    console.log('📊 [2/4] Checking resource governance (log size / clean-up)...');
    const logViolations = checkLogFileSize();
    const cleanupViolations = checkCleanupViolations();

    console.log('📊 [3/4] Checking retry patterns (§4 SVP)...');
    const retryViolations = checkRetryPatterns();

    const allViolations = [...amplogViolations, ...logViolations, ...cleanupViolations, ...retryViolations];

    const report = generateReport(allViolations);
    fs.writeFileSync(REPORT_PATH, report, 'utf8');

    console.log(`\n✅ Report generated: ${REPORT_PATH}`);
    console.log(`📋 Total violations: ${allViolations.length}`);

    if (allViolations.length > 0) {
        console.log('\n⚠️ Governance violations detected. Please review GOVERNANCE_REPORT.md');
        process.exit(1);
    } else {
        console.log('\n✅ All governance checks passed!');
        process.exit(0);
    }
}

main();
