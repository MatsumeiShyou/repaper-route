import { openDB, IDBPDatabase } from 'idb';
import { Staff } from './types';

const DB_NAME = 'dxos-auth-db';
const STORE_NAME = 'auth-cache';
const VERSION = 1;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

let dbPromise: Promise<IDBPDatabase> | null = null;

const getDB = () => {
    if (!dbPromise) {
        dbPromise = openDB(DB_NAME, VERSION, {
            upgrade(db) {
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                }
            },
        });
    }
    return dbPromise;
};

/**
 * authStore (Phase 1.4-1.6: IDB persistence)
 * Provides methods to save and retrieve staff information for offline auth.
 */
export const authStore = {
    async saveStaff(staff: Staff) {
        try {
            const db = await getDB();
            await db.put(STORE_NAME, { 
                ...staff, 
                cachedAt: new Date().toISOString() 
            });
            console.log(`[AuthStore] Saved staff: ${staff.name}`);
        } catch (error) {
            console.error('[AuthStore] Save failed:', error);
        }
    },

    async saveStaffs(staffs: Staff[]) {
        try {
            const db = await getDB();
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const now = new Date().toISOString();
            
            for (const staff of staffs) {
                await store.put({ 
                    ...staff, 
                    cachedAt: now 
                });
            }
            await tx.done;
            console.log(`[AuthStore] Saved ${staffs.length} staffs to cache`);
        } catch (error) {
            console.error('[AuthStore] Batch save failed:', error);
        }
    },

    async getStaff(id: string): Promise<Staff | null> {
        try {
            const db = await getDB();
            const record = await db.get(STORE_NAME, id);
            if (!record) return null;

            // TTL チェック
            const cachedAt = new Date(record.cachedAt).getTime();
            const now = new Date().getTime();
            if (now - cachedAt > CACHE_TTL) {
                console.warn(`[AuthStore] Cache expired for ${id}`);
                return null;
            }

            return record;
        } catch (error) {
            console.error('[AuthStore] Get failed:', error);
            return null;
        }
    },

    async listStaffs(): Promise<Staff[]> {
        try {
            const db = await getDB();
            return await db.getAll(STORE_NAME);
        } catch (error) {
            console.error('[AuthStore] List failed:', error);
            return [];
        }
    },

    async clear() {
        try {
            const db = await getDB();
            await db.clear(STORE_NAME);
            // [Zero-Residue] LocalStorage レガシー残渣の物理パージ
            localStorage.removeItem('repaper_auth_user');
            console.log('[AuthStore] Cache and legacy storage purged');
        } catch (error) {
            console.error('[AuthStore] Clear failed:', error);
        }
    }
};
