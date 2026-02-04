import { openDB } from 'idb';
import { supabase } from './supabase/client';
import { GasApi } from '../services/gasApi';

const DB_NAME = 'RepaperRouteDB';
const DB_VERSION = 1;
const STORE_NAME = 'event_logs';

/**
 * Initializes the IndexedDB for offline event storage.
 */
async function initDB() {
    return openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'client_event_id' });
                store.createIndex('synced', 'synced');
            }
        },
    });
}

/**
 * Event Repository for SDR (State-Decision-Reason) Architecture.
 * Handles logging events to Supabase with offline fallback to IndexedDB.
 */
export const EventRepository = {
    /**
     * Logs a decision event (Decision) with its reason (Reason) and context (State Snapshot).
     * @param {string} actor - User ID or 'system'
     * @param {string} event_type - e.g., 'JOB_START', 'WEIGHT_INPUT', 'STATUS_CHANGE'
     * @param {object} payload - Details associated with the event
     * @param {object} state_snapshot - Snapshot of the state *before* or *after* this event (optional but recommended)
     */
    async log(actor, event_type, payload = {}, state_snapshot = {}) {
        const event = {
            client_event_id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            actor,
            event_type,
            payload,
            state_snapshot,
            synced: 0 // 0: faluse, 1: true
        };

        // Detect Blob/File in payload for separate handling
        let blobPayload = null;
        if (payload && payload.photo instanceof Blob) {
            blobPayload = payload.photo;
            // Remove Blob from main payload to prevent JSON stringify issues in Supabase (if we sent raw)
            // For IDB, we can store it, but let's keep it clean
            event.payload = { ...payload, photo: 'BLOB_STORED_IN_IDB' };
            event.blob = blobPayload; // Store separately in IDB object
        }

        // 1. Save to Offline DB first (WAL: Write Ahead Log principle for frontend)
        try {
            const db = await initDB();
            await db.put(STORE_NAME, event);
            console.log('[SDR] Event buffered to IDB:', event);
        } catch (e) {
            console.error('[SDR] Failed to save to IDB:', e);
            // Critical failure if IDB fails, but we try to continue to send network req
        }

        // 2. Try to sync to Supabase immediately
        if (navigator.onLine) {
            try {
                const { error } = await supabase
                    .from('event_logs')
                    .insert([{
                        // Mapping to Supabase schema columns
                        event_type: event.event_type,
                        payload: event.payload,
                        actor_id: event.actor, // Assuming 'actor' maps to actor_id column
                        occurred_at: event.timestamp
                        // Note: client_event_id might need a column if we want strict dedup
                    }]);

                if (error) throw error;

                // 3. Mark as synced in IDB
                const db = await initDB();
                event.synced = 1;
                await db.put(STORE_NAME, event);
                console.log('[SDR] Event synced to Supabase:', event.client_event_id);

            } catch (netError) {
                console.warn('[SDR] Network sync failed, keeping in offline buffer:', netError);
            }
        }
    },

    /**
     * Tries to push all unsynced events to Supabase and GAS (Cold Storage).
     * Uses Batch Operation to save API Quota.
     */
    async syncAll() {
        if (!navigator.onLine) return;

        const db = await initDB();
        const unsyncedEvents = await db.getAllFromIndex(STORE_NAME, 'synced', 0);

        if (unsyncedEvents.length === 0) return;

        console.log(`[SDR] Syncing ${unsyncedEvents.length} events...`);

        // 1. Batch Sync to GAS (Cold Storage - Infinite Archive)
        // This is the PRIORITY for logs.
        const gasResult = await GasApi.syncBatch(unsyncedEvents);

        if (gasResult.success) {
            console.log('[SDR] Batch sync to GAS successful');
            // Mark as synced immediately to prevent re-send
            // Note: We might still want to send to Supabase (Hot) for immediate reaction
        } else {
            console.warn('[SDR] GAS Sync failed, will retry later.', gasResult.error);
        }

        // 2. Batch/Loop Sync to Supabase (Hot Storage - Recent Operations)
        // For Supabase, we still use loop or upsert if schema supports it.
        // To be safe with Supabase free limits, we only sync 'KEY' events if needed, 
        // but for now, we sync all to ensure dashboard works.
        const { error } = await supabase
            .from('event_logs')
            .upsert(unsyncedEvents.map(e => ({
                client_event_id: e.client_event_id, // Ensure ID is mapped
                event_type: e.event_type,
                payload: e.payload,
                actor_id: e.actor,
                occurred_at: e.timestamp
            })), { onConflict: 'client_event_id', ignoreDuplicates: true });

        if (!error) {
            // Update local IDB state
            const tx = db.transaction(STORE_NAME, 'readwrite');
            for (const event of unsyncedEvents) {
                event.synced = 1;
                await tx.store.put(event);
            }
            await tx.done;
            console.log('[SDR] All events synced to Supabase & marked local');
        } else {
            console.error('[SDR] Supabase sync failed', error);
        }
    }
};
