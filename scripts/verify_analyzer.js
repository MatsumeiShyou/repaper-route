import fs from 'fs';
import path from 'path';

/**
 * verify_analyzer.js
 * Analyzer の出力（設計結果）が実装コードを含んでいないか物理的に検証する。
 */

const outputFiles = process.argv.slice(2);

if (outputFiles.length === 0) {
    console.log('[Analyzer Verification] No output files provided to verify.');
    process.exit(0);
}

const FORBIDDEN_PATTERNS = [
    /```(javascript|typescript|python|bash|sh|powershell|sql|html|css)/i,
    /Tool Call:/i,
    /run_command/i,
    /write_to_file/i,
    /replace_file_content/i
];

let violationCount = 0;

for (const file of outputFiles) {
    if (!fs.existsSync(file)) continue;
    const content = fs.readFileSync(file, 'utf8');

    FORBIDDEN_PATTERNS.forEach(pattern => {
        if (pattern.test(content)) {
            console.error(`[ERROR] Analyzer Violation in ${file}: Forbidden implementation pattern detected: ${pattern}`);
            violationCount++;
        }
    });

    // モード遷移チェック (整理者 -> 設計者 -> 実装思考 -> 監査者)
    const modes = ['整理者', '設計者', '実装思考', '監査者'];
    modes.forEach(mode => {
        if (!content.includes(mode)) {
            console.warn(`[WARNING] Analyzer Warning in ${file}: Missing cognitive mode: ${mode}`);
        }
    });
}

if (violationCount > 0) {
    console.error(`\n[Analyzer Verification] FAILED: ${violationCount} violations found.`);
    process.exit(1);
} else {
    console.log('[Analyzer Verification] PASSED: No implementation leaks detected.');
    process.exit(0);
}
