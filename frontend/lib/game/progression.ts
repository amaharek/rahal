import type { GuessEntry, ScoreEmoji, EfficiencyBucket, ComboMomentum } from '@/types/game';

export interface EfficiencyBenchmark {
  deltaFromShortestPath: number;
  ratioToOptimal: number;
  bucket: EfficiencyBucket;
}

export interface ComboState {
  previousCombo: number;
  nextCombo: number;
  momentum: ComboMomentum;
  transition: 'increase' | 'reset' | 'no_change';
}

export function isPositiveGuess(scoreEmoji: ScoreEmoji): boolean {
  return scoreEmoji === '🟢' || scoreEmoji === '🟡';
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

export function computeEfficiencyBenchmark(
  guessesCount: number,
  shortestPath: number
): EfficiencyBenchmark {
  if (guessesCount === 0) {
    return {
      deltaFromShortestPath: 0,
      ratioToOptimal: 0,
      bucket: 'pending',
    };
  }

  const safeShortestPath = Math.max(shortestPath, 1);
  const ratio = safeShortestPath / Math.max(guessesCount, safeShortestPath);

  return {
    deltaFromShortestPath: guessesCount - safeShortestPath,
    ratioToOptimal: ratio,
    bucket: deriveEfficiencyBucket(guessesCount, shortestPath),
  };
}

export function computeComboState(previousCombo: number, scoreEmoji: ScoreEmoji): ComboState {
  const success = isPositiveGuess(scoreEmoji);

  if (success) {
    return {
      previousCombo,
      nextCombo: previousCombo + 1,
      momentum: 'up',
      transition: 'increase',
    };
  }

  if (previousCombo === 0) {
    return {
      previousCombo,
      nextCombo: 0,
      momentum: 'steady',
      transition: 'no_change',
    };
  }

  return {
    previousCombo,
    nextCombo: 0,
    momentum: 'down',
    transition: 'reset',
  };
}

export function computeComboFromGuesses(guesses: GuessEntry[]): number {
  let combo = 0;

  for (const guess of guesses) {
    combo = isPositiveGuess(guess.emoji) ? combo + 1 : 0;
  }

  return combo;
}
