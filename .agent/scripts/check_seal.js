import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Force UTF-8 for Windows Console
if (process.platform === 'win32') {
    process.stdout.setEncoding('utf8');
    process.stderr.setEncoding('utf8');
}

const AMPLOG_PATH = path.join(process.cwd(), 'AMPLOG.jsonl');
const DEBT_PATH = path.join(process.cwd(), 'DEBT_AND_FUTURE.md');
const REQUIRED_SEAL = '(PW: ｙ)';

// ═══════════════════════════════════════════════════
// Phase 6: [SCHEMA] Deterministic Migration Sync Check
// Git diff で検知された新規 migration が SCHEMA_HISTORY.md に記載されているか検証する
// ═══════════════════════════════════════════════════
const SCHEMA_HISTORY_PATH = path.join(process.cwd(), 'SCHEMA_HISTORY.md');

function validateMigrationSync() {
    console.log('🔍 [check_seal] マイグレーション同期を決定論的に検証中...');

    let newMigrations = [];
    try {
        // ステージング済みの新規 migration ファイルを取得
        const output = execSync('git diff --cached --name-only', { encoding: 'utf8' });
        newMigrations = output.split('\n')
            .filter(file => file.startsWith('supabase/migrations/') && file.endsWith('.sql'))
            .map(file => path.basename(file));
    } catch (e) {
        // 非Git環境やエラー時はスキップ（または警告）
        return;
    }

    if (newMigrations.length === 0) {
        console.log('✅ [check_seal] 新規マイグレーションファイルは検知されませんでした。');
        return;
    }

    if (!fs.existsSync(SCHEMA_HISTORY_PATH)) {
        console.error('❌ [check_seal] SCHEMA_HISTORY.md が見つかりません。');
        process.exit(1);
    }

    const historyContent = fs.readFileSync(SCHEMA_HISTORY_PATH, 'utf8');
    const missingInHistory = newMigrations.filter(file => !historyContent.includes(file));

    if (missingInHistory.length > 0) {
        console.error('\n🚫───────────── [ SCHEMA SYNC LOCK ] ─────────────🚫');
        console.error('❌ 新規マイグレーションが SCHEMA_HISTORY.md に記録されていません。');
        console.error('   【未記載のファイル】:');
        missingInHistory.forEach(f => console.error(`    - ${f}`));
        console.error('\n💡 [解決方法]:');
        console.error('   1. SCHEMA_HISTORY.md を開き、末尾に新規変更内容とファイル名を追記してください。');
        console.error('   2. 追記後、git add SCHEMA_HISTORY.md を実行してから再度 Seal を取得してください。');
        console.error('🚫──────────────────────────────────────────────────🚫\n');
        process.exit(1);
    }

    console.log(`✅ [check_seal] 全ての新規マイグレーション (${newMigrations.length}件) の履歴記載を確認しました。`);
}

validateMigrationSync();


// ═══════════════════════════════════════════════════
// Phase 6-2: DB View GRANT Validation
// ═══════════════════════════════════════════════════
const VALIDATE_GRANTS_PATH = path.join(process.cwd(), '.agent/scripts/validate_grants.js');
if (fs.existsSync(VALIDATE_GRANTS_PATH)) {
    try {
        console.log('🔍 [check_seal] DB VIEW 権限整合性を検証中...');
        execSync(`node "${VALIDATE_GRANTS_PATH}"`, { stdio: 'inherit' });
    } catch (e) {
        process.exit(1);
    }
}


// ═══════════════════════════════════════════════════
// バイパス有効期限チェック（48時間で自動失効）
// ═══════════════════════════════════════════════════
const BYPASS_TIMESTAMP_PATH = path.join(
    path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')),
    '.amp_bypass_timestamp'
);

if (fs.existsSync(BYPASS_TIMESTAMP_PATH)) {
    const timestamp = new Date(fs.readFileSync(BYPASS_TIMESTAMP_PATH, 'utf8').trim());
    const hoursSince = (Date.now() - timestamp.getTime()) / (1000 * 60 * 60);

    if (hoursSince > 48) {
        console.error('❌ [check_seal] バイパスの有効期限（48時間）が切れています。');
        console.error(`   → 解除時刻: ${timestamp.toISOString()}`);
        console.error(`   → 経過時間: ${Math.floor(hoursSince)} 時間`);
        console.error('   → 統治を強制復旧します。node .agent/scripts/amp_toggle.cjs off を実行してください。');
        process.exit(1);
    }
}



// AMP_BYPASS_START
// AMP_BYPASS_END





// ═══════════════════════════════════════════════════
// AGENTS.md §1 AMPLOG Protocol / §8 Execution Permission Protocol
// 最終AMPLOGエントリーに承認印 (PW: ｙ) があるか検証する
// ═══════════════════════════════════════════════════

// 1. AMPLOG.jsonl の存在確認
if (!fs.existsSync(AMPLOG_PATH)) {
    console.error('❌ [check_seal] AMPLOG.jsonl が存在しません。');
    console.error('   → AGENTS.md §1: 全てのAMP結果を AMPLOG.jsonl に記録せよ。');
    process.exit(1);
}

