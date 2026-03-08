#!/usr/bin/env node

import { execSync } from 'child_process';
import { lockEvidence } from './session_manager.js';

/**
 * コマンドを実行し、その出力を証跡としてロックする
 * @param {string} type 'negative' | 'positive'
 * @param {string} command 実行するコマンド
 */
export const captureCommandResult = (type, command) => {
    console.log(`\x1b[35m[EVIDENCE COLLECTOR]\x1b[0m Capturing ${type} proof via: ${command}`);

    let output = '';
    try {
        output = execSync(command, { encoding: 'utf8', stdio: 'pipe' }).trim();
    } catch (e) {
        output = (e.stdout ? e.stdout.toString() : '') + '\n' + (e.stderr ? e.stderr.toString() : '');
        output = output.trim();
    }

    if (!output) {
        output = '(Empty Output / Command Succeeded without logging)';
    }

    lockEvidence(type, `Command: ${command}\n\nOutput:\n${output}`);
    console.log(`\x1b[32m[EVIDENCE COLLECTOR] ✓ ${type} proof locked and hashed.\x1b[0m`);
};

// CLI からの実行用
if (process.argv[1].includes('evidence_collector.js')) {
    const type = process.argv[2];
    const cmd = process.argv.slice(3).join(' ');

    if (!type || !cmd) {
        console.error('Usage: node evidence_collector.js <negative|positive> <command>');
        process.exit(1);
    }

    captureCommandResult(type, cmd);
}
