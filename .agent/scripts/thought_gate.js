#!/usr/bin/env node
/**
 * Sentinel 3.0: Thought Auditor (v7.0)
 * 憲法 §P (Cognitive Governance) に基づき、エージェントの思考プロセスを監査する。
 * Logic Key: 'THOUGHT_AUDIT'
 */

import fs from 'fs';
import path from 'path';
import { readJsonStrict, ProtocolError } from './lib/gov_loader.js';
import { getSession } from './session_manager.js';

const PROJECT_ROOT = process.cwd();
const INVENTORY_PATH = path.join(PROJECT_ROOT, 'governance', 'inventory.json');
const THOUGHT_RULES_PATH = path.join(PROJECT_ROOT, 'governance', 'thought_rules.json');

/**
 * [Dynamic Risk Evaluation] 指定されたファイルと文脈からリスクスコアを算出
 */
function calculateActionRisk(mentionedPaths, tier = 'T1') {
    const inventory = readJsonStrict(INVENTORY_PATH, 'INVENTORY');
    let maxFileRisk = 2; // Default risk

    for (const p of mentionedPaths) {
        const item = inventory.registry.find(entry => path.resolve(PROJECT_ROOT, entry.path) === p);
        if (item && item.risk_score) {
            maxFileRisk = Math.max(maxFileRisk, item.risk_score);
        }
    }

    // T3 の場合は最低リスクを 4 に引き上げ
    if (tier === 'T3') maxFileRisk = Math.max(maxFileRisk, 4);

    return maxFileRisk;
}

/**
 * Sentinel 5.0: 憲法保護 (Constitutional Guard)
 * 思考ログ内にルールを歪めようとする意図がないかをスキャンする。
 */
function checkConstitutionalGuard(content, rules) {
    const config = rules.constitutional_guard;
    if (!config) return;

    for (const keyword of config.forbidden_intent_keywords) {
        if (content.includes(keyword)) {
            ProtocolError.crash(`
🚨 [CONSTITUTIONAL GUARD] 憲法保護インターロックが作動しました。
意図検知: "${keyword}"
原因: 思考ログ内に、自らの都合でルールや憲法（AGENTS.md）を緩和・修正しようとする「自己正当化バイアス」が検出されました。
対策: §P に基づき、ルールを曲げずに実装を完遂するか、法的に不可能な理由を「誠実なデッドロック」として報告してください。
            `);
        }
    }
}

/**
 * [AUDIT] 思考ログの整合性と予算の検証 (100pt Reinforced Edition)
 */
