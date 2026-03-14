import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEBT_FILE = path.join(__dirname, '../../../DEBT_AND_FUTURE.md');

/**
 * Log bypass information to DEBT_AND_FUTURE.md
 * @param {string} id - Guideline ID
 * @param {string} file - Source file
 * @param {string} reason - Bypass reason
 */
export function logBypassToDebt(id, file, reason) {
  if (!fs.existsSync(DEBT_FILE)) return;

  const date = new Date().toISOString().split('T')[0];
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + 30); // Default 30 days
  const expStr = expirationDate.toISOString().split('T')[0];

  const entry = `\n- [ ] **Bypass: ${id} in ${path.relative(process.cwd(), file)}**\n` +
                `#type: quality_bypass, #rule: ${id}, #expiry: ${expStr}\n` +
                `#registered: ${date}\n` +
                `  - **Reason**: ${reason}\n`;

  let content = fs.readFileSync(DEBT_FILE, 'utf8');
  
  // Insert into "Active Technical Debt" section
  const sectionHeader = '## 1. Active Technical Debt (現存する技術的負債)';
  if (content.includes(sectionHeader)) {
    content = content.replace(sectionHeader, `${sectionHeader}${entry}`);
    fs.writeFileSync(DEBT_FILE, content, 'utf8');
    console.log(`[Debt Tracker] Logged bypass for ${id} to DEBT_AND_FUTURE.md`);
  }
}
