import type { Config } from 'tailwindcss'

export default {
  content: [
    './app/**/*.{vue,ts,js}',
    './app/components/**/*.{vue,ts,js}',
    './app/layouts/**/*.{vue,ts,js}',
    './app/pages/**/*.{vue,ts,js}',
  ],
  theme: {
    extend: {
      colors: {
        'farm-deep': '#2F5D3A',
        'farm-leaf': '#4E8B57',
        'market-orange': '#E67E22',
        'farm-yellow': '#D9C84B',
        'farm-light': '#EEF5EE',
        'farm-dark': '#1A3521',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'farm-gradient': 'linear-gradient(135deg, #2F5D3A 0%, #4E8B57 100%)',
        'farm-gradient-dark': 'linear-gradient(135deg, #1A3521 0%, #2F5D3A 100%)',
      },
      maxWidth: {
        page: '1200px',
      },
      boxShadow: {
        'farm-card': '0 2px 16px rgba(47,93,58,0.10)',
        'farm-glow': '0 4px 24px rgba(78,139,87,0.25)',
      },
    },
  },
  plugins: [],
} satisfies Config
