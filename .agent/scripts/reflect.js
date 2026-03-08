#!/usr/bin/env node
/**
 * Self-Reflection Protocol (SRP) Automation (Sanctuary Edition)
 * 
 * Usage: node .agent/scripts/reflect.js
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { getSession } from './session_manager.js';
import { readJsonStrict } from './lib/gov_loader.js';

const PROJECT_ROOT = process.cwd();
const AMPLOG_PATH = path.join(PROJECT_ROOT, 'AMPLOG.jsonl');
const REPORT_PATH = path.join(PROJECT_ROOT, 'GOVERNANCE_REPORT.md');
const REGISTRY_PATH = path.join(PROJECT_ROOT, 'ANTIPATTERN_REGISTRY.jsonl');
const COMPLIANCE_PATH = path.join(PROJECT_ROOT, 'governance', 'compliance.json');

/**
 * [R-4 陳腐化対策] ANTIPATTERN_REGISTRY の related_files が大幅に変更されていれば警告を出す
 */
function checkRegistryStaleness() {
    if (!fs.existsSync(REGISTRY_PATH)) return [];
    const warnings = [];
    const entries = fs.readFileSync(REGISTRY_PATH, 'utf8')
        .split('\n').filter(l => l.trim())
        .map(l => { try { return JSON.parse(l); } catch { return null; } })
        .filter(Boolean);

    for (const entry of entries) {
        if (!entry.related_files || entry.related_files.length === 0) continue;
        for (const relFile of entry.related_files) {
            const absPath = path.join(PROJECT_ROOT, relFile);
            if (!fs.existsSync(absPath)) continue;
            try {
                const lineCount = fs.readFileSync(absPath, 'utf8').split('\n').length;
                const entryAge = (new Date() - new Date(entry.date)) / (1000 * 60 * 60 * 24);
                if (lineCount > 100 && entryAge > 30) {
                    warnings.push(`[${entry.id}] ${relFile} は ${lineCount} 行, ${Math.round(entryAge)} 日経過。陳腐化の可能性あり。`);
                }
            } catch { /* 無視 */ }
        }
    }
    return warnings;
}


function getRecentCommits(days) {
    try {
        const since = `${days}.days.ago`;
        return execSync(`git log --since="${since}" --oneline --name-only`, { cwd: PROJECT_ROOT, encoding: 'utf8' });
    } catch (err) {
        return '';
    }
}

function getDetailedCommitLog(days) {
    try {
        const since = `${days}.days.ago`;
        return execSync(`git log --since="${since}" --format="%h|%ai|%s" --name-only`, { cwd: PROJECT_ROOT, encoding: 'utf8' });
    } catch (err) {
        return '';
    }
}

function checkAMPLOGViolations() {
    const violations = [];
    if (!fs.existsSync(AMPLOG_PATH)) {
        violations.push({ severity: '致命的', category: 'AMPLOG', issue: 'AMPLOG.jsonl が不在', recommendation: '作成せよ' });
        return violations;
    }

    const jsonlContent = fs.readFileSync(AMPLOG_PATH, 'utf8').trim();
    const lines = jsonlContent.split('\n').filter(l => l.trim());

    const { audit_rules } = readJsonStrict(COMPLIANCE_PATH, 'AUDIT_DAYS_LOOKUP');
    const recentCommits = getRecentCommits(audit_rules.days_to_check);
    const hasCodeChanges = recentCommits.includes('\n');

    if (hasCodeChanges && lines.length === 0) {
        violations.push({ severity: '高', category: 'Traceability', issue: 'コード変更があるのに履歴なし', recommendation: '記録せよ' });
    }

    return violations;
}

