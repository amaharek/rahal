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
  it('renders streak, guess count, and combo', () => {
    render(
      <GameHUD
        streak={7}
        guessCount={3}
        combo={2}
        momentum="up"
      />
    );

    expect(screen.getByTestId('game-hud')).toBeInTheDocument();
    expect(screen.getByTestId('hud-streak')).toHaveTextContent('7');
    expect(screen.getByTestId('hud-guess-count')).toHaveTextContent('3');
    expect(screen.getByTestId('hud-combo')).toHaveTextContent('x2');
    expect(screen.getByTestId('hud-combo')).toHaveTextContent('↗');
  });

  it('renders fallback streak value when not available', () => {
    render(
      <GameHUD
        streak={null}
        guessCount={0}
        combo={0}
        momentum="steady"
      />
    );

    expect(screen.getByTestId('hud-streak')).toHaveTextContent('--');
    expect(screen.getByTestId('hud-combo')).toHaveTextContent('→');
  });

  it('shows down momentum glyph', () => {
    render(
      <GameHUD
        streak={3}
        guessCount={5}
        combo={1}
        momentum="down"
      />
    );

    expect(screen.getByTestId('hud-combo')).toHaveTextContent('↘');
  });
});
