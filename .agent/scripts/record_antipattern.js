#!/usr/bin/env node
/**
 * record_antipattern.js - Anti-Pattern Registry CLI
 * 
 * 失敗パターンを ANTIPATTERN_REGISTRY.jsonl に記録する。
 * 人間の入力（根本原因）を最優先スロットとして分離する。（R-2: 自己申告バイアス対策）
 * 
 * Usage:
 *   node .agent/scripts/record_antipattern.js
 *   node .agent/scripts/record_antipattern.js --ai-desc "推定原因のテキスト"
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';

const REGISTRY_PATH = path.join(process.cwd(), 'ANTIPATTERN_REGISTRY.jsonl');

function ask(rl, question) {
    return new Promise(resolve => rl.question(question, resolve));
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

async function main() {
    const args = process.argv.slice(2);
    const aiDescIdx = args.indexOf('--ai-desc');
    const aiDesc = aiDescIdx !== -1 ? args[aiDescIdx + 1] : '';

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

    console.log('\n📝 ANTIPATTERN_REGISTRY: 失敗パターン記録 CLI');
    console.log('=============================================');
    console.log('⚡ [重要] このCLIでは人間（あなた）の記録が最優先です。');
    if (aiDesc) {
        console.log(`🤖 AI推定原因: "${aiDesc}"`);
    }
    console.log('');

    // ── 人間優先スロット ──
    const human_note = await ask(rl, '👤 [必須] あなたが観察した根本原因を入力してください:\n> ');

    if (!human_note.trim()) {
        console.error('❌ 根本原因は必須です。記録を中止します。');
        rl.close();
        process.exit(1);
    }

    const pattern = await ask(rl, '\n🔖 パターン名（例: partial_edit_variable_loss）:\n> ');
    const description = await ask(rl, '\n📋 説明（何が起きたか）:\n> ');
    const trigger = await ask(rl, '\n⚡ トリガー（どんな操作で発生するか）:\n> ');
    const fix = await ask(rl, '\n🔧 修正方法（次回どう回避するか）:\n> ');
    const related_files_raw = await ask(rl, '\n📁 関連ファイル（カンマ区切り、省略可）:\n> ');
    const severity_raw = await ask(rl, '\n🚨 重大度 [high/medium/low] (デフォルト: medium):\n> ');
    const expires_days_raw = await ask(rl, '\n⏳ 有効期限（日数、無期限は空欄）:\n> ');

    rl.close();

    const registry = loadRegistry();
    const id = generateId(registry);

    const entry = {
        id,
        date: new Date().toISOString().split('T')[0],
        pattern: pattern.trim() || 'unnamed',
        description: description.trim(),
        trigger: trigger.trim(),
        fix: fix.trim(),
        severity: ['high', 'medium', 'low'].includes(severity_raw.trim()) ? severity_raw.trim() : 'medium',
        related_files: related_files_raw.trim()
            ? related_files_raw.split(',').map(f => f.trim()).filter(Boolean)
            : [],
        expires_days: expires_days_raw.trim() ? parseInt(expires_days_raw.trim(), 10) : null,
        source: 'human_cli',
        ai_desc: aiDesc || null,
        human_note: human_note.trim()
    };

    fs.appendFileSync(REGISTRY_PATH, JSON.stringify(entry) + '\n');

    console.log(`\n✅ 記録完了: ${id}`);
    console.log(`   Pattern: ${entry.pattern}`);
    console.log(`   Severity: ${entry.severity}`);
    console.log(`   Human Note: ${entry.human_note}`);
    console.log('\n💡 次回タスク開始時に inject_context.js が自動でこのパターンを参照します。');
}

main().catch(err => {
    console.error('❌ 記録エラー:', err.message);
    process.exit(1);
});
