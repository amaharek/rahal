import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GameActionDock } from '@/components/game/GameActionDock';

vi.mock('@/components/game/CountryInput', () => ({
  CountryInput: ({ onFocusStart, onCountryCommitted, onSelect, disabled }: any) => (
    <div>
      <button
        type="button"
        data-testid="mock-focus"
        onClick={() => onFocusStart?.()}
      >
        Focus
      </button>
      <button
        type="button"
        data-testid="mock-commit"
        disabled={disabled}
        onClick={() => {
          onCountryCommitted?.('EGY');
          onSelect?.({
            id: '1',
            code: 'EGY',
            name_ar: 'مصر',
            name_en: 'Egypt',
            flag_emoji: '🇪🇬',
          });
        }}
      >
        Commit
      </button>
    </div>
  ),
}));

describe('GameActionDock', () => {
  it('triggers input and commit callbacks', async () => {
    const user = userEvent.setup();
    const onCountrySelect = vi.fn();
    const onInputFocusStart = vi.fn();
    const onCountryCommitted = vi.fn();
    const onHintRequest = vi.fn();

    render(
      <GameActionDock
        onCountrySelect={onCountrySelect}
        onInputFocusStart={onInputFocusStart}
        onCountryCommitted={onCountryCommitted}
        onHintRequest={onHintRequest}
        hintDisabled={false}
        hintPending={false}
        disabled={false}
        placeholder="game.enterCountry"
        hintLabel="game.nextHint"
      />
    );

    await user.click(screen.getByTestId('mock-focus'));
    await user.click(screen.getByTestId('mock-commit'));

    expect(onInputFocusStart).toHaveBeenCalledTimes(1);
    expect(onCountryCommitted).toHaveBeenCalledWith('EGY');
    expect(onCountrySelect).toHaveBeenCalledTimes(1);
  });

  it('disables hint action when unavailable', () => {
    render(
      <GameActionDock
        onCountrySelect={vi.fn()}
        onInputFocusStart={vi.fn()}
        onCountryCommitted={vi.fn()}
        onHintRequest={vi.fn()}
        hintDisabled
        hintPending={false}
        disabled={false}
        placeholder="game.enterCountry"
        hintLabel="game.nextHint"
      />
    );

    expect(screen.getByTestId('game-hint-button')).toBeDisabled();
  });
});
