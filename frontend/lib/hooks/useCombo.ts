'use client';

import { useEffect, useState } from 'react';
import { computeComboFromGuesses, computeComboState } from '@/lib/game/progression';
import type { ComboMomentum, GuessEntry, ScoreEmoji } from '@/types/game';

export interface ComboState {
  combo: number;
  momentum: ComboMomentum;
  previousCombo: number;
  transition: string;
}

export interface UseComboReturn extends ComboState {
  updateFromGuessResponse: (scoreEmoji: ScoreEmoji) => ComboStateTransition;
  resetFromGuesses: (guesses: GuessEntry[]) => void;
}

export interface ComboStateTransition {
  previousCombo: number;
  nextCombo: number;
  momentum: ComboMomentum;
  transition: string;
  scoreEmoji: ScoreEmoji;
}

/**
 * Tracks the current combo count and momentum for the game session.
 * Combo increments on consecutive on-path guesses (🟢/🟡) and resets on misses.
 */
export function useCombo(initialGuesses?: GuessEntry[]): UseComboReturn {
  const [combo, setCombo] = useState(0);
  const [momentum, setMomentum] = useState<ComboMomentum>('steady');
  const [previousCombo, setPreviousCombo] = useState(0);
  const [transition, setTransition] = useState('no_change');

  // Seed from existing guesses (e.g. when resuming a session)
  useEffect(() => {
    if (initialGuesses && initialGuesses.length > 0) {
      setCombo(computeComboFromGuesses(initialGuesses));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Call this when a new guess response arrives.
   * Returns the transition details so callers can fire telemetry.
   */
  const updateFromGuessResponse = (scoreEmoji: ScoreEmoji): ComboStateTransition => {
    const comboState = computeComboState(combo, scoreEmoji);
    setPreviousCombo(comboState.previousCombo);
    setCombo(comboState.nextCombo);
    setMomentum(comboState.momentum);
    setTransition(comboState.transition);

    return {
      previousCombo: comboState.previousCombo,
      nextCombo: comboState.nextCombo,
      momentum: comboState.momentum,
      transition: comboState.transition,
      scoreEmoji,
    };
  };

  /**
   * Recompute combo from the full guesses array (e.g. after store hydration).
   */
  const resetFromGuesses = (guesses: GuessEntry[]) => {
    setCombo(computeComboFromGuesses(guesses));
    setMomentum('steady');
  };

  return {
    combo,
    momentum,
    previousCombo,
    transition,
    updateFromGuessResponse,
    resetFromGuesses,
  };
}
