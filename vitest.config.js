import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    exclude: [
      'tests/vlm/**/*',
      'tests/e2e/**/*',
      'node_modules/**/*',
      'pg_fix/**/*'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.test.{js,jsx}',
        '**/*.config.js',
        'dist/',
      ],
    },
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
