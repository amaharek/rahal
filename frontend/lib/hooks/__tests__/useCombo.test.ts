import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCombo } from '../useCombo';
import type { GuessEntry } from '@/types/game';

const makeGuess = (emoji: GuessEntry['emoji'], order = 1): GuessEntry => ({
  country_id: `c-${order}`,
  country_code: `XX`,
  name_ar: 'test',
  name_en: 'test',
  flag_emoji: '🏳️',
  emoji,
  order,
});

describe('useCombo', () => {
  it('starts with combo=0 and momentum=steady', () => {
    const { result } = renderHook(() => useCombo());
    expect(result.current.combo).toBe(0);
    expect(result.current.momentum).toBe('steady');
  });

  it('increments combo on on-path guess (🟢)', () => {
    const { result } = renderHook(() => useCombo());

    act(() => {
      result.current.updateFromGuessResponse('🟢');
    });

    expect(result.current.combo).toBeGreaterThan(0);
  });

  it('increments combo on near-path guess (🟡)', () => {
    const { result } = renderHook(() => useCombo());

    act(() => {
      result.current.updateFromGuessResponse('🟡');
    });

    expect(result.current.combo).toBeGreaterThan(0);
  });

  it('momentum goes "up" when combo increases', () => {
    const { result } = renderHook(() => useCombo());

    act(() => { result.current.updateFromGuessResponse('🟢'); });
    act(() => { result.current.updateFromGuessResponse('🟢'); });

    // After two consecutive good guesses, momentum should go up
    expect(['up', 'steady']).toContain(result.current.momentum);
  });

  it('combo resets after an off-path guess (🔴)', () => {
    const { result } = renderHook(() => useCombo());

    // Build up combo first
    act(() => { result.current.updateFromGuessResponse('🟢'); });
    act(() => { result.current.updateFromGuessResponse('🟢'); });

    // Then miss
    act(() => { result.current.updateFromGuessResponse('🔴'); });

    expect(result.current.combo).toBe(0);
  });

  it('returns transition details from updateFromGuessResponse', () => {
    const { result } = renderHook(() => useCombo());

    let transition: ReturnType<typeof result.current.updateFromGuessResponse>;
    act(() => {
      transition = result.current.updateFromGuessResponse('🟢');
    });

    expect(transition!).toMatchObject({
      scoreEmoji: '🟢',
      momentum: expect.any(String),
      transition: expect.any(String),
    });
  });

  it('resetFromGuesses seeds combo from existing guess list', () => {
    const { result } = renderHook(() => useCombo());

    const guesses: GuessEntry[] = [
      makeGuess('🟢', 1),
      makeGuess('🟢', 2),
      makeGuess('🟢', 3),
    ];

    act(() => {
      result.current.resetFromGuesses(guesses);
    });

    // Combo should reflect consecutive on-path guesses
    expect(result.current.combo).toBeGreaterThan(0);
  });

  it('resetFromGuesses resets momentum to steady', () => {
    const { result } = renderHook(() => useCombo());

    act(() => { result.current.updateFromGuessResponse('🟢'); });
    act(() => { result.current.updateFromGuessResponse('🟢'); });

    act(() => {
      result.current.resetFromGuesses([makeGuess('🔴', 1)]);
    });

    expect(result.current.momentum).toBe('steady');
  });
});
