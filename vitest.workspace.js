import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
    {
        name: 'logic',
        test: {
            environment: 'node',
            include: ['src/features/logic/**/*.test.ts'],
            exclude: [
                '**/node_modules/**',
                'tests/vlm/**',
                'tests/e2e/**'
            ],
            alias: {
                '@': './src'
            }
        }
    },
    {
        name: 'ui',
        test: {
            environment: 'jsdom',
            setupFiles: './src/test/setup.ts',
            include: ['src/**/*.test.{ts,tsx}'],
            exclude: [
                'src/features/logic/**/*.test.ts',
                '**/node_modules/**',
                'tests/vlm/**',
                'tests/e2e/**'
            ],
            alias: {
                '@': './src'
            }
        }
    }
]);
