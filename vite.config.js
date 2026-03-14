import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

import { VitePWA } from 'vite-plugin-pwa'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {

    return {
        plugins: [
            react(),
            VitePWA({
                registerType: 'autoUpdate',
                manifest: {
                    name: 'RePaper Route',
                    short_name: 'ReRoute',
                    description: '次世代の配車管理プラットフォーム。効率的な配送ルート設計とリアルタイム同期を実現します。',
                    theme_color: '#0f172a',
                    background_color: '#ffffff',
                    display: 'standalone',
                    scope: '/',
                    start_url: '/',
                    orientation: 'portrait',
                    categories: ['business', 'productivity'],
                    screenshots: [
                        {
                            src: 'screenshot-desktop.png',
                            sizes: '1280x720',
                            type: 'image/png',
                            form_factor: 'wide'
                        },
                        {
                            src: 'screenshot-mobile.png',
                            sizes: '750x1334',
                            type: 'image/png'
                        }
                    ],
                    icons: [
                        {
                            src: 'pwa-192x192.png',
                            sizes: '192x192',
                            type: 'image/png'
                        },
                        {
                            src: 'pwa-512x512.png',
                            sizes: '512x512',
                            type: 'image/png'
                        },
                        {
                            src: 'pwa-512x512.png',
                            sizes: '512x512',
                            type: 'image/png',
                            purpose: 'any maskable'
                        }
                    ]
                },
                workbox: {
                    cleanupOutdatedCaches: true,
                    clientsClaim: true,
                    skipWaiting: true
                },
                devOptions: {
                    enabled: true,
                    type: 'module'
                }
            })
        ],
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src'),
            },
            extensions: ['.ts', '.tsx', '.js', '.jsx', '.json']
        },
        test: {
            globals: true,
            environment: 'jsdom',
            setupFiles: './src/test/setup.ts',
        },
        server: {
            host: true, // Listen on all IP addresses (0.0.0.0)
            port: 5173,
            strictPort: true,
            watch: {
                usePolling: true, // Critical for Windows/WSL2 Docker Volumes
            }
        },
    }
})
// restart server
