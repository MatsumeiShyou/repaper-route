import fs from 'fs';
import path from 'path';

/**
 * verify_executor.js
 * Executor が承認済みの設計指示 (SDR ID) に基づいて動作しているか検証する。
 */

const amplogPath = path.join(process.cwd(), 'AMPLOG.jsonl');

function getLastT3Entry() {
    if (!fs.existsSync(amplogPath)) return null;
    const lines = fs.readFileSync(amplogPath, 'utf8').trim().split('\n');
    for (let i = lines.length - 1; i >= 0; i--) {
        try {
            const entry = JSON.parse(lines[i]);
            if (entry.tier === 'T3') return entry;
        } catch (e) { continue; }
    }
    return null;
}

const lastT3 = getLastT3Entry();

if (!lastT3) {
    console.log('[Executor Verification] No recent T3 entries found. Skipping physical link check.');
    process.exit(0);
}

if (!lastT3.design_ref) {
    console.error('[ERROR] Executor Violation: Recent T3 entry lacks a "design_ref" (Approved SDR linkage).');
    process.exit(1);
}

console.log(`[Executor Verification] PASSED: Physical link to design found (${lastT3.design_ref}).`);
process.exit(0);
