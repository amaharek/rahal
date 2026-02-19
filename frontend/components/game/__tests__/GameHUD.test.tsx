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
        localeLabel={localeLabel}
      />
    );

    expect(screen.getByTestId('game-hud')).toBeInTheDocument();
    expect(screen.getByTestId('hud-streak')).toHaveTextContent('7');
    expect(screen.getByTestId('hud-hints-remaining')).toHaveTextContent('2');
    expect(screen.getByTestId('hud-efficiency-indicator')).toHaveTextContent('game.hud.efficiencyLevels.medium');
  });

  it('renders fallback streak value when not available', () => {
    const localeLabel = (key: string) => key;

    render(
      <GameHUD
        streak={null}
        hintsRemaining={3}
        efficiency="pending"
        localeLabel={localeLabel}
      />
    );

    expect(screen.getByTestId('hud-streak')).toHaveTextContent('--');
  });
});
