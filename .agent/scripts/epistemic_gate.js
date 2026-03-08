#!/usr/bin/env node
/**
 * Epistemic Gate (K-6 Physical Enforcement) - v6.7
 * §N Zero-Fallback & §K-6 Compliance
 */

import fs from 'fs';
import path from 'path';
import { readJsonStrict } from './lib/gov_loader.js';

const PROJECT_ROOT = process.cwd();
const AMPLOG_PATH = path.join(PROJECT_ROOT, 'AMPLOG.md');
const RULES_PATH = path.join(PROJECT_ROOT, 'governance', 'epistemic_rules.json');

const K6_FLAG = '[K-6]';

function main() {
    if (!fs.existsSync(AMPLOG_PATH)) {
        console.log('✅ [認識論的ゲート] AMPLOG.md 不在につきバイパス。');
        process.exit(0);
    }

    const { REQUIRED_MARKERS } = readJsonStrict(RULES_PATH, 'EPISTEMIC_MARKERS', 'Recover governance/epistemic_rules.json');
    const content = fs.readFileSync(AMPLOG_PATH, 'utf8');

    // 直近のエントリー（JST補正）から [K-6] フラグを検索
    const nowJST = new Date(Date.now() + 9 * 60 * 60 * 1000);
    const today = nowJST.toISOString().split('T')[0];
    const yesterday = new Date(nowJST.getTime() - 86400 * 1000).toISOString().split('T')[0];

    const lines = content.split('\n');
    const todayEntries = lines.filter(l =>
        (l.includes(today) || l.includes(yesterday)) && l.includes(K6_FLAG)
    );

    if (todayEntries.length === 0) {
        console.log('✅ [認識論的ゲート] 直近の [K-6] フラグなし。検証をスキップ。');
        process.exit(0);
    }

    console.log('🔬 [認識論的ゲート] [K-6] フラグ検出。物理検証中...');
    const missingMarkers = [];

    for (const marker of REQUIRED_MARKERS) {
        const found = marker.patterns.some(pattern => content.includes(pattern));
        if (!found) {
            missingMarkers.push(marker);
        } else {
            console.log(`[TRACE] Logic [EPISTEMIC_CHECK] Marker [${marker.name}] verified.`);
        }
    }

    if (missingMarkers.length > 0) {
        console.error('\n🚫───────────── [ EPISTEMIC LOCK ] ─────────────🚫');
        console.error('❌ [K-6] フラグ付き高リスク分析において、認識論的透明性マーカーが不足しています。');
        for (const m of missingMarkers) {
            console.error(`     ❌ ${m.name}: ${m.description}`);
        }
        console.error('🚫──────────────────────────────────────────────────🚫\n');
        process.exit(1);
    }

    console.log('✅ [epistemic_gate] 認識論的透明性マーカー検証完了。');
    process.exit(0);
}

main();
