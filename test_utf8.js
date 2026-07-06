const fs = require('fs');
const path = require('path');
const files = [
  'C:\\\\Users\\\\shiyo\\\\開発中APP\\\\RePaper Route\\\\AGENTS.md',
  'C:\\\\Users\\\\shiyo\\\\開発中APP\\\\RePaper Route\\\\governance\\\\ADR\\\\0011-logical-priority-over-ai.md'
];
let hasError = false;
for (const f of files) {
  try {
    const content = fs.readFileSync(f, 'utf8');
    if (content.includes('') || content.includes('諞ｲ豕')) {
      console.log('[FAIL] Mojibake detected in: ' + f);
      hasError = true;
    } else {
      console.log('[OK] Clean UTF-8: ' + f);
    }
  } catch (e) {
    console.log('[ERROR] ' + e.message);
    hasError = true;
  }
}
if (hasError) process.exit(1);
