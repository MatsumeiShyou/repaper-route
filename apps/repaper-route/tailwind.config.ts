import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontSize: {
        // 高密度 UI 用の極小フォントスケール
        '3xs': ['0.7rem', { lineHeight: '1rem' }],
        '2xs': ['0.8rem', { lineHeight: '1.2rem' }],
      },
      colors: {
        // RePaper Route 標準ブランドカラーの再固定
        brand: {
          slate: '#0f172a',
          emerald: '#10b981',
          rose: '#f43f5e',
        }
      },
      spacing: {
        // 高密度グリッド用調整
        '1.25': '0.3125rem',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      animation: {
        'in': 'fadeIn 0.5s ease-out',
        'pulse-subtle': 'pulseSubtle 3s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        }
      }
    },
  },
  plugins: [],
} satisfies Config
