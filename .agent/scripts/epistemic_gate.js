#!/usr/bin/env node
/**
 * Epistemic Gate (K-6 Physical Enforcement)
 * 
 * AGENTS.md §K-6 の認識論的透明性プロトコルを物理的に強制する。
 * 
 * 動作原理:
 *   1. AMPLOG.md の直近エントリーから [K-6] フラグを検索
 *   2. [K-6] が存在する場合、同日の AMPLOG 詳細セクションに
 *      以下の3つのマーカーが含まれるか検証:
 *      - [確認済み事実] or [合理的推論] → 層の分離
 *      - [自己批判] → 二段階批判フェーズ
 *      - [最低確信度項目] → 確信度の自己開示
 *   3. マーカー欠如時は EPISTEMIC LOCK を発行し Exit Code 1 でブロック
 *   4. [K-6] がない場合はパス（軽微な変更には適用しない）
 * 
 * 根拠: AGENTS.md §K-6（認識論的透明性）
 */

import fs from 'fs';
import path from 'path';

const PROJECT_ROOT = process.cwd();
const AMPLOG_PATH = path.join(PROJECT_ROOT, 'AMPLOG.md');

// K-6 準拠マーカー定義
const K6_FLAG = '[K-6]';
const REQUIRED_MARKERS = [
    {
        name: '層の分離',
        patterns: ['[確認済み事実]', '[合理的推論]', '[仮説・推測]', '[不明点]'],
        minMatch: 1,  // 1つ以上あれば OK
        description: '出力に含まれる情報を4層（確認済み事実/合理的推論/仮説・推測/不明点）で明示すること'
    },
    {
        name: '二段階批判フェーズ',
        patterns: ['[自己批判]'],
        minMatch: 1,
        description: '分析を提示した後、同一出力内で推測・仮定・飛躍を自己批判する段階を設けること'
    },
    {
        name: '最低確信度の自己開示',
        patterns: ['[最低確信度項目]'],
        minMatch: 1,
        description: '高リスク分析の末尾に、最も自信がない部分を1つ以上開示すること'
    }
];

function main() {
    // 1. AMPLOG.md の存在確認
    if (!fs.existsSync(AMPLOG_PATH)) {
        console.log('✅ [epistemic_gate] AMPLOG.md が存在しないためスキップ。');
        process.exit(0);
    }

    const content = fs.readFileSync(AMPLOG_PATH, 'utf8');

    // 2. 直近 10 エントリーから [K-6] フラグを検索
    const lines = content.split('\n');
    const dataLines = lines.filter(l =>
        l.trim().startsWith('|') &&
        !l.includes('---') &&
        /\|\s*\d{4}-\d{2}-\d{2}\s*\|/.test(l)
    );

    // [M-3修正] 直近48時間（JST補正）のエントリーを対象にする
    // pre_flight は実装「前」に実行されるため、「今日」だけでなく「昨日」の記録も対象にする
    const nowJST = new Date(Date.now() + 9 * 60 * 60 * 1000);
    const today = nowJST.toISOString().split('T')[0];
    const yesterday = new Date(nowJST.getTime() - 86400 * 1000).toISOString().split('T')[0];

    const todayEntries = dataLines.filter(e => e.includes(today) || e.includes(yesterday));
    const hasK6Flag = todayEntries.some(entry => entry.includes(K6_FLAG));

    if (!hasK6Flag) {
        console.log('✅ [認識論的ゲート] 直近48時間(JST)の [K-6] フラグなし。検証をスキップします。');
        process.exit(0);
    }

    // 3. [K-6] フラグが存在する場合、AMPLOG 全文からマーカーを検証
    console.log('🔬 [認識論的ゲート] [K-6] フラグ検出。認識論的透明性を物理検証中...');

    const missingMarkers = [];

    for (const marker of REQUIRED_MARKERS) {
        const found = marker.patterns.some(pattern => content.includes(pattern));
        if (!found) {
            missingMarkers.push(marker);
        }
    }

    // 4. 結果判定
    if (missingMarkers.length > 0) {
        console.error('\n🚫───────────── [ EPISTEMIC LOCK ] ─────────────🚫');
        console.error('❌ [K-6] フラグ付き高リスク分析において、認識論的透明性マーカーが不足しています。');
        console.error('');
        console.error('   【欠如マーカー】:');
        for (const m of missingMarkers) {
            console.error(`     ❌ ${m.name}`);
            console.error(`        → ${m.description}`);
            console.error(`        → 必要なタグ: ${m.patterns.join(' または ')}`);
        }
        console.error('');
        console.error('   【根拠条文】: AGENTS.md §K-6（認識論的透明性）');
        console.error('');
        console.error('💡 [解除方法]:');
        console.error('  1. Proposal/分析文に上記マーカーを含めて AMPLOG に再記録する');
        console.error('  2. 高リスク分析ではない場合、AMPLOG エントリーから [K-6] フラグを除去する');
        console.error('🚫──────────────────────────────────────────────────🚫\n');
        process.exit(1);
    }

    console.log('✅ [epistemic_gate] 認識論的透明性マーカー検証完了。全マーカー存在を確認。');
    process.exit(0);
}

main();
