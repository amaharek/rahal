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
  default: '#DDE7D6',
  'guessed-on-path': '#1F9F72',
  'guessed-off-path': '#64748B',
  start: '#006D77',
  end: '#B26B1B',
  hint: '#2F6FDE',
  'path-country': '#57BF8A',
};

// Dark mode: Vibrant, saturated colors that "glow" against dark backgrounds
const DARK_MAP_COLORS: Record<CountryState, string> = {
  default: '#243244',
  'guessed-on-path': '#34D399',
  'guessed-off-path': '#94A3B8',
  start: '#3BC6CF',
  end: '#FBBF24',
  hint: '#60A5FA',
  'path-country': '#6EE7B7',
};

const LIGHT_HIGH_CONTRAST_MAP_COLORS: Record<CountryState, string> = {
  default: '#E4EBE0',
  'guessed-on-path': '#0F9F6E',
  'guessed-off-path': '#5B6779',
  start: '#005E61',
  end: '#A05D1B',
  hint: '#1E4FBF',
  'path-country': '#2AA876',
};

const DARK_HIGH_CONTRAST_MAP_COLORS: Record<CountryState, string> = {
  default: '#1F2937',
  'guessed-on-path': '#34D399',
  'guessed-off-path': '#94A3B8',
  start: '#2DD4BF',
  end: '#FBBF24',
  hint: '#93C5FD',
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
      oceanBg: isDark ? '#0A1B2D' : '#A7C8E5',
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
