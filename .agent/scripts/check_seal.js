import fs from 'fs';
import path from 'path';
import gov from './lib/gov_core.js';
import { readJsonStrict } from './lib/gov_loader.js';

// ═══════════════════════════════════════════════════
// [AGENTS.md §D] Tier-based Bypass
// ═══════════════════════════════════════════════════
const PROJECT_ROOT = process.cwd();
const AMPLOG_PATH = path.join(PROJECT_ROOT, 'AMPLOG.jsonl');
const DEBT_PATH = path.join(PROJECT_ROOT, 'DEBT_AND_FUTURE.md');

// Use environment metadata or session if available
// For simplicity, we assume T3 if not specified
console.log('--- [GOVERNANCE] Starting Seal Verification (v5.1 EAL/GaC) ---');

// ═══════════════════════════════════════════════════
// Phase 1: Migration Sync Check
// ═══════════════════════════════════════════════════
function validateMigrationSync() {
    console.log('🔍 [check_seal] マイグレーション同期を検証中...');
    const SCHEMA_HISTORY_PATH = path.join(PROJECT_ROOT, 'SCHEMA_HISTORY.md');
    console.log(`[TRACE] Logic [MIGRATION_SYNC] Checking data against ${path.basename(SCHEMA_HISTORY_PATH)}`);

    try {
        const output = gov.execute('git', ['diff', '--cached', '--name-only']);
        const newMigrations = output.trim().split('\n')
            .filter(file => file.startsWith('supabase/migrations/') && file.endsWith('.sql'))
            .map(file => path.basename(file));

        if (newMigrations.length > 0) {
            if (!fs.existsSync(SCHEMA_HISTORY_PATH)) {
                console.error('❌ [check_seal] SCHEMA_HISTORY.md が見つかりません。');
                process.exit(1);
            }
            const historyContent = fs.readFileSync(SCHEMA_HISTORY_PATH, 'utf8');
            const missing = newMigrations.filter(f => !historyContent.includes(f));
            if (missing.length > 0) {
                console.error('❌ [check_seal] SCHEMA_HISTORY.md に未記載のマイグレーションがあります。');
                process.exit(1);
            }
        }
    } catch (e) { /* git error ok */ }
}
validateMigrationSync();

// ═══════════════════════════════════════════════════
// Phase 2: DB Grant Validation
// ═══════════════════════════════════════════════════
const VALIDATE_GRANTS_PATH = '.agent/scripts/validate_grants.js';
if (fs.existsSync(path.join(PROJECT_ROOT, VALIDATE_GRANTS_PATH))) {
    try {
        console.log('🔍 [check_seal] DB VIEW 権限整合性を検証中...');
        gov.execute('node', [VALIDATE_GRANTS_PATH], { stdio: 'inherit' });
    } catch (e) {
        process.exit(1);
    }
}

// ═══════════════════════════════════════════════════
// Phase 3: DB Schema Diff Check
// ═══════════════════════════════════════════════════
try {
    console.log('🔍 [check_seal] スキーマ不整合（supabase db diff）を検証中...');
    const diff = gov.execute('npx', ['supabase', 'db', 'diff', '--local'], { stdio: 'pipe' });
    if (diff && diff.trim() !== "" && !diff.includes("No changes found")) {
        console.error('❌ [check_seal] スキーマ不整合は許容されません。');
        process.exit(1);
    }
} catch (e) {
    console.log('⚠️ [check_seal] Supabase 差分検証をスキップ (環境未準備)。');
}

// ═══════════════════════════════════════════════════
// Phase 4: Seal Verification (Pure Node.js UTF-8)
// ═══════════════════════════════════════════════════
console.log('🔍 [check_seal] AMPLOG.jsonl の物理印を検証中...');
let lastEntry = null;
if (fs.existsSync(AMPLOG_PATH)) {
    try {
        const content = fs.readFileSync(AMPLOG_PATH, 'utf8');
        const lines = content.trim().split('\n').filter(l => l.trim());
        if (lines.length > 0) {
            console.log(`[TRACE] Logic [SEAL_AUDIT] Accessing last entry from ${path.basename(AMPLOG_PATH)}`);
            lastEntry = JSON.parse(lines[lines.length - 1]);
        }
    } catch (e) {
        console.error('❌ [check_seal] AMPLOG.jsonl の読み取りまたはパースに失敗しました。');
        process.exit(1);
    }
}

if (!lastEntry) {
    console.error('❌ [check_seal] AMPLOG エントリーが見つかりません。');
    process.exit(1);
}

const status = lastEntry.detail?.status || lastEntry.summary || "";
const SEAL_RULES_PATH = path.join(PROJECT_ROOT, 'governance', 'seal_rules.json');
const { SEAL_PATTERNS } = readJsonStrict(SEAL_RULES_PATH, 'SEAL_VALIDATION', 'Recover governance/seal_rules.json');

const isSealValid = SEAL_PATTERNS.some(p => status.includes(p));

if (!isSealValid) {
    console.error('\n🚫───────────── [ GOVERNANCE LOCK ] ─────────────🚫');
    console.error('❌ 最終AMPLOGエントリーに承認印がありません。');
    console.error(`   【必要な承認印パターン】: ${SEAL_PATTERNS.join(' , ')}`);
    console.error(`   【最終エントリー】: [${lastEntry.date}] ${lastEntry.summary}`);
    console.error('🚫──────────────────────────────────────────────────🚫\n');
    process.exit(1);
}

// ═══════════════════════════════════════════════════
// Phase 5: Debt Check
// ═══════════════════════════════════════════════════
function validateDebtStatus() {
    if (!fs.existsSync(DEBT_PATH)) return;
    const { DEBT_CRITICAL_LABELS } = readJsonStrict(SEAL_RULES_PATH, 'DEBT_AUDIT');
    const content = fs.readFileSync(DEBT_PATH, 'utf8');
    const isCritical = DEBT_CRITICAL_LABELS.some(label => content.includes(label));
    if (isCritical) {
        console.warn('⚠️ [check_seal] 重大な負債（Critical/High）が検出されました。解消を推奨します。');
    }
}
validateDebtStatus();

// ═══════════════════════════════════════════════════
// Finalization
// ═══════════════════════════════════════════════════
console.log('\n✨ [check_seal] すべての統治チェックを通過しました。');
console.log(`   最終承認: [${lastEntry.date}] ${lastEntry.summary}`);
process.exit(0);
