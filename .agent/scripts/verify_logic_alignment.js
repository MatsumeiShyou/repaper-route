#!/usr/bin/env node
/**
 * Sentinel 2.0: Logical C-E-V Alignment Auditor (v6.7)
 * 憲法 §N (Governance Alignment) に基づき、ロジックとデータの整合性を静的解析する。
 */

import fs from 'fs';
import path from 'path';
import { readJsonStrict, ProtocolError } from './lib/gov_loader.js';

const PROJECT_ROOT = process.cwd();
const INVENTORY_PATH = path.join(PROJECT_ROOT, 'governance', 'inventory.json');

async function main() {
    console.log('\n🛡️  [Sentinel 2.0] Logical C-E-V Alignment Audit...');
    console.log('============================================================');

    // 1. Load Inventory (SSOT)
    const inventory = readJsonStrict(INVENTORY_PATH, 'INVENTORY_AUDIT', 'Restore governance/inventory.json');
    const registry = inventory.registry;

    let totalChecks = 0;
    let totalViolations = 0;

    for (const asset of registry) {
        if (!asset.logic_data_mapping || Object.keys(asset.logic_data_mapping).length === 0) continue;
        if (!asset.path.endsWith('.js')) continue; // スクリプトのみ対象

        const scriptPath = path.join(PROJECT_ROOT, asset.path);
        if (!fs.existsSync(scriptPath)) continue;

        const content = fs.readFileSync(scriptPath, 'utf8');
        console.log(`\n🔍 Checking Logic Alignment: ${asset.path} [${asset.id}]`);

        for (const [logicKey, dataFilePath] of Object.entries(asset.logic_data_mapping)) {
            totalChecks++;

            // ロジックキーの存在確認 (引用符、ブラケット、または RULE_LOAD:キー などの形式)
            const keyRegex = new RegExp(`(['"\`\\[]|:)${logicKey}['"\`\\]]?`);
            const hasKey = keyRegex.test(content);

            // readJsonStrict またはそれに準ずる呼び出しの確認
            const isStrictLoaded = content.includes('readJsonStrict') || content.includes('getRule');

            console.log(`   - Logic [${logicKey}] -> Data [${dataFilePath}]`);

            if (!hasKey) {
                console.error(`     ❌ ERROR: Script does not reference logic key '${logicKey}'`);
                totalViolations++;
            } else if (!isStrictLoaded && dataFilePath !== 'INTERNAL') {
                console.error(`     ❌ ERROR: Logic key '${logicKey}' is not loaded via Strict Protocol (readJsonStrict)`);
                totalViolations++;
            } else {
                console.log(`     ✅ Logic-Data Binding OK.`);
            }
        }
    }

    console.log('\n============================================================');
    console.log(`📊 Audit Summary: ${totalChecks} Checks, ${totalViolations} Violations.`);

    if (totalViolations > 0) {
        console.error('\n🚫───────────── [ LOGIC ALIGNMENT FAILURE ] ─────────────🚫');
        console.error('❌ 統治ロジックとデータの紐付けに不整合が検出されました。');
        console.error('   → AGENTS.md §N: Ghost Logic (ハードコードによる設定無視) は許されません。');
        console.error('   → [FIX_REQUIRED]: inventory.json の定義とコード内の logicKey を一致させてください。');
        console.error('🚫─────────────────────────────────────────────────────🚫\n');
        process.exit(1);
    }

    console.log('✅ [Sentinel 2.0] Logical C-E-V Sync: 100pt Alignment Status.');
    process.exit(0);
}

main().catch(err => {
    console.error(`Fatal Auditor Error: ${err.message}`);
    process.exit(1);
});
