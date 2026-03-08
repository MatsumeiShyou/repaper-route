const fs = require('fs');
const path = require('path');

const file = path.join('.agent', 'scripts', 'check_seal.js');
const timestampFile = path.join('.agent', 'scripts', '.amp_bypass_timestamp');
let mode = process.argv[2]; // "on" or "off"

if (!fs.existsSync(file)) {
    console.error(`[ERROR] check_seal.js not found at ${file}`);
    process.exit(1);
}

let content = fs.readFileSync(file, 'utf-8');

if (mode === "on") {
    // ON: AMPチェックを無効化（バイパス有効化）
    content = content.replace(/\/\/ AMP_BYPASS_START[\s\S]*?\/\/ AMP_BYPASS_END/, `
process.exit(0); // AMPチェック一時解除
`);
    // タイムスタンプを記録（有効期限の起点）
    fs.writeFileSync(timestampFile, new Date().toISOString(), 'utf-8');
    console.log("AMPチェック解除: ON");
    console.log(`⏱️  有効期限: 48時間 (自動復帰の対象)`);
    console.log(`📍 タイムスタンプ: ${new Date().toISOString()}`);
} else if (mode === "off") {
    // OFF: AMPチェック有効化（バイパス解除）
    content = content.replace(/process.exit\(0\); \/\/ AMPチェック一時解除/, `
// AMP_BYPASS_START
// AMP_BYPASS_END
`);
    // タイムスタンプファイルを削除
    if (fs.existsSync(timestampFile)) {
        fs.unlinkSync(timestampFile);
    }
    console.log("AMPチェック解除: OFF (統治復旧)");
} else {
    console.log("引数を指定してください: on / off");
    process.exit(1);
}

fs.writeFileSync(file, content, 'utf-8');
