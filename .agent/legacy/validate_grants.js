import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

if (process.platform === 'win32') {
    process.stdout.setEncoding('utf8');
    process.stderr.setEncoding('utf8');
}

console.log('🔍 [validate_grants] DB VIEW への GRANT 発行漏れを静的解析中...');

function validateGrants() {
    let changedFiles = [];
    try {
        const diffCached = execSync('git diff --cached --name-only', { encoding: 'utf8' }).trim();
        const diffWorkspace = execSync('git ls-files --others --modified --exclude-standard', { encoding: 'utf8' }).trim();
        changedFiles = [...new Set([...diffCached.split('\n'), ...diffWorkspace.split('\n')])].filter(f => f);
    } catch (e) {
        // Error getting diff
    }

    const sqlFiles = changedFiles.filter(f => f.replace(/\\/g, '/').includes('supabase/migrations/') && f.endsWith('.sql'));

    if (sqlFiles.length === 0) {
        console.log('✅ [validate_grants] マイグレーションの変更はありません。');
        process.exit(0);
    }

    let hasError = false;

    // View detection regex: CREATE VIEW or CREATE OR REPLACE VIEW
    const viewRegex = /CREATE\s+(?:OR\s+REPLACE\s+)?VIEW\s+([a-zA-Z0-9_"]+(?:\.[a-zA-Z0-9_"]+)?)/gi;

    for (const file of sqlFiles) {
        const filePath = path.join(process.cwd(), file);
        if (!fs.existsSync(filePath)) continue;

        const content = fs.readFileSync(filePath, 'utf8');
        let match;

        while ((match = viewRegex.exec(content)) !== null) {
            const viewName = match[1];

            // Check for anon and authenticated grants for the view
            const grantAnonRegex = new RegExp(`GRANT\\s+SELECT\\s+ON\\s+${viewName}\\s+TO\\s+[^;]*anon`, 'i');
            const grantAuthRegex = new RegExp(`GRANT\\s+SELECT\\s+ON\\s+${viewName}\\s+TO\\s+[^;]*authenticated`, 'i');

            if (!grantAnonRegex.test(content) || !grantAuthRegex.test(content)) {
                console.error(`\n❌ [validate_grants] 権限不整合エラー: ${file}`);
                console.error(`   VIEW '${viewName}' に対する GRANT SELECT 宣言が不足しています。`);
                console.error(`   → (必須要件) GRANT SELECT ON ${viewName} TO anon, authenticated;`);
                hasError = true;
            }
        }
    }

    if (hasError) {
        console.error('\n🚫───────────── [ DB GRANT LOCK ] ─────────────🚫');
        console.error('❌ VIEW 権限の不整合を検知したため、プロセスを遮断します。');
        console.error('   → AGENTS.md §F:権限不足は致命的な401ホワイトアウトを引き起こします。');
        console.error('   → 該当SQLファイルに GRANT 宣言を追記してから再試行してください。');
        console.error('🚫───────────────────────────────────────────🚫\n');
        process.exit(1);
    }

    console.log('✅ [validate_grants] 全ての新規/変更 VIEW への GRANT 宣言を確認しました。');
}

validateGrants();
