import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const AMPLOG_PATH = path.join(process.cwd(), 'AMPLOG.md');
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