export function auditThought(thinkingEntries) {
    console.log('\n🧠 [Sentinel 3.0] 思考プロセスの整合性を監査中 (100pt Mode)...');

    const rules = readJsonStrict(THOUGHT_RULES_PATH, 'THOUGHT_RULES');
    const session = getSession();
    const currentRequestId = session?.active_task?.current_request_id || null;
    const tier = session?.active_task?.tier || 'T1';

    const rawOutput = thinkingEntries.map(e => e.content).join('\n');

    // --- Sentinel 5.0 Audit Start ---
    checkConstitutionalGuard(rawOutput, rules);
    // --- Sentinel 5.0 Audit End ---

    // 1. Request-ID Binding (Staleness Protection)
    for (const entry of thinkingEntries) {
        if (entry.request_id !== currentRequestId) {
            ProtocolError.crash(`
AGENTS.md §P 違反: 思考ログの鮮度エラー (Stale Thoughts)
原因: ログの指示ID (${entry.request_id}) が現在の指示ID (${currentRequestId}) と一致しません。
対策: 文脈が変更されています。新しい指示に対して [CAP_TRACE] による思考を再構築してください。
            `);
        }
    }

    // 2. Parse Context & Dynamic Risk Evaluate
    const pathRegex = /(?:[a-zA-Z]:)?[\\/](?:[\w.-]+[\\/])*[\w.-]+\.\w+/g;
    const mentionedPaths = [...new Set(rawOutput.match(pathRegex) || [])]
        .map(p => path.resolve(PROJECT_ROOT, p.replace(/[.,:;]$/, '')));

    const actionRisk = calculateActionRisk(mentionedPaths, tier);
    console.log(`   📊 Action Risk Score: ${actionRisk}/5`);

    // 3. Dynamic Step Mapping (Best Practice: Productivity+)
    let requiredStepIds;
    if (actionRisk >= 5) {
        // 最高リスク: 憲法・基盤 (全 10ステップ)
        requiredStepIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    } else if (actionRisk <= 2) {
        // 低リスク: 単純作業 (要約とレビューのみ)
        requiredStepIds = [1, 10];
    } else {
        // 中リスク: デフォルトのティア設定
        requiredStepIds = rules.tiered_depth[tier]?.required_steps || rules.tiered_depth['T1'].required_steps;
    }

    // 4. Parse [CAP_TRACE] Steps
    const stepRegex = /\[CAP_TRACE\] Step (\d+): (.+)/g;
    const foundSteps = [];
    let match;
    while ((match = stepRegex.exec(rawOutput)) !== null) {
        foundSteps.push({ id: parseInt(match[1]), name: match[2].trim() });
    }

    if (foundSteps.length === 0) {
        ProtocolError.crash('AGENTS.md §P 違反: [CAP_TRACE] マーカーが見つかりません。思考プロセスを明示してください。');
    }

    // 5. Validate Step Sequence & Required Steps
    for (const reqId of requiredStepIds) {
        if (!foundSteps.find(s => s.id === reqId)) {
            ProtocolError.crash(`AGENTS.md §P 違反: リスクスコア ${actionRisk} (Tier ${tier}) で必須の思考ステップ ${reqId} が見つかりません。`);
        }
    }

    console.log('   ✅ 思考ステップ構成 OK.');

    // 6. Context Binding (Hallucination & Alignment Check)
    for (const p of mentionedPaths) {
        if (!fs.existsSync(p)) {
            const msg = `AGENTS.md §P 違反: 存在しないパスへの参照が見つかりました（幻覚）: "${p}"`;
            if (tier === 'T3') ProtocolError.crash(msg);
            else console.warn(`[WARNING] ${msg}`);
        }
    }
    console.log('   ✅ 100pt 整合性監査 (RequestID/Context/Steps) 合格。');

    // 7. Semantic Alignment Audit (Task 7.4.1/2)
    const editMarkers = [
        ...rawOutput.matchAll(/\[(?:MODIFY|NEW|DELETE)\]\s*([^(\n\r\t ]+)/g),
        ...rawOutput.matchAll(/####\s*\[(?:MODIFY|NEW|DELETE)\]\s*([^(\n\r\t ]+)/g)
    ].map(m => m[1].split(/[\\/]/).pop()); // ファイル名のみ抽出

    for (const fileName of editMarkers) {
        const isMentioned = mentionedPaths.some(p => p.endsWith(fileName));
        if (!isMentioned) {
            const msg = `AGENTS.md §P 違反: 思考ログの「Proposed Changes」で宣言されたファイル "${fileName}" が、前提事実（Step 2）や分析パスとして認識されていません。論理的な飛躍があります。`;
            if (tier === 'T3') ProtocolError.crash(msg);
            else console.warn(`[WARNING] ${msg}`);
        }
    }
    // 7.5 Logical Continuity Check (Task 7.4.3)
    const step2 = foundSteps.find(s => s.id === 2);
    const step5 = foundSteps.find(s => s.id === 5);
    if (step2 && step5) {
        const s2Content = rawOutput.slice(rawOutput.indexOf(`Step 2:`), rawOutput.indexOf(`Step 3:`)).toLowerCase();
        const s5Content = rawOutput.slice(rawOutput.indexOf(`Step 5:`), rawOutput.indexOf(`Step 6:`)).toLowerCase();

        // ステップ2の重要キーワード（パスの断片など）がステップ5に含まれているか
        const s2Keywords = s2Content.match(/[\w.-]{4,}/g) || [];
        const hasContinuity = s2Keywords.some(kw => s5Content.includes(kw));

        if (!hasContinuity && tier === 'T3') {
            ProtocolError.crash(`AGENTS.md §P 違反: 論理的連続性エラー。ステップ2 (事実) の文脈がステップ5 (仮説) に引き継がれていません。`);
        }
    }
    console.log('   ✅ 論理的連続性 (Logical Continuity) 合格。');

    // 8. Log Audit to AMPLOG (Traceability)
    const logEntry = JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'INFO',
        event: 'THOUGHT_AUDIT_SUCCESS',
        tier,
        request_id: currentRequestId,
        step_count: foundSteps.length
    }) + '\n';
    try {
        fs.appendFileSync(path.join(PROJECT_ROOT, 'AMPLOG.jsonl'), logEntry, 'utf8');
    } catch (e) { }

    // 7.6 Loop Protection (Task 7.5.3)
    const redesignCount = session?.active_task?.redesign_count || 0;
    if (redesignCount >= 3) {
        ProtocolError.crash(`
🚨 [CRITICAL] 統治監査の無限ループを検知しました。
現在の試行回数: ${redesignCount}回
理由: 自己修正の限界を超えています。無理な修正を続けると品質が低下するため、
現在の状況とエラー内容を USER に直接報告し、手動介入を依頼してください。
        `);
    }

    return foundSteps;
}

/**
 * Simple Levenshtein distance for logic auditing
 */
function calculateLevenshtein(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
            }
        }
    }
    return matrix[b.length][a.length];
}

function main() {
    const args = process.argv.slice(2);

    if (args.includes('--audit-session')) {
        console.log('🔍 [Sentinel 3.0] セッション思考ログの完全監査を開始します...');

        const session = getSession();
        const thinkingLog = session?.active_task?.thinking_log || [];

        if (thinkingLog.length === 0) {
            ProtocolError.crash('AGENTS.md §P 違反: セッションに思考ログが存在しません。まずは [CAP_TRACE] による分析を実行してください。');
        }

        auditThought(thinkingLog);
        console.log('✅ [Sentinel 3.0] 全項目合格。物理インターロックを解除します。');
    } else {
        console.log('Sentinel 3.0 v100 Ready.');
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}
