'use client';

import { useMemo } from 'react';
import { useEffect, useState } from 'react';
import { useTheme } from '@/components/ThemeProvider';
import type { CountryState } from '@/types/geo';

export interface MapColorPalette {
  colors: Record<CountryState, string>;
  oceanBg: string;
  borderColor: string;
  hoverDefault: string;
}

// Light mode: Atlas pastel palette with modern contrast.
const LIGHT_MAP_COLORS: Record<CountryState, string> = {
  default: '#DDE7D6',            // Soft desaturated land tone
  'guessed-on-path': '#34D399', // Emerald (medium saturation)
  'guessed-off-path': '#94A3B8', // Slate gray (cool, neutral)
  start: '#0D7377',             // Brand teal (professional)
  end: '#D4A574',               // Brand sand-gold (warm accent)
  hint: '#A78BFA',              // Purple (soft)
  'path-country': '#6EE7B7',    // Light emerald (gentle)
};

// Dark mode: Vibrant, saturated colors that "glow" against dark backgrounds
const DARK_MAP_COLORS: Record<CountryState, string> = {
  default: '#2D3748',           // Dark slate (visible but not bright)
  'guessed-on-path': '#10B981', // Bright emerald (vivid green)
  'guessed-off-path': '#64748B', // Medium slate (distinguished)
  start: '#14919B',             // Light teal (brand color brightened)
  end: '#F59E0B',               // Bright amber (high contrast)
  hint: '#8B5CF6',              // Vivid purple (saturated)
  'path-country': '#34D399',    // Emerald green (clear visibility)
};

const LIGHT_HIGH_CONTRAST_MAP_COLORS: Record<CountryState, string> = {
  default: '#E4EBE0',
  'guessed-on-path': '#0F9F6E',
  'guessed-off-path': '#5B6779',
  start: '#005E61',
  end: '#A05D1B',
  hint: '#6D4CD3',
  'path-country': '#2AA876',
};

const DARK_HIGH_CONTRAST_MAP_COLORS: Record<CountryState, string> = {
  default: '#1F2937',
  'guessed-on-path': '#34D399',
  'guessed-off-path': '#94A3B8',
  start: '#2DD4BF',
  end: '#FBBF24',
  hint: '#A78BFA',
  'path-country': '#6EE7B7',
};

export function useMapColors(): MapColorPalette {
  const { resolvedTheme } = useTheme();
  const [prefersHighContrast, setPrefersHighContrast] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-contrast: more)');
    const updatePreference = () => {
      setPrefersHighContrast(mediaQuery.matches);
    };

    updatePreference();
    mediaQuery.addEventListener('change', updatePreference);

    return () => {
      mediaQuery.removeEventListener('change', updatePreference);
    };
  }, []);

  return useMemo(() => {
    const isDark = resolvedTheme === 'dark';
    const colors = isDark
      ? prefersHighContrast
        ? DARK_HIGH_CONTRAST_MAP_COLORS
        : DARK_MAP_COLORS
      : prefersHighContrast
        ? LIGHT_HIGH_CONTRAST_MAP_COLORS
        : LIGHT_MAP_COLORS;

    return {
      colors,
      oceanBg: isDark ? '#0A1929' : '#AFCFE8',
      borderColor: isDark
        ? prefersHighContrast
          ? 'rgba(148, 163, 184, 0.75)'
          : 'rgba(74, 85, 104, 0.6)'
        : prefersHighContrast
          ? 'rgba(15, 23, 42, 0.55)'
          : 'rgba(30, 41, 59, 0.42)',
      hoverDefault: isDark
        ? prefersHighContrast
          ? '#475569'
          : '#374151'
        : prefersHighContrast
          ? '#D2DEC9'
          : '#C8D7C4',
    };
  }, [resolvedTheme, prefersHighContrast]);
}
