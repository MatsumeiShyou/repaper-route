const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// --- Configuration ---
const INPUT_DIR = path.resolve(__dirname, '../../_archived/prototypes');
const OUTPUT_FILE = path.resolve(__dirname, '../../supabase/seed_csv_import.sql');

// CSV Files
const FILE_ITEMS = path.join(INPUT_DIR, '回収品目.csv');
const FILE_POINTS = path.join(INPUT_DIR, '回収先DATA - 回収先マスタ.csv');

// --- Helper Functions ---
function parseCsvLine(line) {
    // Simple parser handling quotes. 
    // Note: This is basic. If CSV is complex, use a library.
    // For now, assuming standard quotes or simple split if no quotes.
    const result = [];
    let current = '';
    let inQuote = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuote = !inQuote;
        } else if (char === ',' && !inQuote) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    return result.map(s => s.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
}

function readCsv(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');
    const headers = parseCsvLine(lines[0]);

    return lines.slice(1).map(line => {
        const values = parseCsvLine(line);
        const obj = {};
        headers.forEach((h, i) => {
            obj[h] = values[i] || ''; // Handle missing values at end of line
        });
        return obj;
    });
}

function escapeSql(str) {
    if (str === null || str === undefined) return 'NULL';
    // Replace single quotes with two single quotes
    return `'${String(str).replace(/'/g, "''")}'`;
}

// --- Main Logic ---

function generateSql() {
    console.log('Generating SQL import script...');

    const items = readCsv(FILE_ITEMS);
    const points = readCsv(FILE_POINTS); // "collection points" also contains payee/contractor info

    let sql = `-- Auto-generated CSV Import Script\n`;
    sql += `-- Generated at: ${new Date().toISOString()}\n\n`;

    // 1. Master Items (Upsert by name? No, name isn't unique constraint usually. But let's assume unique names for now)
    // Actually, master_items(id, name, unit)
    // We try to find existing item by name. If not exists, insert.
    sql += `-- 1. Master Items\n`;
    sql += `DO $$\nDECLARE\n  new_id UUID;\nBEGIN\n`;

    items.forEach(item => {
        const name = item['品名'];
        if (!name) return;

        let rawId = item['ID'] || '0';
        // Convert full-width numbers to half-width if present
        rawId = rawId.replace(/[０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
        const displayOrder = parseInt(rawId, 10) || 0;

        // Use a CTE or IF NOT EXISTS logic per item? 
        // Efficient way: INSERT ... ON CONFLICT DO NOTHING (if constraint exists).
        // Since no constraint on name, we use:
        // IF NOT EXISTS (SELECT 1 FROM master_items WHERE name = '...') THEN INSERT ... END IF;

        sql += `  IF NOT EXISTS (SELECT 1 FROM master_items WHERE name = ${escapeSql(name)}) THEN\n`;
        sql += `    INSERT INTO master_items (name, unit, display_order) VALUES (${escapeSql(name)}, 'kg', ${displayOrder});\n`;
        sql += `  END IF;\n`;
    });
    sql += `END $$;\n\n`;


    // 2. Extracts Payees & Contractors
    // Map: PayeeCode -> { name }
    // Map: ContractorCode -> { name, payeeCode }
    const payees = new Map();
    const contractors = new Map();
    const collectionPoints = [];
    const defaults = []; // { customerId, itemName }

    points.forEach(row => {
        // Safe check
        if (!row['回収先ID']) return;

        // Payee
        const payeeCode = row['支払先コード'];
        const payeeName = row['支払先名'];
        if (payeeCode && payeeName) {
            payees.set(payeeCode, payeeName);
        }

        // Contractor
        const contractorCode = row['仕入先コード'];
        const contractorName = row['仕入先名'];
        if (contractorCode && contractorName) {
            contractors.set(contractorCode, { name: contractorName, payee: payeeCode });
        }

        // Collection Point
        collectionPoints.push({
            id: row['回収先ID'],
            name: row['回収先１'], // Main Name
            address: row['住所･その他１'] || row['住所･その他２'] || null, // Combine? Just take address1 for now.
            name_sub: row['回収先２'], // Maybe put in Note
            contractorCode: contractorCode || null,
            note: [row['回収先２'], row['備考']].filter(Boolean).join(' / ')
        });

        // Items (Defaults)
        ['品目１', '品目２', '品目３'].forEach(key => {
            const val = row[key];
            if (val) {
                defaults.push({ customerId: row['回収先ID'], itemName: val });
            }
        });
    });

    // SQL: Payees
    sql += `-- 2. Master Payees\n`;
    payees.forEach((name, code) => {
        sql += `INSERT INTO master_payees (payee_id, name) VALUES (${escapeSql(code)}, ${escapeSql(name)}) ON CONFLICT (payee_id) DO UPDATE SET name = EXCLUDED.name;\n`;
    });
    sql += `\n`;

    // SQL: Contractors
    sql += `-- 3. Master Contractors\n`;
    contractors.forEach((data, code) => {
        // payee_id might be null or valid. referencing master_payees(payee_id).
        // if payee_id is missing in payees (e.g. empty string in CSV), set NULL.
        let pCode = data.payee ? escapeSql(data.payee) : 'NULL';
        if (data.payee && !payees.has(data.payee)) {
            // Does payee exist? If logic above extracted it, yes. If CSV has contractor with ONE-WAY link to non-existent payee?
            // Assuming consistency. If payee missing, use NULL to avoid FK error.
            // Actually, check map.
            if (!payees.has(data.payee)) pCode = 'NULL';
        }

        sql += `INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES (${escapeSql(code)}, ${escapeSql(data.name)}, ${pCode}) ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;\n`;
    });
    sql += `\n`;

    // SQL: Collection Points
    sql += `-- 4. Master Collection Points\n`;
    collectionPoints.forEach(cp => {
        let cCode = cp.contractorCode ? escapeSql(cp.contractorCode) : 'NULL';
        // Validate contractor FK?
        // If contractor not in map, might fail. 
        if (cp.contractorCode && !contractors.has(cp.contractorCode)) cCode = 'NULL';

        sql += `INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES (${escapeSql(cp.id)}, ${escapeSql(cp.name)}, ${escapeSql(cp.address)}, ${cCode}, ${escapeSql(cp.note)}) ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;\n`;
    });
    sql += `\n`;

    // SQL: Customer Item Defaults
    sql += `-- 5. Customer Item Defaults\n`;
    sql += `DO $$\nDECLARE\n  target_item_id UUID;\nBEGIN\n`;
    defaults.forEach(d => {
        // Lookup item ID by name
        // INSERT INTO customer_item_defaults ...
        // We use a block to look it up.
        // Or simpler: INSERT ... SELECT id FROM master_items WHERE name = ...

        // Sanitize itemName for query
        const safeName = escapeSql(d.itemName);

        sql += `  target_item_id := (SELECT id FROM master_items WHERE name = ${safeName} LIMIT 1);\n`;
        sql += `  IF target_item_id IS NOT NULL THEN\n`;
        sql += `    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES (${escapeSql(d.customerId)}, target_item_id) ON CONFLICT DO NOTHING;\n`;
        sql += `  END IF;\n`;
    });
    sql += `END $$;\n`;

    // Write file
    fs.writeFileSync(OUTPUT_FILE, sql);
    console.log(`Generated SQL to ${OUTPUT_FILE}`);
}

generateSql();
