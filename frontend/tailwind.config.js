/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        void: '#F8F5FB',
        plum: '#F1ECF7',
        'plum-light': '#FFFFFF',
        mist: '#4D4758',
        muted: '#7E778A',
        'dusk-violet': '#C7B8E8',
        'ember-rose': '#BCAEE0',
        'amber-glow': '#AFC7E8',
        'teal-quiet': '#AFC7E8',
        'secondary-bg': '#F1ECF7',
        'primary-text': '#4D4758',
        'secondary-text': '#7E778A',
        'lavender-border': '#E3DCEF',
      },
      fontFamily: {
        display: ['"Fraunces"', 'ui-serif', 'Georgia', 'serif'],
        body: ['"Manrope"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      backgroundImage: {
        'aurora-gradient':
          'radial-gradient(60% 60% at 20% 20%, rgba(199,184,232,0.25) 0%, rgba(199,184,232,0) 60%), ' +
          'radial-gradient(50% 50% at 80% 30%, rgba(175,199,232,0.14) 0%, rgba(175,199,232,0) 60%)',
        'capsule-glow': 'linear-gradient(160deg, rgba(199,184,232,0.9), rgba(188,174,224,0.85), rgba(175,199,232,0.72))',
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
          '0%, 100%': { boxShadow: '0 0 32px 0 rgba(199,184,232,0.22)' },
          '50%': { boxShadow: '0 0 52px 6px rgba(175,199,232,0.18)' },
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
        xl2: '1.875rem',
        capsule: '999px',
      },
    },
  },
  plugins: [],
}
