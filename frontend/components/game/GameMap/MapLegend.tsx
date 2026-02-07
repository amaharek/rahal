'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { useMapColors } from '@/lib/hooks/useMapColors';
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
  const mapColors = useMapColors();

  return (
    <div
      className={cn(
        'absolute top-4 right-4 bg-surface/90 backdrop-blur-sm rounded-lg p-2 shadow-md z-10 border border-border',
        className
      )}
    >
      <div className="flex items-center gap-4 flex-wrap">
        {LEGEND_ITEMS.map(({ state, labelKey }) => (
          <div key={state} className="flex items-center gap-1.5 text-xs">
            <div
              className="w-3 h-3 rounded-sm border"
              style={{
                backgroundColor: mapColors.colors[state],
                borderColor: mapColors.borderColor,
              }}
            />
            <span className="text-text-secondary whitespace-nowrap">{t(labelKey)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
