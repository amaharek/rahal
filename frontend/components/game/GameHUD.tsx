'use client';

import { Card, CardContent } from '@/components/ui';
import type { ComboMomentum, EfficiencyBucket } from '@/types/game';
import { deriveEfficiencyBucket } from '@/lib/game/progression';

interface GameHUDProps {
  streak: number | null;
  hintsRemaining: number;
  efficiency: EfficiencyBucket;
  combo: number;
  momentum: ComboMomentum;
  benchmarkDelta: number;
  localeLabel: (key: string) => string;
}

function getMomentumGlyph(momentum: ComboMomentum): string {
  if (momentum === 'up') {
    return '↗';
  }
  if (momentum === 'down') {
    return '↘';
  }
  return '→';
}

function getBenchmarkLabel(benchmarkDelta: number, localeLabel: (key: string) => string): string {
  if (benchmarkDelta === 0) {
    return localeLabel('game.hud.benchmark.optimal');
  }

  if (benchmarkDelta > 0) {
    return `+${benchmarkDelta}`;
  }

  return `${benchmarkDelta}`;
}

export function GameHUD({
  streak,
  hintsRemaining,
  efficiency,
  combo,
  momentum,
  benchmarkDelta,
  localeLabel,
}: GameHUDProps) {
  const streakValue = streak === null ? '--' : String(streak);
  const momentumAnimatedClass =
    momentum === 'up'
      ? 'motion-safe:animate-pulse text-success'
      : momentum === 'down'
        ? 'motion-safe:animate-pulse text-error'
        : 'text-text-secondary';

  return (
    <Card className="mb-3" data-testid="game-hud">
      <CardContent className="py-3">
        <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-5">
          <div data-testid="hud-streak">
            <div className="text-lg font-bold text-primary">{streakValue}</div>
            <div className="text-xs text-text-secondary">{localeLabel('game.hud.streak')}</div>
          </div>
          <div data-testid="hud-hints-remaining">
            <div className="text-lg font-bold text-primary">{hintsRemaining}</div>
            <div className="text-xs text-text-secondary">{localeLabel('game.hud.hints')}</div>
          </div>
          <div data-testid="hud-combo">
            <div className="text-lg font-bold text-primary">x{combo}</div>
            <div className="text-xs text-text-secondary">{localeLabel('game.hud.combo')}</div>
          </div>
          <div data-testid="hud-efficiency-indicator">
            <div className="text-sm font-bold text-primary">{localeLabel(`game.hud.efficiencyLevels.${efficiency}`)}</div>
            <div className="text-xs text-text-secondary">{localeLabel('game.hud.efficiency')}</div>
          </div>
          <div data-testid="hud-benchmark">
            <div className="text-sm font-bold text-primary">{getBenchmarkLabel(benchmarkDelta, localeLabel)}</div>
            <div className="text-xs text-text-secondary">{localeLabel('game.hud.benchmark.label')}</div>
            <div className={`text-xs mt-1 ${momentumAnimatedClass}`} data-testid="hud-momentum-indicator">
              {getMomentumGlyph(momentum)} {localeLabel(`game.hud.momentum.${momentum}`)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export { deriveEfficiencyBucket };
