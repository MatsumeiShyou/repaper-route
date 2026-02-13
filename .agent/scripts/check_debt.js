#!/usr/bin/env node
/**
 * DEBT Lifecycle Automation Script
 * 
 * Usage: node .agent/scripts/check_debt.js
 * 
 * Scans DEBT_AND_FUTURE.md for completed [x] items older than 30 days
 * and automatically archives them to DEBT_ARCHIVE.md.
 */

import fs from 'fs';
import path from 'path';

const DEBT_PATH = path.join(process.cwd(), 'DEBT_AND_FUTURE.md');
const ARCHIVE_PATH = path.join(process.cwd(), 'DEBT_ARCHIVE.md');
const ARCHIVE_THRESHOLD_DAYS = 30;

function parseDate(dateStr) {
    // Extract date from formats like "2026-02-11" or "2026-02-11 Phase 10"
    const match = dateStr.match(/\d{4}-\d{2}-\d{2}/);
    return match ? new Date(match[0]) : null;
}

function isOlderThan(dateStr, days) {
    const date = parseDate(dateStr);
    if (!date) return false;

    const now = new Date();
    const diffMs = now - date;
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays > days;
}

function main() {
    console.log('🔍 DEBT Lifecycle Checker');
    console.log('========================\n');

    // Check if DEBT_AND_FUTURE.md exists
    if (!fs.existsSync(DEBT_PATH)) {
        console.error(`❌ Error: DEBT_AND_FUTURE.md not found at ${DEBT_PATH}`);
        process.exit(1);
    }

    const content = fs.readFileSync(DEBT_PATH, 'utf8');
    const lines = content.split('\n');

    const toArchive = [];
    const toKeep = [];
    let currentSection = '';

    for (const line of lines) {
        // Track section headers
        if (line.startsWith('##')) {
            currentSection = line;
            toKeep.push(line);
            continue;
        }

        // Check for completed items with dates
        const isCompleted = line.trim().startsWith('- [x]');

        if (isCompleted) {
            // Look for date in the line or next few lines
            const hasOldDate = isOlderThan(line, ARCHIVE_THRESHOLD_DAYS);

            if (hasOldDate) {
                toArchive.push({
                    section: currentSection,
                    content: line
                });
                console.log(`📦 Archiving: ${line.trim().substring(0, 60)}...`);
            } else {
                toKeep.push(line);
            }
        } else {
            toKeep.push(line);
        }
    }

    if (toArchive.length === 0) {
        console.log('✅ No items to archive (all completed items are recent)');
        process.exit(0);
    }

    // Create or append to DEBT_ARCHIVE.md
    let archiveContent = '';
    if (fs.existsSync(ARCHIVE_PATH)) {
        archiveContent = fs.readFileSync(ARCHIVE_PATH, 'utf8');
    } else {
        archiveContent = `# DEBT Archive (自動生成)\n\nこのファイルは完了後30日以上経過した技術的負債の履歴です。\n\n---\n\n`;
    }

    const archiveDate = new Date().toISOString().split('T')[0];
    archiveContent += `\n## Archived on ${archiveDate}\n\n`;

    toArchive.forEach(item => {
        archiveContent += `${item.content}\n`;
    });

    // Write updated files
    fs.writeFileSync(ARCHIVE_PATH, archiveContent, 'utf8');
    fs.writeFileSync(DEBT_PATH, toKeep.join('\n'), 'utf8');

    console.log(`\n✅ Archived ${toArchive.length} item(s) to DEBT_ARCHIVE.md`);
    console.log(`📝 Updated DEBT_AND_FUTURE.md`);
}

main();
