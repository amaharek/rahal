'use client';

import { useTranslations } from 'next-intl';
import type { RouteMode } from '@/types/game';

function InfoTooltip({ text }: { text: string }) {
  return (
    <span className="relative group/tip hidden sm:inline-flex items-center">
      <span
        className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-current text-[9px] font-bold leading-none cursor-default select-none opacity-60 group-hover/tip:opacity-100"
        aria-label={text}
      >
        !
      </span>
      <span
        className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-44 rounded-md bg-gray-900 px-2 py-1.5 text-[11px] leading-snug text-white shadow-lg
          opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150 z-50 text-center"
        role="tooltip"
      >
        {text}
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
      </span>
    </span>
  );
}

interface ChallengeCountry {
  flag_emoji: string | null;
  name_ar: string;
  name_en: string;
}

interface GameHeaderBarProps {
  startCountry: ChallengeCountry;
  endCountry: ChallengeCountry;
  routeMode: RouteMode;
  onRouteModeChange: (mode: RouteMode) => void;
  getCountryNameByLocale: (c: ChallengeCountry) => string;
  direction: 'rtl' | 'ltr';
}

export function GameHeaderBar({
  startCountry,
  endCountry,
  routeMode,
  onRouteModeChange,
  getCountryNameByLocale,
  direction,
}: GameHeaderBarProps) {
  const t = useTranslations('game.routeModes');

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 bg-surface border-b border-border"
      data-testid="game-header-bar"
    >
      {/* Start country */}
      <span className="flex items-center gap-1 min-w-0 flex-1">
        <span className="text-xl">{startCountry.flag_emoji}</span>
        <span className="text-sm font-medium truncate max-w-[100px] sm:max-w-[140px]">
          {getCountryNameByLocale(startCountry)}
        </span>
      </span>

      <span className="text-text-muted shrink-0 text-lg">{direction === 'rtl' ? '←' : '→'}</span>

      {/* Segmented mode toggle */}
      <div
        className="shrink-0 flex rounded-full border border-border"
        role="group"
        aria-label="Route mode"
      >
        <button
          type="button"
          className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium transition-colors rounded-l-full ${
            routeMode === 'shortest'
              ? 'bg-primary text-white'
              : 'bg-transparent text-text-secondary hover:bg-surface-hover'
          }`}
          onClick={() => onRouteModeChange('shortest')}
          data-testid="route-mode-shortest"
          aria-pressed={routeMode === 'shortest'}
        >
          <span>⚡</span>
          <span className="hidden sm:inline">{t('shortest')}</span>
          <InfoTooltip text={t('shortestDesc')} />
        </button>
        <div className="w-px bg-border" aria-hidden="true" />
        <button
          type="button"
          className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium transition-colors rounded-r-full ${
            routeMode === 'explorer'
              ? 'bg-primary text-white'
              : 'bg-transparent text-text-secondary hover:bg-surface-hover'
          }`}
          onClick={() => onRouteModeChange('explorer')}
          data-testid="route-mode-explorer"
          aria-pressed={routeMode === 'explorer'}
        >
          <span>🧭</span>
          <span className="hidden sm:inline">{t('explorer')}</span>
          <InfoTooltip text={t('explorerDesc')} />
        </button>
      </div>

      <span className="text-text-muted shrink-0 text-lg">{direction === 'rtl' ? '←' : '→'}</span>

      {/* End country */}
      <span className="flex items-center gap-1 min-w-0 flex-1 justify-end">
        <span className="text-sm font-medium truncate max-w-[100px] sm:max-w-[140px]">
          {getCountryNameByLocale(endCountry)}
        </span>
        <span className="text-xl">{endCountry.flag_emoji}</span>
      </span>
    </div>
  );
}
