import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    const isTS = process.env.VITE_APP_MODE === 'TS';

    return {
        plugins: [
            react(),
            {
                name: 'html-transform',
                transformIndexHtml(html) {
                    if (isTS) {
                        return html.replace('/src/main.jsx', '/src-ts/main.tsx');
                    }
                    return html;
                },
            }
        ],
        resolve: {
            alias: {
                '@': path.resolve(__dirname, isTS ? './src-ts' : './src'),
            },
            extensions: isTS ? ['.ts', '.tsx', '.js', '.jsx', '.json'] : ['.js', '.jsx', '.json']
        },
        test: {
            globals: true,
            environment: 'jsdom',
            setupFiles: isTS ? './src-ts/test/setup.ts' : './src/test/setup.js',
        },
    }
})
// restart server
