/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        void: '#0A0A12',
        plum: '#15121F',
        'plum-light': '#1E1930',
        mist: '#EDEAF6',
        muted: '#9B95B3',
        'dusk-violet': '#7C6FEF',
        'ember-rose': '#E8768F',
        'amber-glow': '#F3B559',
        'teal-quiet': '#5FD3C4',
      },
      fontFamily: {
        display: ['"Fraunces"', 'ui-serif', 'Georgia', 'serif'],
        body: ['"Manrope"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      backgroundImage: {
        'aurora-gradient':
          'radial-gradient(60% 60% at 20% 20%, rgba(124,111,239,0.35) 0%, rgba(124,111,239,0) 60%), ' +
          'radial-gradient(50% 50% at 80% 30%, rgba(232,118,143,0.28) 0%, rgba(232,118,143,0) 60%), ' +
          'radial-gradient(55% 55% at 50% 85%, rgba(243,181,89,0.22) 0%, rgba(243,181,89,0) 60%)',
        'capsule-glow': 'linear-gradient(160deg, rgba(124,111,239,0.9), rgba(232,118,143,0.85), rgba(243,181,89,0.8))',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(20px, -30px) scale(1.05)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(-25px, 25px) scale(1.08)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        breathe: {
          '0%, 100%': { boxShadow: '0 0 40px 0 rgba(124,111,239,0.25)' },
          '50%': { boxShadow: '0 0 70px 10px rgba(232,118,143,0.30)' },
        },
      },
      animation: {
        float: 'float 14s ease-in-out infinite',
        'float-slow': 'float-slow 18s ease-in-out infinite',
        'fade-up': 'fade-up 0.6s ease-out forwards',
        shimmer: 'shimmer 2.5s linear infinite',
        breathe: 'breathe 6s ease-in-out infinite',
      },
      borderRadius: {
        xl2: '1.75rem',
        capsule: '999px',
      },
    },
  },
  plugins: [],
}
