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
        // 6.6 Campaign tokens
        'campaign-matte': '#1e392a',
        'campaign-deep': '#2d5a27',
        'campaign-gold': '#f2994a',
        'campaign-flame': '#e74c3c',
        'campaign-amber': '#f5a623',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'farm-gradient': 'linear-gradient(135deg, #2F5D3A 0%, #4E8B57 100%)',
        'farm-gradient-dark': 'linear-gradient(135deg, #1A3521 0%, #2F5D3A 100%)',
        'campaign-gradient': 'linear-gradient(135deg, #1e392a 0%, #2d5a27 50%, #1e392a 100%)',
      },
      maxWidth: {
        page: '1200px',
      },
      boxShadow: {
        'farm-card': '0 2px 16px rgba(47,93,58,0.10)',
        'farm-glow': '0 4px 24px rgba(78,139,87,0.25)',
        'campaign-glow': '0 0 40px rgba(242,153,74,0.35)',
      },
      animation: {
        'spin-slow': 'spin 4s linear infinite',
        'pulse-gold': 'pulse-gold 2s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s ease-in-out infinite',
        'slide-up': 'slide-up 0.5s ease-out',
        'fade-in': 'fade-in 0.4s ease-out',
        'bounce-in': 'bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'progress-fill': 'progress-fill 1.5s ease-out forwards',
        'countdown-tick': 'countdown-tick 1s ease-in-out infinite',
      },
      keyframes: {
        'pulse-gold': {
          '0%, 100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(242,153,74,0.4)' },
          '50%': { transform: 'scale(1.05)', boxShadow: '0 0 30px 10px rgba(242,153,74,0.2)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'bounce-in': {
          '0%': { opacity: '0', transform: 'scale(0.3)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)' },
        },
        'progress-fill': {
          '0%': { width: '0%' },
          '100%': { width: 'var(--progress-width)' },
        },
        'countdown-tick': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.08)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config
