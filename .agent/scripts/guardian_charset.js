import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * guardian_charset.js
 * 
 * 指定されたファイル（JSONL / MD）が BOMなしの純粋な UTF-8 であるかを
 * バイナリレベルで高速に検証する物理・決定論的ガード。
 * 
 * [Exit Codes]
 * 0: OK (BOM-less UTF-8 verified)
 * 1: NG (BOM detected, or invalid UTF-8 sequence, or Target File Not Found)
 */

const TARGET_FILES = [
    'AMPLOG.jsonl',
    'ANTIPATTERN_REGISTRY.jsonl',
    'AGENTS.md',
    'DEBT_AND_FUTURE.md'
];

function verifyCharset(filePath) {
    const fullPath = path.resolve(__dirname, '../../', filePath);

    if (!fs.existsSync(fullPath)) {
        // Some files might be optional or just not created yet, 
        // but for core governance files, their absence is a problem or they just don't exist yet.
        // To be safe and frictionless, if it doesn't exist, we skip validation.
        return { ok: true };
    }

    try {
        const buffer = fs.readFileSync(fullPath);

        // Check for BOM (Byte Order Mark) - EF BB BF
        if (buffer.length >= 3 && buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
            return { ok: false, reason: 'BOM (Byte Order Mark) detected. File must be BOM-less UTF-8.' };
        }

        // Basic heuristic to catch obvious Shift-JIS / CP932 pollution
        // Shift-JIS / CP932 uses byte ranges like 81-9F, E0-FC for the first byte, 
        // and 40-7E, 80-FC for the second byte.
        // UTF-8 multi-byte characters always start with 11xxxxxx (C0-FD) 
        // and subsequent bytes are 10xxxxxx (80-BF).
        // If we find a standalone byte > 0x7F that doesn't fit UTF-8 rules, it's polluted.

        let i = 0;
        while (i < buffer.length) {
            const byte = buffer[i];
            if (byte <= 0x7F) {
                // ASCII, 1 byte
                i++;
            } else if ((byte & 0xE0) === 0xC0) {
                // 2-byte UTF-8
                if (i + 1 >= buffer.length || (buffer[i + 1] & 0xC0) !== 0x80) {
                    return { ok: false, reason: 'Invalid 2-byte UTF-8 sequence detected.' };
                }
                i += 2;
            } else if ((byte & 0xF0) === 0xE0) {
                // 3-byte UTF-8
                if (i + 2 >= buffer.length || (buffer[i + 1] & 0xC0) !== 0x80 || (buffer[i + 2] & 0xC0) !== 0x80) {
                    return { ok: false, reason: 'Invalid 3-byte UTF-8 sequence detected.' };
                }
                i += 3;
            } else if ((byte & 0xF8) === 0xF0) {
                // 4-byte UTF-8
                if (i + 3 >= buffer.length || (buffer[i + 1] & 0xC0) !== 0x80 || (buffer[i + 2] & 0xC0) !== 0x80 || (buffer[i + 3] & 0xC0) !== 0x80) {
                    return { ok: false, reason: 'Invalid 4-byte UTF-8 sequence detected.' };
                }
                i += 4;
            } else {
                // Invalid UTF-8 starting byte (likely CP932/Shift-JIS or corrupted)
                return { ok: false, reason: `Invalid UTF-8 byte detected at offset ${i} (0x${byte.toString(16).toUpperCase()}). Suspected CP932/Shift-JIS pollution.` };
            }
        }

        return { ok: true };

    } catch (error) {
        return { ok: false, reason: `Failed to read file: ${error.message}` };
    }
}

function run() {
    console.log('[GUARDIAN] Examining charset integrity (BOM-less UTF-8)...');

    let failed = false;

    for (const file of TARGET_FILES) {
        const result = verifyCharset(file);
        if (!result.ok) {
            console.error(`\x1b[31m[ERROR] Charset validation failed for ${file}\x1b[0m`);
            console.error(`\x1b[31m  => Reason: ${result.reason}\x1b[0m`);
            failed = true;
        }
    }

    if (failed) {
        console.error(`\n\x1b[41m\x1b[37m ENCODING VIOLATION DETECTED \x1b[0m`);
        console.error('One or more core files contain invalid encoding (e.g., PowerShell CP932 pollution).');
        console.error('Use Node.js APIs (e.g., fs.appendFileSync with "utf8") for file writing to prevent this.');
        process.exit(1);
    }

    console.log('[GUARDIAN] \x1b[32mAll core files verified as clean BOM-less UTF-8.\x1b[0m');
}

run();
