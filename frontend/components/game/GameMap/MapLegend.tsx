'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { MAP_COLORS } from '@/types/geo';
import type { MapLegendProps } from '@/types/geo';

const LEGEND_ITEMS = [
  { state: 'start', labelKey: 'game.map.start' },
  { state: 'end', labelKey: 'game.map.end' },
  { state: 'path-country', labelKey: 'game.map.pathCountry' },
  { state: 'guessed-on-path', labelKey: 'game.map.onPath' },
  { state: 'guessed-off-path', labelKey: 'game.map.offPath' },
] as const;

export function MapLegend({ className }: MapLegendProps) {
  const t = useTranslations();

  return (
    <div
      className={cn(
        'absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-md z-10',
        className
      )}
    >
      <div className="space-y-2">
        {LEGEND_ITEMS.map(({ state, labelKey }) => (
          <div key={state} className="flex items-center gap-2 text-sm">
            <div
              className="w-4 h-4 rounded-sm border border-gray-300"
              style={{ backgroundColor: MAP_COLORS[state] }}
            />
            <span className="text-text-secondary">{t(labelKey)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
