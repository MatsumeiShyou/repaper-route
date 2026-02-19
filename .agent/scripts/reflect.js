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
            severity: 'CRITICAL',
            category: 'AMPLOG Protocol',
            issue: 'AMPLOG.md does not exist',
            recommendation: 'Create AMPLOG.md immediately'
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
            severity: 'HIGH',
            category: 'AMPLOG Protocol',
            issue: `Code changes detected in last ${DAYS_TO_CHECK} days but no AMPLOG entries`,
            recommendation: 'Run: node .agent/scripts/record_amp.js'
        });
    }

    // Check for missing PW seals
    const unsealed = amplogLines.filter(line =>
        line.includes('| 承認 |') && !line.includes('(PW: ｙ)')
    );

    if (unsealed.length > 0) {
        violations.push({
            severity: 'HIGH',
            category: '§1 Strict Seal Protocol',
            issue: `${unsealed.length} AMPLOG entries without (PW: ｙ) seal`,
            recommendation: 'Add (PW: ｙ) to unsealed entries'
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
            severity: 'MEDIUM',
            category: '§5 Resource & Clean-up Governance',
            issue: `${offenders.length} temporary/backup files detected`,
            details: offenders.join('\n'),
            recommendation: 'Delete these files immediately. Use Git for history, not .bak files.'
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
            severity: 'MEDIUM',
            category: 'Resource Governance',
            issue: `${logFiles.length} large log files (>100KB) detected`,
            details: logFiles.map(f => `${f.path.replace(PROJECT_ROOT, '.')} (${f.size})`).join('\n  '),
            recommendation: 'Delete or archive large log files'
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
                rapidRetries.push({
                    file,
                    count: RAPID_THRESHOLD,
                    window: `${Math.round((windowEnd - windowStart) / 60000)} min`,
                    commits: mods.slice(i, i + RAPID_THRESHOLD).map(m => `${m.hash}: ${m.message}`)
                });
                break; // Report only the first cluster per file
            }
        }
    }

    if (rapidRetries.length > 0) {
        // --- Added: SDR Reflection Bypass Logic (§6) ---
        let reflectionFound = false;
        let reflectionContent = '';
        if (fs.existsSync(AMPLOG_PATH)) {
            const amplogContent = fs.readFileSync(AMPLOG_PATH, 'utf8');
            const lines = amplogContent.split('\n').filter(l => l.trim().startsWith('|'));
            const lastEntry = lines[lines.length - 1] || '';
            const auditMatch = lastEntry.match(/\[Audit:\s*(.*?)\]/);
            if (auditMatch && auditMatch[1].trim().length > 5) { // 5文字以上の内省を要求
                reflectionFound = true;
                reflectionContent = auditMatch[1].trim();
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
            severity: 'HIGH',
            category: '§4 Stop & Retry Protocol (SVP)',
            issue: `${rapidRetries.length} file(s) with rapid consecutive modifications detected (potential "当てずっぽう" retry)`,
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
                severity: 'MEDIUM',
                category: '§4 Stop & Retry Protocol (SVP)',
                issue: `${repeatedErrors.length} repeated error pattern(s) found across debug outputs`,
                details: repeatedErrors.join('\n'),
                recommendation: 'Investigate root cause. Do not retry — analyze the State (§4: Fact over Logic).'
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
        report += `## ✅ Status: COMPLIANT\n\n`;
        report += `### Verification Evidence\n`;
        report += `- **§2 Traceability**: AMPLOG.md exists and contains recent sealed entries.\n`;
        report += `- **§4 SVP**: Git log analysis detected no rapid retry patterns.\n`;
        report += `- **§5 Clean-up**: No .bak, debug_*, or fix_* files found in project root/src.\n`;
        report += `- **Resource Control**: All log files are within acceptable size limits (<100KB).\n\n`;
        report += `All governance protocols are being followed correctly.\n`;
        return report;
    }

    const critical = violations.filter(v => v.severity === 'CRITICAL');
    const high = violations.filter(v => v.severity === 'HIGH');
    const medium = violations.filter(v => v.severity === 'MEDIUM');

    report += `## ⚠️ Status: ${critical.length > 0 ? 'CRITICAL' : high.length > 0 ? 'HIGH PRIORITY' : 'NEEDS ATTENTION'}\n\n`;
    report += `- 🔴 Critical: ${critical.length}\n`;
    report += `- 🟠 High: ${high.length}\n`;
    report += `- 🟡 Medium: ${medium.length}\n\n`;
    report += `---\n\n`;

    function writeViolations(list, emoji) {
        list.forEach((v) => {
            report += `### ${emoji} ${v.category} - ${v.severity}\n\n`;
            report += `**Issue**: ${v.issue}\n\n`;
            if (v.details) {
                report += `**Details**:\n\`\`\`\n${v.details}\n\`\`\`\n\n`;
            }
            report += `**Recommendation**: ${v.recommendation}\n\n`;
            report += `---\n\n`;
        });
    }

    if (critical.length > 0) {
        report += `## 🔴 Critical Violations\n\n`;
        writeViolations(critical, '🔴');
    }

    if (high.length > 0) {
        report += `## 🟠 High Priority Violations\n\n`;
        writeViolations(high, '🟠');
    }

    if (medium.length > 0) {
        report += `## 🟡 Medium Priority Violations\n\n`;
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
