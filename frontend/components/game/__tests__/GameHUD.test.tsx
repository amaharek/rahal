import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GameHUD, deriveEfficiencyBucket } from '@/components/game/GameHUD';

describe('deriveEfficiencyBucket', () => {
  it('returns pending before first guess', () => {
    expect(deriveEfficiencyBucket(0, 4)).toBe('pending');
  });

  it('returns high when close to shortest path', () => {
    expect(deriveEfficiencyBucket(4, 4)).toBe('high');
  });

  it('returns medium in middle range', () => {
    expect(deriveEfficiencyBucket(6, 4)).toBe('medium');
  });

  it('returns low when guesses are far from shortest path', () => {
    expect(deriveEfficiencyBucket(10, 4)).toBe('low');
  });
});

describe('GameHUD', () => {
  it('renders streak, hints, and efficiency indicator', () => {
    const localeLabel = (key: string) => key;

    render(
      <GameHUD
        streak={7}
        hintsRemaining={2}
        efficiency="medium"
        combo={3}
        momentum="up"
        benchmarkDelta={1}
        localeLabel={localeLabel}
      />
    );

    expect(screen.getByTestId('game-hud')).toBeInTheDocument();
    expect(screen.getByTestId('hud-streak')).toHaveTextContent('7');
    expect(screen.getByTestId('hud-hints-remaining')).toHaveTextContent('2');
    expect(screen.getByTestId('hud-combo')).toHaveTextContent('x3');
    expect(screen.getByTestId('hud-efficiency-indicator')).toHaveTextContent('game.hud.efficiencyLevels.medium');
    expect(screen.getByTestId('hud-benchmark')).toHaveTextContent('+1');
    expect(screen.getByTestId('hud-momentum-indicator')).toHaveTextContent('game.hud.momentum.up');
  });

  it('renders fallback streak value when not available', () => {
    const localeLabel = (key: string) => key;

    render(
      <GameHUD
        streak={null}
        hintsRemaining={3}
        efficiency="pending"
        combo={0}
        momentum="steady"
        benchmarkDelta={0}
        localeLabel={localeLabel}
      />
    );

    expect(screen.getByTestId('hud-streak')).toHaveTextContent('--');
  });
});
