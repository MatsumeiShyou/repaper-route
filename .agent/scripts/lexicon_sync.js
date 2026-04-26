import fs from 'fs';
import path from 'path';

const Log = {
    error: (msg) => console.error(`[LEXICON SYNC] ❌ ${msg}`),
    success: (msg) => console.log(`[LEXICON SYNC] ✅ ${msg}`),
    warn: (msg) => console.log(`[LEXICON SYNC] ⚠️ ${msg}`)
};

function main() {
    const agentsPath = path.join(process.cwd(), 'AGENTS.md');
    const lexiconPath = path.join(process.cwd(), 'governance', 'lexicon.json');

    if (!fs.existsSync(agentsPath) || !fs.existsSync(lexiconPath)) {
        Log.warn('AGENTS.md or lexicon.json not found. Skipping sync.');
        process.exit(0);
    }

    const agentsContent = fs.readFileSync(agentsPath, 'utf8');
    let lexicon = {};
    try {
        lexicon = JSON.parse(fs.readFileSync(lexiconPath, 'utf8'));
    } catch (e) {
        Log.error('Failed to parse lexicon.json');
        process.exit(1);
    }

    // Extract tags: - **[Rule Name]**:
    const ruleRegex = /- \*\*\[(.*?)\]\*\*/g;
    let match;
    const extractedKeys = new Set();
    let hasChanges = false;
    let missingDefinitions = false;

    while ((match = ruleRegex.exec(agentsContent)) !== null) {
        const key = match[1];
        extractedKeys.add(key);

        if (!lexicon.hasOwnProperty(key)) {
            // Auto-complete missing key
            lexicon[key] = "TODO: 意図を記載してください";
            hasChanges = true;
        }
    }

    if (hasChanges) {
        fs.writeFileSync(lexiconPath, JSON.stringify(lexicon, null, 2), 'utf8');
    }

    // Check for TODOs
    for (const key of Object.keys(lexicon)) {
        if (lexicon[key] === "TODO: 意図を記載してください") {
            missingDefinitions = true;
        }
    }

    if (missingDefinitions) {
        Log.error('FATAL: Lexicon Definitions Missing.');
        console.error('[ERROR] 構造的強制：AGENTS.md に新しいルールが追加されましたが、統合辞書に意図（Why）が定義されていません。');
        console.error('[ACTION REQUIRED] `governance/lexicon.json` 内の "TODO" を適切な説明で埋めてから、再度 `npm run done` を試みてください。');
        process.exit(1);
    }

    Log.success('Lexicon is synchronized and fully defined.');
    process.exit(0);
}

main();
