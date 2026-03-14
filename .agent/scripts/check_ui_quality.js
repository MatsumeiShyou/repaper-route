/**
 * check_ui_quality.js
 * PWAとユーザビリティガイドライン（総集編Ⅲ）への準拠を物理的に検証するスクリプト。
 * 
 * Usage: node .agent/scripts/check_ui_quality.js [--check-all]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';
import { logBypassToDebt } from './lib/bypass_logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const THRESHOLDS_PATH = path.join(__dirname, '../../governance/rules/ui_thresholds.json');

function isBypassed(filePath, ruleId) {
  const content = fs.readFileSync(filePath, 'utf8');
  const bypassPattern = new RegExp(`//\\s*gov-bypass\\s*\\[${ruleId}\\]`, 'i');
  return bypassPattern.test(content);
}

async function main() {
  console.log('--- UI Quality Validation (Guideline v3) ---');
  
  if (!fs.existsSync(THRESHOLDS_PATH)) {
    console.error(`[Error] Thresholds file not found: ${THRESHOLDS_PATH}`);
    process.exit(1);
  }

  const config = JSON.parse(fs.readFileSync(THRESHOLDS_PATH, 'utf8'));
  const results = [];

  // --- Validation Logic ---

  // p2-1: CSS static analysis for tap targets
  const minTapSize = config.thresholds["VII-5-3"].value;
  const cssFiles = getFiles('src', /\.css$/);
  cssFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    // Simple heuristic: check for width/height/min-width/min-height < 44px in potential interactive elements
    const matches = content.match(/(width|height|min-width|min-height):\s*(\d+)px/g);
    if (matches) {
      matches.forEach(m => {
        const val = parseInt(m.match(/\d+/)[0]);
        if (val < minTapSize) {
          const level = isBypassed(file, 'VII-5-3') ? 'warn' : config.enforcement.T2;
          results.push({
            id: 'VII-5-3',
            file,
            level,
            message: `Potential small tap target: ${m} (Minimum ${minTapSize}px recommended for PWA/Usability v3)${level === 'warn' ? ' [BYPASSED]' : ''}`
          });
        }
      });
    }
  });

  // p2-2: next/image check
  const tsxFiles = getFiles('src', /\.tsx$/);
  tsxFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('<img') && !content.includes('next/image')) {
       const level = isBypassed(file, 'II-2') ? 'warn' : config.enforcement.T2;
       results.push({
        id: 'II-2',
        file,
        level,
        message: `Native <img> tag found without next/image. Use <Image> for automatic optimization.${level === 'warn' ? ' [BYPASSED]' : ''}`
      });
    }
  });

  // p2-3: PWA manifest existence check
  const manifestPath = path.join(__dirname, '../../public/manifest.json');
  const manifestPathWeb = path.join(__dirname, '../../public/manifest.webmanifest');
  if (!fs.existsSync(manifestPath) && !fs.existsSync(manifestPathWeb)) {
    results.push({
      id: 'I-2',
      file: 'public/',
      level: config.enforcement.T3,
      message: 'PWA Manifest (manifest.json) not found in public directory. Required for app-like experience.'
    });
  }

  // p2-4: stale-while-revalidate (SWR) pattern check
  const usesSWR = tsxFiles.some(file => {
    const content = fs.readFileSync(file, 'utf8');
    return content.match(/useSWR|useQuery|revalidate:|force-cache/);
  });
  if (!usesSWR) {
     results.push({
      id: 'III-2',
      file: 'src/',
      level: config.enforcement.T2,
      message: 'Stale-while-revalidate (SWR) or caching patterns not detected. Recommended for offline resilience.'
    });
  }

  // --- Report Results ---
  results.forEach(r => {
    const color = r.level === 'error' ? '\x1b[31m' : '\x1b[33m';
    console.log(`${color}[${r.level.toUpperCase()}] [${r.id}] ${r.file}: ${r.message}\x1b[0m`);
  });

  await handleViolations(results, config);
}

async function handleViolations(results, config) {
  const errors = results.filter(r => r.level === 'error');
  const interactive = process.argv.includes('--interactive');

  if (errors.length > 0 && interactive) {
    console.log('\n--- Interactive Violation Resolution ---');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    for (const error of errors) {
      console.log(`\nViolation: [${error.id}] in ${error.file}`);
      console.log(`Message: ${error.message}`);
      
      const reasons = [
        "Prototyping/Speed prioritization (Temporary)",
        "Technical constraint / Third-party limitation",
        "Legacy code compatibility",
        "Intentional design deviation (Business requirement)"
      ];

      console.log('Suggested Reasons:');
      reasons.forEach((r, i) => console.log(`${i + 1}. ${r}`));
      
      const answer = await new Promise(resolve => rl.question('\nSelect a reason number or enter custom reason (or "q" to fail): ', resolve));
      
      if (answer.toLowerCase() === 'q') {
        process.exit(1);
      }

      let finalReason = answer;
      const idx = parseInt(answer) - 1;
      if (!isNaN(idx) && reasons[idx]) {
        finalReason = reasons[idx];
      }

      // sg2-4: Automatic comment insertion
      insertBypassComment(error.file, error.id, finalReason);

      // Log to DEBT.md
      logBypassToDebt(error.id, error.file, finalReason);
      
      // Update result level to warn (simulated bypass for this session)
      error.level = 'warn';
      error.message += ` [AUTO-BYPASSED: ${finalReason}]`;
      
      console.log(`\x1b[32mResolution recorded and comment inserted.\x1b[0m`);
    }
    rl.close();
  }

  const hasErrors = results.some(r => r.level === 'error');
  const hasWarnings = results.some(r => r.level === 'warn');

  if (hasErrors) {
    console.error('\n[FAILED] Critical UI/UX violations detected.');
    process.exit(1);
  } else if (hasWarnings) {
    console.warn('\n[WARNING] UI/UX improvements suggested.');
    process.exit(0);
  } else {
    console.log('\n[PASSED] UI/UX compliance verified.');
    process.exit(0);
  }
}

function insertBypassComment(file, id, reason) {
  if (!fs.existsSync(file)) return;
  const content = fs.readFileSync(file, 'utf8');
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + 30);
  const expStr = expirationDate.toISOString().split('T')[0];
  
  const comment = `\n// gov-bypass [${id}] [EXPIRY:${expStr}] ${reason}\n`;
  fs.writeFileSync(file, comment + content, 'utf8');
}

function getFiles(dir, filter, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getFiles(filePath, filter, fileList);
    } else if (filter.test(file)) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

(async () => {
  try {
    await main();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
