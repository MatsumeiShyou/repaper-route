#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const DEBT_PATH = path.join(process.cwd(), 'DEBT_AND_FUTURE.md');
const DICT_PATH = path.join(process.cwd(), 'KEYWORD_DICT.md');
const REGISTRY_PATH = path.join(process.cwd(), 'ANTIPATTERN_REGISTRY.jsonl');

/**
 * [外部記憶] ANTIPATTERN_REGISTRY を読み込み、タスクに関連するパターンを最大3件返す
 * R-3対策: max 3件 / R-4対策: expires_days フィルタリング
 */
function loadAntiPatterns(taskText) {
    if (!fs.existsSync(REGISTRY_PATH)) return [];

    const today = new Date();
    const entries = fs.readFileSync(REGISTRY_PATH, 'utf8')
        .split('\n').filter(l => l.trim())
        .map(l => { try { return JSON.parse(l); } catch { return null; } })
        .filter(Boolean);

    // R-4: TTL フィルタリング（expires_days が設定されていれば期限切れは除外）
    const alive = entries.filter(e => {
        if (!e.expires_days) return true;
        const created = new Date(e.date);
        const diff = (today - created) / (1000 * 60 * 60 * 24);
        return diff <= e.expires_days;
    });

    // タスクテキストとのキーワードマッチング（pattern / related_files / description）
    const lowerTask = taskText.toLowerCase();
    const matched = alive.filter(e => {
        const searchText = [
            e.pattern || '',
            e.description || '',
            ...(e.related_files || [])
        ].join(' ').toLowerCase();

        // タスクのキーワードがエントリのテキストと1語以上一致するか
        return lowerTask.split(/[\s,./\\-]+/).some(word =>
            word.length > 3 && searchText.includes(word)
        );
    });

    // severity: high を優先して最大3件
    const sorted = matched.sort((a, b) => {
        const order = { high: 0, medium: 1, low: 2 };
        return (order[a.severity] ?? 1) - (order[b.severity] ?? 1);
    });

    return sorted.slice(0, 3);
}

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

    // ── ANTIPATTERN_REGISTRY 注入 ──
    const antiPatterns = loadAntiPatterns(task);
    let apOut = '';
    if (antiPatterns.length > 0) {
        apOut += `\n## [ANTIPATTERN ALERT] 過去の失敗パターン（最大3件）\n\n`;
        apOut += `> ⚠️ このセクションは ANTIPATTERN_REGISTRY より自動注入されました。\n`;
        apOut += `> 実装前に必ず確認し、同種ミスを防いでください。\n\n`;
        antiPatterns.forEach(e => {
            const note = e.human_note ? `\n   👤 Human Note: ${e.human_note}` : '';
            apOut += `### [${e.id}] ${e.pattern} (${e.severity})\n`;
            apOut += `- **何が起きたか**: ${e.description}\n`;
            apOut += `- **トリガー**: ${e.trigger}\n`;
            apOut += `- **修正方法**: ${e.fix}${note}\n\n`;
        });
    }

    if (matchedMedium.length === 0 && critical.length === 0 && candidates.length === 0 && antiPatterns.length === 0) {
        process.exit(0);
    }

    // apOut を既存の out と結合（ANTIPATTERN は先頭に表示）
    let out = apOut;
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
