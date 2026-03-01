import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {

    return {
        plugins: [
            react(),
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
            },
            hmr: {
                clientPort: 5173,
            }
        },
    }
})
// restart server
