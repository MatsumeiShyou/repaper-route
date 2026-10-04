import { openDB, IDBPDatabase } from 'idb';
import { BoardState } from '../../features/board/hooks/useBoardData';

const DB_NAME = 'repaper-route-offline-cache';
const STORE_NAME = 'board-routes';
const VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

const getDB = () => {
    if (!dbPromise) {
        dbPromise = openDB(DB_NAME, VERSION, {
            upgrade(db) {
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'date' });
                }
            },
        });
    }
    return dbPromise;
};

/**
 * boardStore (Phase 3-4: IndexedDB persistence)
 * Provides methods to save and retrieve board state from local storage.
 */
export const boardStore = {
    async save(date: string, state: BoardState) {
        try {
            const db = await getDB();
            await db.put(STORE_NAME, { date, state, updatedAt: new Date().toISOString() });
            console.log(`[IDB] Saved board for ${date}`);
        } catch (error) {
            console.error('[IDB] Save failed:', error);
        }
    },

    async get(date: string): Promise<BoardState | null> {
        try {
            const db = await getDB();
            const record = await db.get(STORE_NAME, date);
            return record ? record.state : null;
        } catch (error) {
            console.error('[IDB] Get failed:', error);
            return null;
        }
    },

    async clear() {
        try {
            const db = await getDB();
            await db.clear(STORE_NAME);
        } catch (error) {
            console.error('[IDB] Clear failed:', error);
        }
    }
};
