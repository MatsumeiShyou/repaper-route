/**
 * RePaper Route Backend (Google Apps Script)
 * Serves as Cold Storage (Archive) and Batch Processor.
 * @status: ZERO_COST_ARCH_READY
 */

const SHEET_NAMES = {
  ARCHIVE: 'Archive_Log',
  MASTER_JOBS: '@Daily_Jobs',
  CONFIG: 'Config'
};

function doPost(e) {
  try {
    const jsonString = e.postData.contents;
    const data = JSON.parse(jsonString);
    const { action, payload } = data;

    if (action === 'BATCH_SYNC_LOGS') {
      return handleBatchSync(payload);
    } else if (action === 'CALCULATE_SPLITS') {
      return handleSplitCalculation(payload);
    }
    
    return jsonResponse({ status: 'error', message: 'Unknown action' });

  } catch (error) {
    return jsonResponse({ status: 'error', message: error.toString() });
  }
}

/**
 * Handles batch insertion of event logs into Cold Storage (Sheet).
 */
function handleBatchSync(events) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAMES.ARCHIVE);
  
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAMES.ARCHIVE);
    sheet.appendRow(['Timestamp', 'Actor', 'EventType', 'Payload', 'ClientEventID', 'SyncedAt']);
  }

  const rows = events.map(ev => [
    ev.timestamp,
    ev.actor,
    ev.event_type,
    JSON.stringify(ev.payload),
    ev.client_event_id,
    new Date().toISOString()
  ]);

  // Bulk append for performance (Batch Operation)
  if (rows.length > 0) {
    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow + 1, 1, rows.length, rows[0].length).setValues(rows);
  }

  return jsonResponse({ status: 'success', synced_count: rows.length });
}

/**
 * Mock Split Calculation (Logic to be moved here to keep client light if complex, 
 * BUT Zero-Cost policy prefers Client-Side. Providing for reference/backup.)
 * For now, this just echoes back simple ratios.
 */
function handleSplitCalculation(payload) {
  const { totalWeight, jobs } = payload;
  // TODO: Implement advanced ratio logic based on history if needed.
  // For MVP, client does this. This endpoint might be used for Audit.
  return jsonResponse({ status: 'success', note: 'Calculation handled on client' });
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  return jsonResponse({ status: 'alive', message: 'RePaper Route Backend is running' });
}
