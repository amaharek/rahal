/** @type {import('tailwindcss').Config} */
module.exports = {
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
        // Primary Colors
        primary: {
          DEFAULT: '#0D7377',
          light: '#14919B',
          dark: '#0A5A5E',
        },
        // Secondary Colors
        secondary: {
          DEFAULT: '#D4A574',
          light: '#E5C49A',
          dark: '#B8885A',
        },
        // Score Colors (Emoji feedback)
        score: {
          excellent: '#2ECC71', // 🟢
          good: '#F1C40F',      // 🟡
          okay: '#E67E22',      // 🟠
          far: '#E74C3C',       // 🔴
          wrong: '#2C3E50',     // ⚫
        },
        // Semantic Colors
        success: '#2ECC71',
        warning: '#F39C12',
        error: '#E74C3C',
        info: '#3498DB',
        // Neutral Colors (using CSS variables for dark mode support)
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        border: 'var(--color-border)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-muted': 'var(--color-text-muted)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
    },
  },
  plugins: [
    require('tailwindcss-rtl'),
  ],
}
