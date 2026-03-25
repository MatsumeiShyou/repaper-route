import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const PROJECT_ROOT = process.cwd();
const AMPLOG_PATH = path.join(PROJECT_ROOT, 'AMPLOG.jsonl');

function getArg(name) {
    const idx = process.argv.indexOf(name);
    return idx !== -1 ? process.argv[idx + 1] : null;
}

const title = getArg('--title');
const scope = getArg('--scope');
const impact = getArg('--impact');
const designRef = getArg('--design-ref');

if (!title || !scope || !impact) {
    console.error('Usage: node record_amp.js --title "<Title>" --scope "<Scope>" --impact "<Impact>" [--design-ref "<Ref>"]');
    process.exit(1);
}

const entry = {
    timestamp: new Date().toISOString(),
    id: crypto.randomUUID(),
    summary: `${title} (PW: ｙ)`,
    detail: {
        title,
        scope,
        impact,
        design_ref: designRef,
        status: '(PW: ｙ)',
        evidence_locked: true
    }
};

try {
    fs.appendFileSync(AMPLOG_PATH, JSON.stringify(entry) + '\n', 'utf8');
    console.log('\n✅ [AMP] 資産変更承認を AMPLOG.jsonl に記録しました。');
    console.log(`   ID: ${entry.id}`);
    console.log(`   Title: ${title}`);
    process.exit(0);
} catch (e) {
    console.error(`❌ [AMP] 記録に失敗しました: ${e.message}`);
    process.exit(1);
}
