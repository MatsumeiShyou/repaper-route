import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  'apps/*',
  {
    test: {
      include: ['apps/repaper-route/src/**/*.test.{js,ts,jsx,tsx}'],
      name: 'repaper-route',
      environment: 'jsdom',
      globals: true,
    }
  }
])
