import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  {
    test: {
      name: 'logic',
      include: ['apps/repaper-route/src/features/logic/**/*.test.{js,ts}'],
      environment: 'node',
      globals: true,
    }
  },
  {
    test: {
      name: 'components',
      include: [
        'apps/repaper-route/src/features/board/**/*.test.{js,ts,jsx,tsx}',
        'apps/repaper-route/src/features/board/__tests__/**/*.{js,ts,jsx,tsx}',
        'apps/repaper-route/src/test/**/*.{test,spec}.{js,ts,jsx,tsx}'
      ],
      // Playwright の tests/ 領域を明示的に除外
      exclude: ['**/tests/e2e/**', '**/tests/vlm/**'],
      environment: 'jsdom',
      globals: true,
      setupFiles: ['apps/repaper-route/src/test/setup.ts'],
    }
  }
])
