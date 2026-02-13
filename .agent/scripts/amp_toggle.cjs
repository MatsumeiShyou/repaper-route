const fs = require('fs');
const path = require('path');

const file = path.join('.agent', 'scripts', 'check_seal.js');
let mode = process.argv[2]; // "on" or "off"

if (!fs.existsSync(file)) {
    console.error(`[ERROR] check_seal.js not found at ${file}`);
    process.exit(1);
}

let content = fs.readFileSync(file, 'utf-8');

if (mode === "on") {
    // ON: AMPチェックを無効化
    content = content.replace(/\/\/ AMP_BYPASS_START[\s\S]*?\/\/ AMP_BYPASS_END/, `
process.exit(0); // AMPチェック一時解除
`);
    console.log("AMPチェック解除: ON");
} else if (mode === "off") {
    // OFF: AMPチェック有効化
    content = content.replace(/process.exit\(0\); \/\/ AMPチェック一時解除/, `
// AMP_BYPASS_START
// AMP_BYPASS_END
`);
    console.log("AMPチェック解除: OFF");
} else {
    console.log("引数を指定してください: on / off");
    process.exit(1);
}

fs.writeFileSync(file, content, 'utf-8');
