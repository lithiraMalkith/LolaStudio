import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#0D0D0D',
          'bg-hover': '#1A1A1A',
          'surface': '#161616',
          'surface-hover': '#1E1E1E',
          'border': '#2A2A2A',
          'gold': '#C9A84C',
          'gold-muted': '#3D3D24',
          'gold-hover': '#E2C270',
          'muted': '#6B6B6B',
          'text': '#F0EDE8',
          'danger': '#E05252',
          'success': '#4CAF7D',
        },
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'Inter', 'sans-serif'],
        mono: ['var(--font-mono)', 'Fira Code', 'monospace'],
      },
      animation: {
        'spin-slow': 'spin 2s linear infinite',
        'pulse-gold': 'pulse-gold 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'pulse-gold': {
          '0%, 100%': { 'box-shadow': '0 0 0 0 rgba(201, 168, 76, 0.7)' },
          '50%': { 'box-shadow': '0 0 0 10px rgba(201, 168, 76, 0)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
