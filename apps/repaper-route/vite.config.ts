import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vitejs.dev/config/
export default defineConfig({
    envDir: '../../',
    plugins: [
        react(),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    },
    server: {
        host: true,
        port: 5173,
        strictPort: true,
        watch: {
            usePolling: true,
        }
    },
})
