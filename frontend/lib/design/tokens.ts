/**
 * Design tokens — single source of truth for all design values.
 * These mirror the CSS custom properties defined in globals.css.
 * Use these in JS/TS contexts (e.g. D3 charts, canvas, dynamic styles).
 */

// ─── Color Palette ──────────────────────────────────────────────────────────

export const colors = {
  // Brand — Primary (Deep Teal)
  primary: {
    DEFAULT: '#0D7377',
    light: '#14919B',
    dark: '#0A5A5E',
    50: '#E6F4F5',
  },

  // Brand — Secondary (Warm Sand)
  secondary: {
    DEFAULT: '#C8956D',
    light: '#D4A574',
    dark: '#B07A52',
  },

  // Accent (Deep Charcoal)
  accent: '#1B2B34',

  // Semantic
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Score emojis
  score: {
    excellent: '#22C55E',  // 🟢
    good: '#EAB308',        // 🟡
    okay: '#F97316',        // 🟠
    far: '#EF4444',         // 🔴
    wrong: '#1E293B',       // ⚫
  },
} as const;

// ─── Light Mode Semantic Colors ──────────────────────────────────────────────

export const lightTheme = {
  background: '#F8F6F3',
  surface: '#FFFFFF',
  border: '#E2DDD7',
  textPrimary: '#1B2B34',
  textSecondary: '#5A6B75',
  textMuted: '#8A9BA5',
} as const;

// ─── Dark Mode Semantic Colors ───────────────────────────────────────────────

export const darkTheme = {
  background: '#0F1419',
  surface: '#1A2329',
  border: '#2A3540',
  textPrimary: '#F0F4F7',
  textSecondary: '#8A9BA5',
  textMuted: '#5A6B75',
} as const;

// ─── Border Radius ───────────────────────────────────────────────────────────

export const radius = {
  sm: '4px',
  DEFAULT: '8px',
  md: '10px',
  lg: '16px',
  xl: '20px',
  '2xl': '24px',
  full: '9999px',
} as const;

// ─── Shadows ─────────────────────────────────────────────────────────────────

export const shadows = {
  xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  DEFAULT: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
} as const;

// ─── Map-specific colors ──────────────────────────────────────────────────────
// Used by useMapColors hook — kept here for reference and JS-only contexts.

export const mapColors = {
  light: {
    default: '#d4cfc9',
    guessedOnPath: '#22c55e',
    guessedOffPath: '#ef4444',
    start: '#0D7377',
    end: '#C8956D',
    hint: '#f59e0b',
    pathCountry: '#86efac',
    ocean: '#cde4ef',
    border: '#b8b0a8',
    hover: '#b8b0a8',
  },
  dark: {
    default: '#374151',
    guessedOnPath: '#16a34a',
    guessedOffPath: '#dc2626',
    start: '#14919B',
    end: '#D4A574',
    hint: '#d97706',
    pathCountry: '#15803d',
    ocean: '#1e3a5f',
    border: '#4b5563',
    hover: '#4b5563',
  },
} as const;

// ─── Scoring constants ────────────────────────────────────────────────────────

export const scoring = {
  baseScore: 1000,
  penaltyPerExtraGuess: 50,
  penaltyPerHint: 100,
  optimalBonus: 200,
} as const;

// ─── Type exports ─────────────────────────────────────────────────────────────

export type ColorToken = keyof typeof colors;
export type ThemeToken = keyof typeof lightTheme;
