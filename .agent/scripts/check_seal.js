import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const AMPLOG_PATH = path.join(process.cwd(), 'AMPLOG.md');
const DEBT_PATH = path.join(process.cwd(), 'DEBT_AND_FUTURE.md');
const REQUIRED_SEAL = '(PW: ｙ)';


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

// 1. AMPLOG.md の存在確認
if (!fs.existsSync(AMPLOG_PATH)) {
    console.error('❌ [check_seal] AMPLOG.md が存在しません。');
    console.error('   → AGENTS.md §1: 全てのAMP結果を AMPLOG.md に記録せよ。');
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
        // 免除対象のファイル群（ドキュメントやログファイル）
        const exemptPatterns = [
            /^AMPLOG\.md$/,
            /^GOVERNANCE_REPORT\.md$/,
            /^SCHEMA_HISTORY\.md$/,
            /^DEBT_AND_FUTURE\.md$/,
            /^task\.md$/,
            /^implementation_plan\.md$/,
            /^walkthrough\.md$/,
            /^\.agent[\\\/].*\.md$/,
            /^\.gemini[\\\/]/
        ];

        // 変更されたすべてのファイルが免除対象に合致するかチェック
        const isDocOnlyChange = allChangedFiles.every(file => {
            // パスの正規化（Windows対応）
            const normalizedFile = file.replace(/\\/g, '/');
            return exemptPatterns.some(pattern => pattern.test(normalizedFile));
        });

        if (isDocOnlyChange) {
            console.log('✅ [check_seal] Context-Aware Bypass 動員: ドキュメント/ログファイルの更新のみを検知しました。');
            console.log('   → 厳格な承認プロセス (PW要求) をスキップします。');
            process.exit(0);
        }
    }
} catch (e) {
    // ignore
}


// 2. AMPLOG.md の読み込みとエントリー抽出
const content = fs.readFileSync(AMPLOG_PATH, 'utf8');
const lines = content.split('\n').filter(l => l.trim().startsWith('|') && !l.includes('---'));

// ヘッダー行を除外（日付パターンを含まない行はヘッダー）
const dataLines = lines.filter(l => /\|\s*\d{4}-\d{2}-\d{2}\s*\|/.test(l));

if (dataLines.length === 0) {
    console.error('❌ [check_seal] AMPLOG.md にエントリーが存在しません。');
    console.error('   → 実装を開始する前に AMP を申請・記録してください。');
    process.exit(1);
}

// 3. 最終エントリーの承認印を検証
const lastEntry = dataLines[dataLines.length - 1];

if (!lastEntry.includes(REQUIRED_SEAL)) {
    console.error('\n🚫───────────── [ GOVERNANCE LOCK ] ─────────────🚫');
    console.error('❌ 最終AMPLOGエントリーに承認印がありません。');
    console.error(`   【必要な承認印】: ${REQUIRED_SEAL}`);
    console.error(`   【最終エントリー】: ${lastEntry.trim()}`);
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
// Phase 12: Reflection (Post-Mortem) Check
// AMPLOG に [FIX] や [重大] がある場合、DEBT に教訓が記録されているか検証
// ═══════════════════════════════════════════════════
function validateReflection同期() {
    if (!fs.existsSync(DEBT_PATH)) return;

    const ampContent = fs.readFileSync(AMPLOG_PATH, 'utf8');
    const debtContent = fs.readFileSync(DEBT_PATH, 'utf8');

    // 直近 5 エントリーを抽出
    const ampEntries = ampContent.split('\n')
        .filter(l => l.trim().startsWith('|') && !l.includes('---'))
        .filter(l => /\|\s*\d{4}-\d{2}-\d{2}\s*\|/.test(l))
        .slice(-5);

    const fixEntries = ampEntries.filter(e => e.includes('[FIX]') || e.includes('[重大]') || e.includes('[SDR]'));

    if (fixEntries.length > 0) {
        console.log('🔍 [check_seal] 教訓の同期（Reflection）を確認中...');
        const today = new Date().toISOString().split('T')[0];
        const hasRecentDebt = debtContent.includes(today) || debtContent.split('\n').some(l => l.includes('#registered: 2026-02-23')); // 今日登録されたものがあるか

        // ※ 今日登録がない場合でも、タイトルの一部が DEBT に含まれていれば OK とする簡易チェック
        const isReflected = fixEntries.some(e => {
            const titleMatch = e.match(/\|\s*[^|]+\s*\|\s*([^|]+)\s*\|/);
            if (!titleMatch) return false;
            const title = titleMatch[1].trim().substring(0, 10); // 前方一致
            return debtContent.includes(title);
        });

        if (!isReflected && !debtContent.includes(today)) {
            console.error('\n🚫───────────── [ REFLECTION LOCK ] ─────────────🚫');
            console.error('❌ 重大な修正（FIX/SDR）が記録されていますが、DEBT_AND_FUTURE.md への教訓登録がありません。');
            console.error('   → AGENTS.md §5: 失敗パターンを物理的構造 (Gate) にフィードバックせよ。');
            console.error('   → 今日の日付で DEBT_AND_FUTURE.md に失敗パターン（#type: fault_pattern）を記録してください。');
            console.error('🚫──────────────────────────────────────────────────🚫\n');
            process.exit(1); // 警告から遮断へ昇格
        } else {
            console.log('✅ [check_seal] 教訓の同期を確認しました。');
        }
    }
}

validateReflection同期();

// 4. 承認日の鮮度チェック（7日以内）
const dateMatch = lastEntry.match(/\|\s*(\d{4}-\d{2}-\d{2})\s*\|/);
if (dateMatch) {
    const entryDate = new Date(dateMatch[1]);
    const now = new Date();
    const daysDiff = (now - entryDate) / (1000 * 60 * 60 * 24);

    if (daysDiff > 7) {
        console.warn(`⚠️  [check_seal] 最終承認から ${Math.floor(daysDiff)} 日が経過しています。`);
        console.warn('   → 現在の作業に対応するAMPエントリーを追加してください。');
        // 警告のみ（ブロックはしない）。厳格化が必要な場合は process.exit(1) に変更。
    }
}

// ✅ All checks passed
console.log('✅ [check_seal] 承認確認完了。実装を許可します。');
console.log(`   最終承認: ${lastEntry.trim()}`);
process.exit(0);
