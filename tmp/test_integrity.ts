
import { serializeMasterData, normalizeDays } from '../src/utils/serialization';

// Mock MasterField
const mockFields = [
    { name: 'collection_days', label: '曜日設定', type: 'days' }
];

async function verifyFix() {
    console.log('--- [Positive Proof] Data Chain Integrity Test ---');

    console.log('\n[Scenario 1] Loading from DB (Object -> Array)');
    const dbInput = { mon: true, wed: true, thu: false };
    const normalized = normalizeDays(dbInput);
    console.log('DB Input:', JSON.stringify(dbInput));
    console.log('Normalized (UI Format):', JSON.stringify(normalized));
    
    const expectedLoad = ['Mon', 'Wed'];
    const loadOk = JSON.stringify(normalized.sort()) === JSON.stringify(expectedLoad.sort());
    console.log(`Load Test: ${loadOk ? 'PASS' : 'FAIL'}`);

    console.log('\n[Scenario 2] Saving to DB (Array -> Object)');
    const uiInput = { collection_days: ['Fri', 'Sun', 'Mon1'] };
    const serialized = serializeMasterData(uiInput, mockFields as any, 'master_collection_points');
    console.log('UI Input:', JSON.stringify(uiInput.collection_days));
    console.log('Serialized (DB Format):', JSON.stringify(serialized.collection_days, null, 2));

    const s = serialized.collection_days;
    const saveOk = s.fri === true && s.sun === true && s.mon1 === true && s.tue === false;
    console.log(`Save Test: ${saveOk ? 'PASS' : 'FAIL'}`);

    console.log('\n[Scenario 3] Compatibility with PeriodicJobImporter');
    const dayKey = 'fri'; // Target: Friday
    const isFound = !!s[dayKey];
    console.log(`Importer Detection for Friday: ${isFound}`);
    console.log(`Compatibility Test: ${isFound ? 'PASS' : 'FAIL'}`);

    if (loadOk && saveOk && isFound) {
        console.log('\n>>> [CONCLUSION] Data Chain is RESTORED.');
        console.log('>>> Standardized Object format is maintained for the Importer while UI gets its Array.');
    } else {
        console.log('\n>>> ERROR: Integrity test FAILED.');
        process.exit(1);
    }
}

verifyFix();
