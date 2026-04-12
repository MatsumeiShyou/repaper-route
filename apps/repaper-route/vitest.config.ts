import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      include: ['src/**/*.test.{js,ts,jsx,tsx}', 'src/**/__tests__/**/*.{js,ts,jsx,tsx}'],
      exclude: ['**/tests/e2e/**', '**/tests/vlm/**', '**/node_modules/**'],
      globals: true,
      // environment は各テストファイルまたはディレクトリごとに設定
    }
  })
)
