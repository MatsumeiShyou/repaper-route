import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

/**
 * [SANCTUARY PURGE] (v2.0)
 * ブラウザのハング、SWキャッシュ競合、破損した IndexedDB を物理的に洗浄します。
 * URL に ?purge=true を付与してアクセスすることで発動します。
 */
const runPurgeInternal = async () => {
    console.warn('--- 💀 RADICAL PHYSICAL PURGE INITIATED ---');
    
    try {
        // 1. Service Worker の完全抹消
        if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (const r of registrations) {
                console.log('[PURGE] Unregistering SW:', r.scope);
                await r.unregister();
            }
        }

        // 2. Cache API の消去
        if ('caches' in window) {
            const keys = await caches.keys();
            for (const key of keys) {
                console.log('[PURGE] Deleting Cache:', key);
                await caches.delete(key);
            }
        }

        // 3. IndexedDB の物理的抹殺（動的特定と削除）
        if (window.indexedDB.databases) {
            const dbs = await window.indexedDB.databases();
            for (const db of dbs) {
                if (db.name) {
                    await new Promise((resolve) => {
                        console.log(`[PURGE] Deleting DB: ${db.name}`);
                        const req = indexedDB.deleteDatabase(db.name);
                        req.onsuccess = () => resolve(null);
                        req.onerror = () => resolve(null);
                        req.onblocked = () => resolve(null);
                        setTimeout(() => resolve(null), 1000);
                    });
                }
            }
        }

        // 4. ストレージの「全件」消去
        localStorage.clear();
        sessionStorage.clear();
        console.log('[PURGE] Radical purge complete. Rebooting...');

        window.location.href = window.location.origin + window.location.pathname;
    } catch (e) {
        console.error('[PURGE] Critical error:', e);
        window.location.reload();
    }
};

if (window.location.search.includes('purge=true')) {
    runPurgeInternal();
}

// 疑似 Auth の旧データをパージ（DXOS 統合後の staffs テーブルとの衝突回避）
if (localStorage.getItem('auth-storage')) {
    localStorage.removeItem('auth-storage')
}

// Register New Service Worker (React 19 compatible)
registerSW({ 
    immediate: true,
    onRegistered(r) {
        r && console.log('[DXOS] New v19 Service Worker Registered.')
    }
})

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
