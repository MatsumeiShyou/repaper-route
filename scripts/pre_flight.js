import fs from 'fs';
import path from 'path';
import gov from '../.agent/scripts/lib/gov_core.js';

/**
 * pre_flight.js: SSOT Governance Guard v2.0 (GaC enabled)
 * 1. useEffect 内での命令的同期 (F-SSOT) の検知
 * 2. 変更ファイル数（Blast Radius）の監視
 */

const PROJECT_ROOT = process.cwd();
const TARGET_DIR = path.join(PROJECT_ROOT, 'src');
const EXTENSIONS = ['.ts', '.tsx'];

// GaC: compliance.json から制限値を読み込む
const MAX_FILES = gov.getRule('compliance', 'limits.max_files_per_scan') || 20;

function scanFile(filePath) {
    const content = gov.readFile(filePath);
    const violations = [];

    // パターン: useEffect(() => { ... setXXX(...) ... }, [ ... ])
    const useEffectRegex = /useEffect\s*\(\s*\(\s*\)\s*=>\s*\{([\s\S]*?)\}\s*,\s*\[([\s\S]*?)\]\s*\)/g;
    let match;

    while ((match = useEffectRegex.exec(content)) !== null) {
        const body = match[1];
        const deps = match[2].trim();

        if (deps.length > 0 && /set[A-Z]\w*\s*\(/.test(body)) {
            const lineNum = content.substring(0, match.index).split('\n').length;
            violations.push({
                line: lineNum,
                deps: deps,
                snippet: body.trim().split('\n')[0].substring(0, 60) + '...'
            });
        }
    }
    return violations;
}

function walkDir(dir, callback) {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach(f => {
        const dirPath = path.join(dir, f);
        if (f === 'node_modules' || f === '.git' || f === 'dist') return;
        const isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory) {
            walkDir(dirPath, callback);
        } else if (EXTENSIONS.includes(path.extname(f))) {
            callback(dirPath);
        }
    });
}

console.log('--- [GaC] SSOT Verification Scan ---');

// 1. SSOT 違反のスキャン
let totalViolations = 0;
walkDir(TARGET_DIR, (filePath) => {
    const violations = scanFile(filePath);
    if (violations.length > 0) {
        const relativePath = path.relative(PROJECT_ROOT, filePath);
        console.log(`\n[WARNING] Potential SSOT Violation in ${relativePath}:`);
        violations.forEach(v => {
            console.log(`  L${v.line}: useEffect depends on [${v.deps}], but calls a setter.`);
        });
        totalViolations += violations.length;
    }
});

// 2. Blast Radius 監視 (簡易的な git diff チェック)
try {
    const changedFilesOutput = gov.execute('git', ['diff', '--name-only', 'HEAD']);
    const changedFiles = changedFilesOutput.trim().split('\n').filter(f => f);
    const blastRadius = changedFiles.length;

    console.log(`\n--- [GaC] Blast Radius Check (Limit: ${MAX_FILES}) ---`);
    console.log(`Changed files: ${blastRadius}`);

    // GaC: risk_matrix.json から判定ルールを取得し、ティアを推奨
    const riskMatrix = gov.getRule('risk_matrix', null);
    let recommendedTier = riskMatrix.default_tier || 'T2';
    let tierReason = 'Defaulting to T2';

    if (riskMatrix && riskMatrix.rules) {
        for (const rule of riskMatrix.rules) {
            // 簡易的な評価ロジック (数値比較やパス文字列チェック)
            if (rule.condition.includes('blast_radius > 20') && blastRadius > 20) {
                recommendedTier = rule.tier;
                tierReason = rule.reason;
                break;
            }
            if (rule.condition.includes('path.includes') && changedFiles.some(f => f.includes('governance/') || f.includes('AGENTS.md'))) {
                recommendedTier = rule.tier;
                tierReason = rule.reason;
                break;
            }
        }
    }

    console.log(`[DECISION] Recommended Tier: ${recommendedTier}`);
    console.log(`[REASON] ${tierReason}`);

    if (blastRadius > MAX_FILES) {
        console.log(`[ALERT] Massive changes detected (${blastRadius} files). T3/ADR review is mandatory.`);
    }
} catch (e) {
    // git が初期化されていない等の場合はスキップ
}

if (totalViolations > 0) {
    console.log(`\nScan complete. Found ${totalViolations} potential violations.`);
} else {
    console.log('\nScan complete. No obvious SSOT violations found.');
}
process.exit(0);
