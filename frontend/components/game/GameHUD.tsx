'use client';

import { Card, CardContent } from '@/components/ui';
import type { EfficiencyBucket } from '@/lib/telemetry/gameTelemetry';

interface GameHUDProps {
  streak: number | null;
  hintsRemaining: number;
  efficiency: EfficiencyBucket;
  localeLabel: (key: string) => string;
}

export function deriveEfficiencyBucket(guessesCount: number, shortestPath: number): EfficiencyBucket {
  if (guessesCount === 0) {
    return 'pending';
  }

  const safeShortestPath = Math.max(shortestPath, 1);
  const ratio = safeShortestPath / Math.max(guessesCount, safeShortestPath);

  if (ratio >= 0.9) {
    return 'high';
  }
  if (ratio >= 0.6) {
    return 'medium';
  }
  return 'low';
}

export function GameHUD({ streak, hintsRemaining, efficiency, localeLabel }: GameHUDProps) {
  const streakValue = streak === null ? '--' : String(streak);

  return (
    <Card className="mb-3" data-testid="game-hud">
      <CardContent className="py-3">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div data-testid="hud-streak">
            <div className="text-lg font-bold text-primary">{streakValue}</div>
            <div className="text-xs text-text-secondary">{localeLabel('game.hud.streak')}</div>
          </div>
          <div data-testid="hud-hints-remaining">
            <div className="text-lg font-bold text-primary">{hintsRemaining}</div>
            <div className="text-xs text-text-secondary">{localeLabel('game.hud.hints')}</div>
          </div>
          <div data-testid="hud-efficiency-indicator">
            <div className="text-sm font-bold text-primary">{localeLabel(`game.hud.efficiencyLevels.${efficiency}`)}</div>
            <div className="text-xs text-text-secondary">{localeLabel('game.hud.efficiency')}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
