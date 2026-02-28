import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '../../');
const AMPLOG_MD = path.join(PROJECT_ROOT, 'AMPLOG.md');
const AMPLOG_JSONL = path.join(PROJECT_ROOT, 'AMPLOG.jsonl');

function migrate() {
    console.log('🚀 Starting AMPLOG migration (MD -> JSONL)...');

    if (!fs.existsSync(AMPLOG_MD)) {
        console.error('❌ AMPLOG.md not found.');
        process.exit(1);
    }

    const content = fs.readFileSync(AMPLOG_MD, 'utf8');
    const logs = [];

    // Markdown テーブルと詳細セクションをパースする正規表現 (暫定)
    // | 日付 | 区分 | 項目 | 範囲 | 概要 |
    const tableRegex = /\| (\d{4}-\d{2}-\d{2}) \| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \|/g;

    // **[Proposal/Project Name]**
    // - 対象: ...
    // - SDR構造:
    // ...
    // STATUS: ...
    const detailRegex = /\*\*\[([^\]]+)\]\*\*\n- 対象: ([^\n]+)\n- SDR構造:\n([\s\S]*?)\nSTATUS: ([^\n]+)/g;

    let match;
    const tableEntries = [];
    while ((match = tableRegex.exec(content)) !== null) {
        tableEntries.push({
            date: match[1].trim(),
            type: match[2].trim(),
            item: match[3].trim(),
            scope: match[4].trim(),
            summary: match[5].trim()
        });
    }

    const detailEntries = [];
    while ((match = detailRegex.exec(content)) !== null) {
        detailEntries.push({
            label: match[1].trim(),
            target: match[2].trim(),
            sdr: match[3].trim(),
            status: match[4].trim()
        });
    }

    console.log(`📊 Found ${tableEntries.length} table entries and ${detailEntries.length} detail blocks.`);

    // 簡易的なマッピング (最新のエントリーから順に紐付ける等のロジックが必要だが、まずは全件構造化)
    // 実際には Markdown の構造が複雑なため、決定論的な移行は困難な場合があるが、
    // 今後の追加分を JSONL 主体にするためのベースを作成する。

    const structuredLogs = tableEntries.map((te, index) => {
        // 概要がラベルと一致する場合が多い
        const detail = detailEntries.find(de => de.label.includes(te.item) || te.summary.includes(de.label)) || {};
        return {
            id: index + 1,
            date: te.date,
            type: te.type,
            item: te.item,
            scope: te.scope,
            summary: te.summary,
            detail: {
                target: detail.target || '',
                sdr: detail.sdr || '',
                status: detail.status || te.status || '不明'
            },
            timestamp: new Date(te.date).toISOString()
        };
    });

    const jsonlContent = structuredLogs.map(log => JSON.stringify(log)).join('\n');
    fs.writeFileSync(AMPLOG_JSONL, jsonlContent);

    console.log(`✅ Successfully migrated ${structuredLogs.length} entries to AMPLOG.jsonl`);
}

migrate();
