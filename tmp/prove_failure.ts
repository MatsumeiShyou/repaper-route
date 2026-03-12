
import { serializeMasterData, normalizeDays } from '../src/utils/serialization';
import { PeriodicJobImporter } from '../src/lib/PeriodicJobImporter';

// Mock MasterField definition for collection_days
const mockFields = [
    { name: 'collection_days', label: '曜日設定', type: 'days' }
];

async function proveFailure() {
    console.log('--- [Negative Proof] Data Chain Integrity Test ---');

    // 1. UI Status (Manual selection of Wednesday)
    const uiData = { collection_days: ['Wed'] };
    console.log('[Step 1] UI Input (Array):', uiData.collection_days);

    // 2. Current Serialization Behavior (BUG: It just passes the array through)
    const serialized = serializeMasterData(uiData, mockFields as any, 'master_collection_points');
    console.log('[Step 2] Current Serialized Output (Stored in DB):', JSON.stringify(serialized.collection_days));

    // 3. Importer Logic (Expects Object: {wed: true})
    console.log('[Step 3] PeriodicJobImporter Logic Check (Target: Wednesday)');
    
    // Simulating the filter logic inside PeriodicJobImporter.ts:37-43
    const dayKey = 'wed'; // Wednesday
    const mockDbRow = { collection_days: serialized.collection_days };
    
    const collectionDays = mockDbRow.collection_days as any;
    let isFound = false;
    if (collectionDays && typeof collectionDays === 'object' && !Array.isArray(collectionDays)) {
        isFound = !!collectionDays[dayKey];
    } else {
        console.warn('!!! FAILED: Importer received an Array instead of an Object !!!');
    }

    console.log(`[Result] Job Found for Wednesday: ${isFound}`);
    
    if (!isFound) {
        console.log('\n>>> [CONCLUSION] Data Chain is BROKEN.');
        console.log('>>> UI Array was stored directly, causing the Importer to fail detection.');
    } else {
        console.log('\n>>> Data Chain is unexpectedly working (Check test logic).');
    }
}

proveFailure();