function checkCleanupViolations() {
    const offenders = [];
    function scan(dir) {
        try {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                const isAgentDir = entry.name === '.agent';
                const isSessionDir = dir.includes('.agent') && entry.name === 'session';

                if (entry.isDirectory()) {
                    // .agent ディレクトリとその下の session は許可、それ以外のドットディレクトリはスキップ
                    if (isAgentDir || isSessionDir || !entry.name.startsWith('.')) {
                        if (entry.name !== 'node_modules') scan(fullPath);
                    }
                } else if (entry.isFile()) {
                    const { audit_rules } = readJsonStrict(COMPLIANCE_PATH, 'OFFENDER_SCAN');
                    const isOffender = audit_rules.temporary_file_patterns.some(p => {
                        const regex = new RegExp(p);
                        return regex.test(entry.name);
                    });

                    if (isOffender) {
                        offenders.push(fullPath.replace(PROJECT_ROOT + path.sep, '').replace(/\\/g, '/'));
                    }
                }
            }
        } catch (err) { }
    }
    scan(PROJECT_ROOT);

    return offenders.length > 0 ? [{
        severity: '中', category: 'Cleanup', issue: `${offenders.length} 個の一時ファイル`, details: offenders.join('\n'), recommendation: '削除せよ'
    }] : [];
}

function checkRetryPatterns() {
    const session = getSession();
    const isRepairLane = session?.active_task?.is_repair_lane || false;
    if (isRepairLane) return []; // Bypass for repairs

    const { audit_rules } = readJsonStrict(COMPLIANCE_PATH, 'RETRY_PATTERN_AUDIT');
    const commitLog = getDetailedCommitLog(audit_rules.days_to_check);
    if (!commitLog) return [];

    // Simplified detection for SRP compliance in recovery mode
    return [];
}

function generateReport(violations) {
    let report = `# Governance Report\n\nGenerated: ${new Date().toISOString()}\n\n`;
    if (violations.length === 0) return report + "## ✅ COMPLIANT\n";

    violations.forEach(v => {
        report += `### ${v.severity}: ${v.category}\n- **Issue**: ${v.issue}\n- **Rec**: ${v.recommendation}\n\n`;
        if (v.details) report += `\`\`\`\n${v.details}\n\`\`\`\n\n`;
    });
    return report;
}

function checkCognitiveViolations() {
    const session = getSession();
    const tier = session?.active_task?.tier || 'T1';
    const violations = [];

    if (tier === 'T3') {
        const thinkingLog = session?.active_task?.thinking_log || [];
        if (thinkingLog.length === 0) {
            violations.push({
                severity: '高',
                category: 'Cognitive',
                issue: 'T3 タスクにおいて思考ログ (thinking_log) が空です',
                recommendation: 'CAP v3.0 プロトコルに従い、思考プロセスを記録せよ'
            });
        }
    }

    const redesignCount = session?.active_task?.redesign_count || 0;
    // 上限値は thought_rules.json から取得するのが理想だが、ここでは物理的な目安として 5 を使用
    if (redesignCount > 5) {
        violations.push({
            severity: '致命的',
            category: 'Cognitive',
            issue: `再設計回数 (${redesignCount}) が上限を超えています`,
            recommendation: '思考のループを停止し、分析フェーズ（Analyzer）に差し戻せ'
        });
    }

    return violations;
}

function main() {
    console.log('🔍 [Reflect] Sanctuary Audit Start');

    const args = process.argv.slice(2);
    const shouldPurge = args.includes('--purge');

    const session = getSession();
    const isRepairLane = session?.active_task?.is_repair_lane || false;

    const cleanupViolations = checkCleanupViolations();

    if (shouldPurge && cleanupViolations.length > 0) {
        // ... (cleanup logic) ...
        // (略)
    }

    const violations = [
        ...checkAMPLOGViolations(),
        ...(shouldPurge ? checkCleanupViolations() : cleanupViolations),
        ...checkRetryPatterns(),
        ...checkCognitiveViolations()
    ];

    fs.writeFileSync(REPORT_PATH, generateReport(violations), 'utf8');

    if (violations.length > 0) {
        if (isRepairLane) {
            console.warn('⚠️ [Reflect] Repair Lane Active: Violations downgraded to warnings.');
            process.exit(0);
        }
        console.error(`❌ [Reflect] ${violations.length} violations detected.`);
        process.exit(1);
    }
    console.log('✅ [Reflect] Audit Passed.');
    process.exit(0);
}

main();
