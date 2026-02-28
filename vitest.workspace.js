import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
    {
        name: 'logic',
        test: {
            environment: 'node',
            include: ['src/features/logic/**/*.test.ts'],
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
            exclude: ['src/features/logic/**/*.test.ts'],
            alias: {
                '@': './src'
            }
        }
    }
]);
