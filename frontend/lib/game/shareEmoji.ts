import type { GuessEntry } from '@/types/game';

export function buildEmojiPath(guesses: GuessEntry[], isCompleted: boolean): string {
  return guesses.map((guess) => guess.emoji).join('') + (isCompleted ? '✅' : '');
}
