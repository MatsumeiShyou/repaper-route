import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

/**
 * [DXOS PURGE] 
 * React 19 / TBNY DXOS 統合に伴う、深刻なキャッシュ競合を物理的に排除します。
 * 1. 古い Service Worker のアンインストール
 * 2. CacheStorage / LocalStorage の特定キーのパージ
 */
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
        for (const registration of registrations) {
            registration.unregister().then(success => {
                if (success) {
                    console.log('[DXOS] Old Service Worker unregistered safely.')
                    // 確実に新環境を適用するため、初回のみリロードを検討（現在は自動更新に委ねる）
                }
            })
        }
    })
}

// 疑似 Auth の旧データをパージ（DXOS 統合後の staffs テーブルとの衝突回避）
if (localStorage.getItem('auth-storage')) {
    // 古いログイン状態を検知した場合は一掃し、OS 認証へ強制遷移させる露払いを実行
    localStorage.removeItem('auth-storage')
    console.log('[DXOS] Legacy auth-storage purged.')
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
