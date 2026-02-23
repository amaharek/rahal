import type { Config } from 'tailwindcss';
import { radius, shadows, spacing } from './lib/design/tokens';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        arabic: ['IBM Plex Sans Arabic', 'Noto Sans Arabic', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      colors: {
        // Colors use CSS custom properties for runtime dark/light mode theming.
        // Actual values live in globals.css; hex references are in lib/design/tokens.ts.
        primary: {
          DEFAULT: 'var(--color-primary)',
          light: 'var(--color-primary-light)',
          dark: 'var(--color-primary-dark)',
          50: 'var(--color-primary-50)',
        },
        secondary: {
          DEFAULT: 'var(--color-secondary)',
          light: 'var(--color-secondary-light)',
          dark: 'var(--color-secondary-dark)',
        },
        accent: 'var(--color-accent)',
        score: {
          excellent: 'var(--color-score-excellent)',
          good: 'var(--color-score-good)',
          okay: 'var(--color-score-okay)',
          far: 'var(--color-score-far)',
          wrong: 'var(--color-score-wrong)',
        },
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',
        info: 'var(--color-info)',
        background: 'var(--color-background)',
        surface: {
          DEFAULT: 'var(--color-surface)',
          raised: 'var(--color-surface-raised)',
        },
        border: {
          DEFAULT: 'var(--color-border)',
          light: 'var(--color-border-light)',
        },
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-muted': 'var(--color-text-muted)',
      },
      borderRadius: radius,
      spacing,
      boxShadow: {
        xs: shadows.xs,
        sm: shadows.sm,
        md: shadows.md,
        lg: shadows.lg,
        xl: shadows.xl,
      },
    },
  },
  plugins: [
    require('tailwindcss-rtl'),
  ],
};

export default config;
