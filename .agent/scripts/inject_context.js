#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const DEBT_PATH = path.join(process.cwd(), 'DEBT_AND_FUTURE.md');
const DICT_PATH = path.join(process.cwd(), 'KEYWORD_DICT.md');

function loadDictionary() {
    if (!fs.existsSync(DICT_PATH)) return {};
    const content = fs.readFileSync(DICT_PATH, 'utf8');
    const dictionary = {};
    let currentDomain = '';
    content.split('\n').forEach(line => {
        const domainMatch = line.match(/^###\s+([A-Za-z0-9_-]+)/);
        if (domainMatch) {
            currentDomain = domainMatch[1];
            dictionary[currentDomain] = [currentDomain];
        }
        const keywordMatch = line.match(/[├└]──\s+([\w\.-]+)/) || line.match(/^\s*-\s+([\w\.-]+)/);
        if (currentDomain && keywordMatch) {
            dictionary[currentDomain].push(keywordMatch[1]);
        }
    });
    return dictionary;
}

function extractKeywords(text, dictionary) {
    const found = new Set();
    const lowerText = text.toLowerCase();
    Object.values(dictionary).flat().forEach(k => {
        if (lowerText.includes(k.toLowerCase())) found.add(k.toLowerCase());
    });
    return Array.from(found);
}

function parseDebts() {
    if (!fs.existsSync(DEBT_PATH)) return [];
    const content = fs.readFileSync(DEBT_PATH, 'utf8').replace(/\r\n/g, '\n');

    const items = [];
    const itemRegex = /^(?:[ \t]*(?:-|\*)[ \t]+\[[ x]\][ \t]+\*\*([^*]+)\*\*|###[ \t]+\[([\w-]+)\][ \t]+([^\n]+))\n*((?:(?!^(?:[ \t]*(?:-|\*)[ \t]+\[[ x]\]|###[ \t]+\[[\w-]+\])).|\n)*)/gm;
    let match;

    while ((match = itemRegex.exec(content)) !== null) {
        const title = (match[1] || match[3]).trim();
        const id = match[2] || null;
        const body = match[4];

        const severityMatch = body.match(/#severity:\s*(\w+)/);
        const domainMatch = body.match(/#domain:\s*(\w+)/);
        const typeMatch = body.match(/#type:\s*(\w+)/);
        const triggerMatch = body.match(/#trigger:\s*\[?([\w\s,-]+)\]?/);
        const triggers = triggerMatch ? triggerMatch[1].split(',').map(t => t.trim().toLowerCase()).filter(t => t !== '') : [];

        const summaryMatch = body.match(/現状\*\*:\s*(.*)/);
        const summary = summaryMatch ? summaryMatch[1].trim() : '';

        items.push({
            id,
            title,
            severity: severityMatch ? severityMatch[1] : 'low',
            triggers,
            domain: domainMatch ? domainMatch[1] : 'unknown',
            type: typeMatch ? typeMatch[1] : 'unknown',
            summary: summary.substring(0, 100)
        });
    }
    return items;
}

async function main() {
    const args = process.argv.slice(2);
    const taskIdx = args.indexOf('--task');
    const task = taskIdx !== -1 ? args[taskIdx + 1] : '';

    const dictionary = loadDictionary();
    const taskKeywords = extractKeywords(task, dictionary);
    const debts = parseDebts();

    const matchedMedium = debts.filter(d =>
        d.severity === 'medium' &&
        d.triggers.some(t => taskKeywords.includes(t))
    );
    const critical = debts.filter(d => d.severity === 'critical');

    // Keyword candidate logic
    const triggerCounts = {};
    debts.forEach(d => {
        d.triggers.forEach(t => {
            triggerCounts[t] = (triggerCounts[t] || 0) + 1;
        });
    });

    const allDictKeywords = new Set(Object.values(dictionary).flat().map(k => k.toLowerCase()));
    const candidates = Object.keys(triggerCounts).filter(t =>
        triggerCounts[t] >= 2 && !allDictKeywords.has(t)
    );

    if (matchedMedium.length === 0 && critical.length === 0 && candidates.length === 0) {
        process.exit(0);
    }

    let out = ``;
    if (critical.length > 0 || matchedMedium.length > 0) {
        out += `## [CONTEXT INJECTION] 過去の関連失敗パターン\n\n`;
        out += `> このセクションは inject_context.js により自動生成されました。\n`;
        out += `> タスク開始前に必ず参照し、同種エラーの再発を防止してください。\n\n`;

        if (critical.length > 0) {
            out += `### CRITICAL（常時参照）\n`;
            critical.forEach(d => {
                const idStr = d.id ? `[${d.id}] ` : '';
                out += `- ${idStr}${d.title} — ${d.summary} (domain: ${d.domain}, type: ${d.type})\n`;
            });
            out += `\n`;
        }

        if (matchedMedium.length > 0) {
            out += `### MEDIUM（直近キーワードマッチング）\n`;
            matchedMedium.forEach(d => {
                const idStr = d.id ? `[${d.id}] ` : '';
                out += `- ${idStr}${d.title} — ${d.summary} (domain: ${d.domain}, type: ${d.type})\n`;
            });
            out += `\n`;
        }

        out += `---\n> 一致キーワード: ${taskKeywords.join(', ') || 'なし'}\n> 生成日時: ${new Date().toISOString().replace('T', ' ').substring(0, 16)}\n`;
    }

    if (candidates.length > 0) {
        if (out.length > 0) out += `\n`;
        // Format for stdout to show in context
        out += `> [HINT] 辞書追加候補（未登録で2回以上出現）: ${candidates.join(', ')}\n`;
    }

    if (out.length > 0) {
        process.stdout.write(out);
    }
}

main().catch(err => process.exit(1));
