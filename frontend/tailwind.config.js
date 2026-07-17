/** @type {import('tailwindcss').Config} */

// Reads a "R G B" CSS variable (see :root in index.css) and produces a color
// function that still supports Tailwind's opacity modifiers, e.g. bg-mist/40.
function withOpacity(variableName) {
  return ({ opacityValue }) => {
    if (opacityValue !== undefined) {
      return `rgb(var(${variableName}) / ${opacityValue})`
    }
    return `rgb(var(${variableName}))`
  }
}

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // -- Mood Capsule "coffee house" design tokens --------------------
        // Surfaces
        void: withOpacity('--color-bg'), // page background (warm paper)
        plum: withOpacity('--color-bg-secondary'), // secondary background
        'plum-light': withOpacity('--color-surface'), // card surface
        'secondary-bg': withOpacity('--color-bg-secondary'),

        // Text
        mist: withOpacity('--color-text-primary'),
        muted: withOpacity('--color-text-secondary'),
        'primary-text': withOpacity('--color-text-primary'),
        'secondary-text': withOpacity('--color-text-secondary'),

        // Accents (kept under their original token names so no component
        // markup has to change — only the values they resolve to)
        'dusk-violet': withOpacity('--color-accent-primary'), // coffee brown
        'ember-rose': withOpacity('--color-accent-highlight'), // muted mocha
        'amber-glow': withOpacity('--color-accent-secondary'), // warm latte
        'teal-quiet': withOpacity('--color-accent-highlight'), // muted mocha

        // Borders
        'lavender-border': withOpacity('--color-border'),

        // Buttons — deliberately separate from the accent tokens above so
        // CTAs can run deeper without changing the (protected) message
        // bubble / avatar color.
        coffee: withOpacity('--color-button'),

        // Status
        success: withOpacity('--color-success'),
        warning: withOpacity('--color-warning'),
        error: withOpacity('--color-error'),
      },
      fontFamily: {
        display: ['"Fraunces"', 'ui-serif', 'Georgia', 'serif'],
        body: ['"Manrope"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      backgroundImage: {
        // Soft warm wash — used sparingly, never as a button fill.
        'aurora-gradient':
          'radial-gradient(60% 60% at 20% 20%, rgba(166,124,82,0.10) 0%, rgba(166,124,82,0) 60%), ' +
          'radial-gradient(50% 50% at 80% 30%, rgba(201,168,124,0.10) 0%, rgba(201,168,124,0) 60%)',
        'capsule-glow': 'linear-gradient(160deg, rgba(166,124,82,0.9), rgba(141,110,99,0.85), rgba(201,168,124,0.72))',
      },
      boxShadow: {
        soft: '0 10px 28px rgba(63,46,36,0.14)',
        warm: '0 6px 22px rgba(111,78,55,0.30)',
        lift: '0 16px 40px rgba(63,46,36,0.20)',
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
          '0%, 100%': { boxShadow: '0 0 28px 0 rgba(166,124,82,0.16)' },
          '50%': { boxShadow: '0 0 44px 4px rgba(201,168,124,0.14)' },
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
        xl2: '2rem',
        capsule: '999px',
      },
    },
  },
  plugins: [],
}