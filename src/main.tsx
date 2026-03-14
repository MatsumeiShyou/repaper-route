import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css' // Reuse existing CSS for now
import { registerSW } from 'virtual:pwa-register'

// Register Service Worker
registerSW({ immediate: true })

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
