#!/usr/bin/env node
/**
 * record_antipattern.js - Anti-Pattern Registry CLI
 * 
 * 失敗パターンを ANTIPATTERN_REGISTRY.jsonl に記録する。
 * 人間の入力（根本原因）を最優先スロットとして分離する。（R-2: 自己申告バイアス対策）
 * 
 * Usage (対話モード - 人間がターミナルで入力):
 *   node .agent/scripts/record_antipattern.js
 *
 * Usage (非対話モード - AIが会話から取得した情報を引数で渡す):
 *   node .agent/scripts/record_antipattern.js --auto \
 *     --human-note "根本原因" \
 *     --pattern "パターン名" \
 *     --description "説明" \
 *     --trigger "トリガー" \
 *     --fix "修正方法" \
 *     --severity "high" \
 *     --related-files "file1,file2" \
 *     --ai-desc "AI推定原因"
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';

const REGISTRY_PATH = path.join(process.cwd(), 'ANTIPATTERN_REGISTRY.jsonl');

function getArg(args, key) {
    const idx = args.indexOf(key);
    return idx !== -1 && args[idx + 1] ? args[idx + 1] : '';
}

function generateId(registry) {
    const ids = registry.map(e => parseInt(e.id?.replace('AP-', '') || '0', 10)).filter(n => !isNaN(n));
    const next = ids.length > 0 ? Math.max(...ids) + 1 : 1;
    return `AP-${String(next).padStart(3, '0')}`;
}

function loadRegistry() {
    if (!fs.existsSync(REGISTRY_PATH)) return [];
    return fs.readFileSync(REGISTRY_PATH, 'utf8')
        .split('\n').filter(l => l.trim())
        .map(l => { try { return JSON.parse(l); } catch { return null; } })
        .filter(Boolean);
}

function writeEntry(entry) {
    fs.appendFileSync(REGISTRY_PATH, JSON.stringify(entry) + '\n', 'utf8');
    console.log(`\n✅ 記録完了: ${entry.id}`);
    console.log(`   Pattern: ${entry.pattern}`);
    console.log(`   Severity: ${entry.severity}`);
    console.log(`   Human Note: ${entry.human_note}`);
    console.log('\n💡 次回タスク開始時に inject_context.js が自動でこのパターンを参照します。');
}

// ════════════════════════════════════════════
// 非対話モード: --auto フラグで全引数をCLIから受け取る
// ════════════════════════════════════════════
function runAutoMode(args) {
    const human_note = getArg(args, '--human-note');
    if (!human_note) {
        console.error('❌ --auto モードでは --human-note が必須です。');
        process.exit(1);
    }

    const registry = loadRegistry();
    const entry = {
        id: generateId(registry),
        date: new Date().toISOString().split('T')[0],
        pattern: getArg(args, '--pattern') || 'unnamed',
        description: getArg(args, '--description') || '',
        trigger: getArg(args, '--trigger') || '',
        fix: getArg(args, '--fix') || '',
        severity: ['high', 'medium', 'low'].includes(getArg(args, '--severity')) ? getArg(args, '--severity') : 'medium',
        related_files: getArg(args, '--related-files') ? getArg(args, '--related-files').split(',').map(f => f.trim()).filter(Boolean) : [],
        expires_days: null,
        source: 'auto_cli',
        ai_desc: getArg(args, '--ai-desc') || null,
        human_note
    };

    writeEntry(entry);
}

// ════════════════════════════════════════════
// 対話モード: 人間がターミナルで入力
// ════════════════════════════════════════════
async function runInteractiveMode(args) {
    const aiDesc = getArg(args, '--ai-desc');
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const ask = (q) => new Promise(resolve => rl.question(q, resolve));

    console.log('\n📝 ANTIPATTERN_REGISTRY: 失敗パターン記録 CLI');
    console.log('=============================================');
    if (aiDesc) console.log(`🤖 AI推定原因: "${aiDesc}"`);

    const human_note = await ask('👤 [必須] 根本原因:\n> ');
    if (!human_note.trim()) { console.error('❌ 必須。中止。'); rl.close(); process.exit(1); }

    const pattern = await ask('\n🔖 パターン名:\n> ');
    const description = await ask('\n📋 説明:\n> ');
    const trigger = await ask('\n⚡ トリガー:\n> ');
    const fix = await ask('\n🔧 修正方法:\n> ');
    const related_files_raw = await ask('\n📁 関連ファイル (カンマ区切り):\n> ');
    const severity_raw = await ask('\n🚨 重大度 [high/medium/low]:\n> ');
    rl.close();

    const registry = loadRegistry();
    const entry = {
        id: generateId(registry),
        date: new Date().toISOString().split('T')[0],
        pattern: pattern.trim() || 'unnamed',
        description: description.trim(),
        trigger: trigger.trim(),
        fix: fix.trim(),
        severity: ['high', 'medium', 'low'].includes(severity_raw.trim()) ? severity_raw.trim() : 'medium',
        related_files: related_files_raw.trim() ? related_files_raw.split(',').map(f => f.trim()).filter(Boolean) : [],
        expires_days: null,
        source: 'human_cli',
        ai_desc: aiDesc || null,
        human_note: human_note.trim()
    };

    writeEntry(entry);
}

// ════════════════════════════════════════════
// エントリーポイント
// ════════════════════════════════════════════
const args = process.argv.slice(2);

if (args.includes('--auto')) {
    runAutoMode(args);
} else {
    runInteractiveMode(args).catch(err => {
        console.error('❌ 記録エラー:', err.message);
        process.exit(1);
    });
}
