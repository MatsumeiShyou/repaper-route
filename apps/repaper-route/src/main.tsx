import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
// import { registerSW } from 'virtual:pwa-register' // TODO: re-enable with vite-plugin-pwa

/**
 * [DXOS PURGE] 
 * React 19 / TBNY DXOS 邨ｱ蜷医↓莨ｴ縺・∵ｷｱ蛻ｻ縺ｪ繧ｭ繝｣繝・す繝･遶ｶ蜷医ｒ迚ｩ逅・噪縺ｫ謗帝勁縺励∪縺吶・ * 1. 蜿､縺・Service Worker 縺ｮ繧｢繝ｳ繧､繝ｳ繧ｹ繝医・繝ｫ
 * 2. CacheStorage / LocalStorage 縺ｮ迚ｹ螳壹く繝ｼ縺ｮ繝代・繧ｸ
 */
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
        for (const registration of registrations) {
            registration.unregister().then(success => {
                if (success) {
                    console.log('[DXOS] Old Service Worker unregistered safely.')
                    // 念のため新規読み込みを使用するため、一旦リロードを読み込む（現在は強制更新に依存）
                }
            })
        }
    })
}

// Legacy Auth データをパージ（DXOS統合後は staffs テーブルとの整合回避）
if (localStorage.getItem('auth-storage')) {
    // 古いログイン状態を検知してた場合は一掃し、OS認証へ強制遷移動させる手続きを実行
    localStorage.removeItem('auth-storage')
    console.log('[DXOS] Legacy auth-storage purged.')
}

// Register New Service Worker (React 19 compatible)
// registerSW({  // TODO: re-enable with vite-plugin-pwa
//     immediate: true,
//     onRegistered(r: ServiceWorkerRegistration | undefined) {
//         r && console.log('[DXOS] New v19 Service Worker Registered.')
//     }
// })

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
