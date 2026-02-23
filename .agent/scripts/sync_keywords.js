#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const DICT_PATH = path.join(process.cwd(), 'KEYWORD_DICT.md');
const DEBT_PATH = path.join(process.cwd(), 'DEBT_AND_FUTURE.md');

function loadDictionary() {
    if (!fs.existsSync(DICT_PATH)) return { domains: [], keywords: new Set() };
    const content = fs.readFileSync(DICT_PATH, 'utf8');
    const domains = [];
    const keywords = new Set();

    let currentDomain = '';
    content.split('\n').forEach(line => {
        const domainMatch = line.match(/^###\s+([A-Za-z0-9_-]+)/);
        if (domainMatch) {
            currentDomain = domainMatch[1].toLowerCase();
            domains.push(currentDomain);
        }
        const keywordMatch = line.match(/[├└]──\s+([\w\.-]+)/) || line.match(/^\s*-\s+([\w\.-]+)/);
        if (keywordMatch) {
            keywords.add(keywordMatch[1].toLowerCase());
        }
    });
    return { domains, keywords };
}

function parseDebts() {
    if (!fs.existsSync(DEBT_PATH)) return [];
    const content = fs.readFileSync(DEBT_PATH, 'utf8');
    const triggerMatch = content.match(/#trigger:\s*\[?([\w\s,-]+)\]?/g);
    if (!triggerMatch) return [];

    const triggers = [];
    triggerMatch.forEach(m => {
        const list = m.match(/\[?([\w\s,-]+)\]?/)[1];
        list.split(',').forEach(t => {
            const trimmed = t.trim().toLowerCase();
            if (trimmed) triggers.push(trimmed);
        });
    });
    return triggers;
}

function main() {
    const dict = loadDictionary();
    const triggers = parseDebts();

    // 2回以上出現し、かつ辞書に未登録のキーワードを抽出
    const counts = {};
    triggers.forEach(t => {
        counts[t] = (counts[t] || 0) + 1;
    });

    const candidates = Object.keys(counts).filter(t =>
        counts[t] >= 2 && !dict.keywords.has(t) && !dict.domains.includes(t)
    );

    if (candidates.length === 0) {
        console.log('✅ 辞書への追加候補は見つかりませんでした。');
        process.exit(0);
    }

    console.log('📊 [KEYWORD PROMOTION] 辞書未登録の頻出キーワードを検出しました:');
    candidates.forEach(c => console.log(`  - ${c} (${counts[c]}回出現)`));

    console.log('\n💡 これらのキーワードを KEYWORD_DICT.md の適切なドメインに追加してください。');
    console.log('   (AIがCleanupフェーズで自動提案・追記することも可能です)');

    // 標準出力に機械判読可能な形式で出す (他スクリプトからの利用想定)
    process.stdout.write(`CANDIDATES:${candidates.join(',')}\n`);
}

main();
