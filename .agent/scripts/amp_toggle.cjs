const fs = require('fs');
const file = './check_seal.js';
let mode = process.argv[2]; // "on" or "off"

let content = fs.readFileSync(file, 'utf-8');

if(mode === "on") {
    // ON: AMPチェックを無効化
    content = content.replace(/\/\/ AMP_BYPASS_START[\s\S]*?\/\/ AMP_BYPASS_END/, `
process.exit(0); // AMPチェック一時解除
`);
    console.log("AMPチェック解除: ON");
} else if(mode === "off") {
    // OFF: AMPチェック有効化
    content = content.replace(/process.exit\(0\); \/\/ AMPチェック一時解除/, `
// AMP_BYPASS_START
// AMP_BYPASS_END
`);
    console.log("AMPチェック解除: OFF");
} else {
    console.log("引数を指定してください: on / off");
}

fs.writeFileSync(file, content, 'utf-8');
