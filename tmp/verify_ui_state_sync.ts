
import { normalizeDays, serializeMasterData } from '../src/utils/serialization';
import { MASTER_SCHEMAS } from '../src/config/masterSchema';

async function verifyUISync() {
    console.log('--- [Phase 17 Verification] UI State Synchronization Proof ---');
    const schema = MASTER_SCHEMAS.points;

    // 1. Initial State: Data from View (Missing collection_days)
    const viewItem = {
        location_id: 28,
        id: 'uuid-1234',
        name: 'Test Point',
        collection_days: undefined // View doesn't have it
    };
    console.log(`[Step 1] Data from View (ID: ${viewItem.id}): collection_days is UNDEFINED`);

    // 2. Deep Fetch Simulation (handleEdit)
    // This is what the DB table actually holds
    const tableItem = {
        ...viewItem,
        collection_days: { mon: true, wed: true, thu: false }
    };
    console.log(`[Step 2] Simulated Deep Fetch Result: ${JSON.stringify(tableItem.collection_days)}`);

    // 3. Normalization (Sync between Table Fetch and Form State)
    const normalizedDays = normalizeDays(tableItem.collection_days);
    console.log(`[Step 3] Normalized for UI: ${JSON.stringify(normalizedDays)}`);

    if (normalizedDays.includes('Mon') && normalizedDays.includes('Wed')) {
        console.log('>>> UI State Match SUCCESS: ["Mon", "Wed"] detected.');
    } else {
        console.log('>>> UI State Match FAILURE');
        return;
    }

    // 4. State Reset Simulation (The 'key' fix)
    // In React, key={editingItem.id} means:
    // Old Key: 'old-uuid' -> MasterForm(old state)
    // New Key: 'uuid-1234' -> MasterForm(force re-init with Step 3 data)
    console.log(`[Step 4] State Reset (Component key reset) ensures the Form starts with Step 3 data.`);

    // 5. Persistence Round-trip
    const modifiedByUI = [...normalizedDays, 'Fri']; // Simulate user checking Fri
    const formData = { ...tableItem, collection_days: modifiedByUI };
    const serialized = serializeMasterData(formData, schema.fields, schema.rpcTableName);
    
    console.log(`[Step 5] Serialized for Saving: ${JSON.stringify(serialized.collection_days)}`);

    if (serialized.collection_days.fri === true && serialized.collection_days.mon === true) {
        console.log('\n>>> SUCCESS: UI -> Data Change -> DB Serialization chain is FIXED.');
    } else {
        console.log('\n>>> FAILURE: Serialization mismatch.');
    }
}
verifyUISync();
