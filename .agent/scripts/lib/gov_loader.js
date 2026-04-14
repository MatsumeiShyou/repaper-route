import fs from 'fs';
import path from 'path';

/**
 * AGENTS.md §N: Governance Alignment Protocol Enforcement
 * Logic Key: 'PROTOCOL_ERROR'
 */
export class ProtocolError extends Error {
    constructor(message, fixCommand = null) {
        super(message);
        this.name = 'ProtocolError';
        this.fixCommand = fixCommand;
    }

    /**
     * Trigger Hard Crash with standardized protocol output
     */
    static crash(message, fixCommand = null) {
        console.error('\n🚫───────────── [ PROTOCOL VIOLATION ] ─────────────🚫');
        console.error(`❌ CRITICAL ERROR: ${message}`);
        console.error('   → AGENTS.md §N: 統治整合性違反によりプロセスを強制終了します。');
        if (fixCommand) {
            console.error(`   → [FIX_REQUIRED]: ${fixCommand}`);
        }
        console.error('🚫──────────────────────────────────────────────────🚫\n');
        process.exit(1);
    }
}

/**
 * AGENTS.md §P: Dynamic Root Alignment
 * Finds the project root by searching upwards for the '.agent' marker directory or 'AGENTS.md'.
 */
export function findProjectRoot(startDir = process.cwd()) {
    let current = path.resolve(startDir);
    while (current !== path.parse(current).root) {
        if (fs.existsSync(path.join(current, '.agent')) || fs.existsSync(path.join(current, 'AGENTS.md'))) {
            return current;
        }
        current = path.dirname(current);
    }
    // AGENTS.md §N: Zero-Fallback
    ProtocolError.crash(
        `Project root not found (missing AGENTS.md or .agent). Searched up from: ${startDir}`,
        "Ensure you are running from within the repository."
    );
}

export const PROJECT_ROOT = findProjectRoot();
const cache = new Map();

/**
 * readJsonStrict: Enforces Zero-Fallback and Traceability Log
 */
export function readJsonStrict(filePath, logicKey, fixCommand = null) {
    // AGENTS.md §N: Path Resilience (Rev 4.1 Sync)
    const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(PROJECT_ROOT, filePath);

    if (cache.has(absolutePath)) {
        return cache.get(absolutePath);
    }

    if (!fs.existsSync(absolutePath)) {
        ProtocolError.crash(`Governance data missing: ${absolutePath} (Required for Logic: ${logicKey})`, fixCommand);
    }

    try {
        const content = fs.readFileSync(absolutePath, 'utf8');
        const data = JSON.parse(content);

        // Traceability Log (§N)
        console.log(`[TRACE] Logic [${logicKey}] accessed data from ${path.basename(absolutePath)}`);

        cache.set(absolutePath, data);
        return data;
    } catch (e) {
        ProtocolError.crash(`Corrupt governance data: ${absolutePath} - ${e.message}`, fixCommand);
    }
}
