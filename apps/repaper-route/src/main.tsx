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
    console.warn('[PURGE] Sanctuary Purge Protocol Initiated...');
    
    // 1. Service Worker の完全抹消
    if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const r of registrations) {
            await r.unregister();
            console.log('[PURGE] Unregistered Service Worker');
        }
    }

    // 2. Cache API の消去
    if ('caches' in window) {
        const keys = await caches.keys();
        for (const key of keys) {
            await caches.delete(key);
            console.log(`[PURGE] Deleted Cache: ${key}`);
        }
    }

    // 3. IndexedDB の削除 (dxos-auth-db 等)
    // 注意: 具体的な DB 名が不明な場合も想定し、一般的な名前を試行
    const dbs = ['dxos-auth-db', 'keyval-store', 'workbox-precache-v2'];
    for (const dbName of dbs) {
        window.indexedDB.deleteDatabase(dbName);
        console.log(`[PURGE] Deleted IndexedDB: ${dbName}`);
    }

    // 4. ストレージの全消去
    localStorage.clear();
    sessionStorage.clear();
    console.log('[PURGE] LocalStorage/SessionStorage cleared.');

    alert('Sanctuary Purge Complete. The page will reload in a clean state.');
    window.location.href = window.location.origin + window.location.pathname;
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
