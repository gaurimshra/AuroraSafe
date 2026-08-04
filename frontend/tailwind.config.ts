import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0f',
        surface: '#0d0d1a',
        card: '#111128',
        border: 'rgba(255,255,255,0.1)',
        primary: { DEFAULT: '#6366f1', light: '#818cf8', dark: '#4f46e5' },
        accent: { DEFAULT: '#06b6d4', light: '#22d3ee' },
        danger: { DEFAULT: '#ef4444', light: '#f87171' },
        warning: { DEFAULT: '#f59e0b', light: '#fbbf24' },
        safe: { DEFAULT: '#22c55e', light: '#4ade80' },
        text: { primary: '#f1f5f9', secondary: '#94a3b8', muted: '#475569' },
      },
      fontFamily: { sans: ['Inter', 'sans-serif'] },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
