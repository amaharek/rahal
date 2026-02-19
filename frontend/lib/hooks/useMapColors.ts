'use client';

import { useMemo } from 'react';
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

export function useMapColors(): MapColorPalette {
  const { resolvedTheme } = useTheme();

  return useMemo(() => {
    const isDark = resolvedTheme === 'dark';

    return {
      colors: isDark ? DARK_MAP_COLORS : LIGHT_MAP_COLORS,
      oceanBg: isDark ? '#0A1929' : '#AFCFE8',        // Modern atlas-style water
      borderColor: isDark
        ? 'rgba(74, 85, 104, 0.6)'                   // Cool gray with transparency
        : 'rgba(30, 41, 59, 0.42)',                  // Crisper borders for country readability
      hoverDefault: isDark ? '#374151' : '#C8D7C4',  // Hover for unguessed countries
    };
  }, [resolvedTheme]);
}