// ═══════════════════════════════════════════════════
// Context-Aware Bypass (Log/Doc only changes)
// ═══════════════════════════════════════════════════
try {
    // 変更されているファイルを抽出
    let diffCached = [];
    let diffWorkspace = [];
    try {
        diffCached = execSync('git diff --cached --name-only', { encoding: 'utf8' }).trim().split('\n');
        diffWorkspace = execSync('git ls-files --others --modified --exclude-standard', { encoding: 'utf8' }).trim().split('\n');
    } catch (e) {
        // git error
    }

    const allChangedFiles = [...new Set([...diffCached, ...diffWorkspace])].filter(f => f.trim().length > 0);

    // 変更ファイルがある場合のみチェックする
    if (allChangedFiles.length > 0) {
        // [M-5修正 & DRY] governance_rules.json から免除対象を読み込む
        const RULES_PATH = path.join(PROJECT_ROOT, '.agent', 'config', 'governance_rules.json');
        const { exemptPatterns: rawPatterns } = JSON.parse(fs.readFileSync(RULES_PATH, 'utf8'));
        const exemptPatterns = rawPatterns.map(p => new RegExp(p));

        // 変更されたすべてのファイルが免除対象に合致するかチェック
        const isDocOnlyChange = allChangedFiles.every(file => {
            // パスの正規化（Windows対応）
            const normalizedFile = file.replace(/\\/g, '/');
            return exemptPatterns.some(pattern => pattern.test(normalizedFile));
        });

        if (isDocOnlyChange) {
            console.log('✅ [Seal Gate] 文脈依存バイパス発動: ドキュメント/ログ/一時ファイルの更新のみを検知。');
            console.log('   → 厳格な承認プロセス (PW要求) をスキップします。');
            process.exit(0);
        }
    }
} catch (e) {
    // ignore
}


// 2. AMPLOG エントリーの抽出 (JSONL 正典)
console.log('🔍 [check_seal] AMPLOG.jsonl を決定論的に検証中...');
const jsonlLines = fs.readFileSync(AMPLOG_PATH, 'utf8').trim().split('\n').filter(line => line.trim() !== "");

let lastEntryData = null;
let lastEntryDisplay = "";

for (let i = jsonlLines.length - 1; i >= 0; i--) {
    try {
        const entry = JSON.parse(jsonlLines[i]);
        lastEntryData = entry;
        lastEntryDisplay = `[${entry.date}] ${entry.item}: ${entry.summary} (Seal: ${entry.detail?.status || 'N/A'})`;
        break;
    } catch (e) {
        continue;
    }
}

if (!lastEntryData) {
    console.error('❌ [check_seal] AMPLOG.jsonl に有効なエントリーが存在しません。');
    process.exit(1);
}

const status = lastEntryData.detail?.status || lastEntryData.summary || "";
lastEntryData.isSealValid = status.includes(REQUIRED_SEAL);

// 3. 最終エントリーの承認印を検証
if (!lastEntryData.isSealValid) {
    console.error('\n🚫───────────── [ GOVERNANCE LOCK ] ─────────────🚫');
    console.error('❌ 最終AMPLOGエントリーに承認印がありません。');
    console.error(`   【必要な承認印】: ${REQUIRED_SEAL}`);
    console.error(`   【最終エントリー】: ${lastEntryDisplay}`);
    console.error('   【根拠条文】: AGENTS.md §1 (完全一致時のみ承認。PWなき変更は即時ロールバック)');
    console.error('\n💡 [ナビゲーション] 以下のいずれかの対応を行ってください:');
    console.error('  1. AMPLOGを自動記録する: node .agent/scripts/record_amp.js');
    console.error('  2. 手動で最終エントリーの末尾に「承認 (PW: ｙ)」を追記する');
    console.error('  3. 例外措置としてSVPを動員する: 承認 [Audit: 理由を書く] (PW: ｙ) と記述する');
    console.error('🚫──────────────────────────────────────────────────🚫\n');
    process.exit(1);
}

// ═══════════════════════════════════════════════════
// Phase 6-1: Schema vs Types Consistency Check
// database.types.ts に標準カラム (is_active 等) が定義されているか検証
// ═══════════════════════════════════════════════════
const TYPES_PATH = path.join(process.cwd(), 'src/types/database.types.ts');

function validateSchemaConsistency() {
    if (!fs.existsSync(TYPES_PATH)) return;

    console.log('🔍 [check_seal] スキーマ整合性を決定論的に検証中...');
    const typesContent = fs.readFileSync(TYPES_PATH, 'utf8');

    // チェック対象の重要テーブルと必須カラム
    const criticalTables = [
        { name: 'drivers', required: ['is_active', 'driver_name'] },
        { name: 'vehicles', required: ['is_active', 'number'] },
        { name: 'master_contractors', required: ['name'] },
        { name: 'master_items', required: ['is_active', 'name'] }
    ];

    let hasError = false;

    for (const table of criticalTables) {
        // テーブル定義のブロックを抽出 (簡易的な正規表現)
        const tableRegex = new RegExp(`${table.name}:\\s*{[^{]*Row:\\s*{([^}]*)}`, 's');
        const match = typesContent.match(tableRegex);

        if (!match) {
            console.warn(`⚠️  [check_seal] テーブル ${table.name} の Row 定義が database.types.ts で見つかりません。`);
            continue;
        }

        const rowContent = match[1];
        for (const col of table.required) {
            if (!rowContent.includes(col)) {
                console.error(`❌ [check_seal] 整合性エラー: テーブル ${table.name} に必須カラム "${col}" が定義されていません。`);
                hasError = true;
            }
        }
    }

    if (hasError) {
        console.error('   → AGENTS.md §8: 物理スキーマと型定義の不整合は許容されません。');
        process.exit(1);
    }
    console.log('✅ [check_seal] スキーマ整合性確認完了。');
}

