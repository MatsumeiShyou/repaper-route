import fs from 'fs';
import path from 'path';

const AMPLOG_PATH = path.join(process.cwd(), 'AMPLOG.md');
const REQUIRED_SEAL = '(PW: ｙ)';

// AMP_BYPASS_START
try {
    if (!fs.existsSync(AMPLOG_PATH)) {
        console.error(`[FATAL] AMPLOG.md not found at ${AMPLOG_PATH}`);
        process.exit(1);
    }

    const content = fs.readFileSync(AMPLOG_PATH, 'utf8');
    const lines = content.split('\n').filter(line => line.trim() !== '');

    // Find the last table row (starts with |)
    let lastEntry = '';
    for (let i = lines.length - 1; i >= 0; i--) {
        if (lines[i].trim().startsWith('|')) {
            lastEntry = lines[i];
            break;
        }
    }

    if (!lastEntry) {
        console.error('[ERROR] No log entries found in AMPLOG.md');
        process.exit(1);
    }

    if (lastEntry.includes(REQUIRED_SEAL)) {
        console.log('[SUCCESS] Strict Seal Verified: (PW: ｙ)');
    } else {
        console.error(`[VIOLATION] Latest entry is not sealed with ${REQUIRED_SEAL}`);
        console.error(`   > Entry: ${lastEntry}`);
        process.exit(1);
    }

} catch (err) {
    console.error('[INTERNAL ERROR]', err);
    process.exit(1);
}
// AMP_BYPASS_END
