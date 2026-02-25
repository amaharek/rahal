'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import type { ComboMomentum } from '@/types/game';
import { deriveEfficiencyBucket } from '@/lib/game/progression';

interface GameHUDProps {
  streak: number | null;
  guessCount: number;
  combo: number;
  momentum: ComboMomentum;
  /** 'card' = sidebar card with labels (desktop), 'compact' = map overlay (mobile) */
  variant?: 'card' | 'compact';
}

function getMomentumGlyph(momentum: ComboMomentum): string {
  if (momentum === 'up') return '↗';
  if (momentum === 'down') return '↘';
  return '→';
}

export function GameHUD({ streak, guessCount, combo, momentum, variant = 'card' }: GameHUDProps) {
  const t = useTranslations('game.hud');
  const streakValue = streak === null ? '--' : String(streak);
  const momentumClass =
    momentum === 'up'
      ? 'text-success'
      : momentum === 'down'
        ? 'text-error'
        : 'text-text-secondary';

  if (variant === 'compact') {
    return (
      <div
        className="flex items-center justify-center gap-4 bg-surface/95 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg"
        data-testid="game-hud"
      >
        <span className="text-sm font-semibold text-primary">🔥 {streakValue}</span>
        <span className="text-text-muted">·</span>
        <motion.span
          key={guessCount}
          initial={{ y: -6, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="text-sm font-semibold text-primary"
        >
          🎯 {guessCount}
        </motion.span>
        <span className="text-text-muted">·</span>
        <span className={`text-sm font-semibold ${momentumClass}`}>
          ⚡ x{combo} {getMomentumGlyph(momentum)}
        </span>
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-3 gap-3 bg-surface/95 backdrop-blur-sm rounded-xl px-4 py-3 shadow-lg border border-border"
      data-testid="game-hud"
    >
      <div className="flex flex-col items-center gap-0.5" data-testid="hud-streak">
        <span className="text-base">🔥</span>
        <div className="text-xl font-bold text-primary leading-none">{streakValue}</div>
        <div className="text-[10px] text-text-secondary uppercase tracking-wide">{t('streak')}</div>
      </div>
      <div className="flex flex-col items-center gap-0.5" data-testid="hud-guess-count">
        <span className="text-base">🎯</span>
        <motion.span
          key={guessCount}
          initial={{ y: -8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="block text-xl font-bold text-primary leading-none"
        >
          {guessCount}
        </motion.span>
        <div className="text-[10px] text-text-secondary uppercase tracking-wide">
          {t('guesses')}
        </div>
      </div>
      <div className="flex flex-col items-center gap-0.5" data-testid="hud-combo">
        <span className="text-base">⚡</span>
        <div className={`text-xl font-bold leading-none ${momentumClass}`}>
          x{combo} {getMomentumGlyph(momentum)}
        </div>
        <div className="text-[10px] text-text-secondary uppercase tracking-wide">{t('combo')}</div>
      </div>
    </div>
  );
}

export { deriveEfficiencyBucket };