validateSchemaConsistency();

// ═══════════════════════════════════════════════════
// Phase 4: Debt Resolution & Block Check
// DEBT_AND_FUTURE.md の未解消負債 (Critical/High) を検証する
// ═══════════════════════════════════════════════════
function validateDebtStatus() {
    if (!fs.existsSync(DEBT_PATH)) return { count: 0, criticalCount: 0 };

    const content = fs.readFileSync(DEBT_PATH, 'utf8');
    const lines = content.split('\n');
    let activeDebts = [];
    let currentDebt = null;

    // [M-4修正] 今回ステージした新規負債行を Set で除外（Fault Reflection 直後にブロックしないため）
    const newlyAddedDebtSet = new Set();
    try {
        const diff = execSync('git diff --cached DEBT_AND_FUTURE.md', { encoding: 'utf8' });
        diff.split('\n')
            .filter(l => l.startsWith('+- [ ]') || l.startsWith('+ - [ ]'))
            .map(l => l.replace(/^\+\s*/, '').trim())
            .forEach(l => newlyAddedDebtSet.add(l));
    } catch (e) { }

    for (const line of lines) {
        // 負債項目の開始を検知
        if (line.trim().startsWith('- [ ]')) {
            // [M-4] 今回追加した負債はスキップ
            if (newlyAddedDebtSet.has(line.trim())) {
                currentDebt = null;
                continue;
            }
            if (currentDebt) activeDebts.push(currentDebt);
            currentDebt = {
                title: line.replace('- [ ]', '').trim(),
                severity: 'medium', // デフォルト
                domain: 'unknown'
            };
        } else if (currentDebt && line.includes('#severity:')) {
            currentDebt.severity = line.match(/#severity:\s*(\w+)/)?.[1] || 'medium';
        } else if (currentDebt && line.includes('#domain:')) {
            currentDebt.domain = line.match(/#domain:\s*(\w+)/)?.[1] || 'unknown';
        } else if (line.trim().startsWith('- [x]') || (line.trim().startsWith('##') && !line.includes('Active'))) {
            if (currentDebt) {
                activeDebts.push(currentDebt);
                currentDebt = null;
            }
        }
    }
    if (currentDebt) activeDebts.push(currentDebt);

    const criticalDebts = activeDebts.filter(d => d.severity === 'critical' || d.severity === 'high');

    if (activeDebts.length > 0) {
        console.log(`\n📋 [check_seal] 未解消の負債が ${activeDebts.length} 件あります（うち重大: ${criticalDebts.length} 件）:`);
        activeDebts.forEach(d => {
            const icon = (d.severity === 'critical' || d.severity === 'high') ? '🔴' : '🟡';
            console.log(`   ${icon} [${d.severity}] ${d.title}`);
        });
    }

    if (criticalDebts.length > 0) {
        console.error('\n🚫───────────── [ DEBT BLOCK ] ─────────────🚫');
        console.error('❌ 未解消の重大な負債（Critical/High）が残存しています。');
        console.error('   → AGENTS.md §G: 既存負債の解消を最優先せよ。');
        console.error('   → 負債を解消し DEBT_ARCHIVE.md へ移動するか、完了マーク [x] を付けてください。');
        console.error('🚫──────────────────────────────────────────🚫\n');
        process.exit(1);
    }

    return { count: activeDebts.length, criticalCount: criticalDebts.length };
}

const debtStatus = validateDebtStatus();

// 4. 承認日の鮮度チェック（7日以内）
if (lastEntryData.date) {
    const entryDate = new Date(lastEntryData.date);
    const now = new Date();
    const daysDiff = (now - entryDate) / (1000 * 60 * 60 * 24);

    if (daysDiff > 7) {
        console.warn(`⚠️  [check_seal] 最終承認から ${Math.floor(daysDiff)} 日が経過しています。`);
        console.warn('   → 現在の作業に対応するAMPエントリーを追加してください。');
        // 警告のみ（ブロックはしない）。厳格化が必要な場合は process.exit(1) に変更。
    }
}

// ✅ All checks passed
console.log('\n✨ [check_seal] すべての統治チェックを通過しました。実装を許可します。');
console.log(`   最終承認: ${lastEntryDisplay.trim()}`);
if (debtStatus.count > 0) {
    console.log(`   残存負債: ${debtStatus.count} 件 (許容範囲内)`);
}
process.exit(0);
