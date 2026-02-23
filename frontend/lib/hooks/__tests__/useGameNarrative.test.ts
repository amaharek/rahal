import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useGameNarrative } from '../useGameNarrative';

const CHALLENGE_ID = 'challenge-abc';
const CHALLENGE_DATE = '2026-02-23';
const START = { name_ar: 'مصر', name_en: 'Egypt' };
const END = { name_ar: 'اليابان', name_en: 'Japan' };

describe('useGameNarrative', () => {
  it('returns start milestone when game has not started (0 guesses)', () => {
    const { result } = renderHook(() =>
      useGameNarrative({
        challengeId: CHALLENGE_ID,
        challengeDate: CHALLENGE_DATE,
        startCountry: START,
        endCountry: END,
        shortestPath: 5,
        guessesCount: 0,
        isCompleted: false,
      })
    );

    expect(result.current.narrativeMilestone).toBe('start');
    expect(result.current.milestoneEmoji).toBe('🧭');
  });

  it('returns midpoint milestone at ~half of shortest path', () => {
    const { result } = renderHook(() =>
      useGameNarrative({
        challengeId: CHALLENGE_ID,
        challengeDate: CHALLENGE_DATE,
        startCountry: START,
        endCountry: END,
        shortestPath: 4,
        guessesCount: 2,
        isCompleted: false,
      })
    );

    expect(result.current.narrativeMilestone).toBe('midpoint');
    expect(result.current.milestoneEmoji).toBe('📍');
  });

  it('returns finish milestone when game is completed', () => {
    const { result } = renderHook(() =>
      useGameNarrative({
        challengeId: CHALLENGE_ID,
        challengeDate: CHALLENGE_DATE,
        startCountry: START,
        endCountry: END,
        shortestPath: 3,
        guessesCount: 3,
        isCompleted: true,
      })
    );

    expect(result.current.narrativeMilestone).toBe('finish');
    expect(result.current.milestoneEmoji).toBe('🏁');
  });

  it('returns milestone copy with title and body strings', () => {
    const { result } = renderHook(() =>
      useGameNarrative({
        challengeId: CHALLENGE_ID,
        challengeDate: CHALLENGE_DATE,
        startCountry: START,
        endCountry: END,
        shortestPath: 3,
        guessesCount: 0,
        isCompleted: false,
      })
    );

    expect(result.current.milestoneCopy.title).toBeTruthy();
    expect(result.current.milestoneCopy.body).toBeTruthy();
  });

  it('defaults to hybrid variant when no override is provided', () => {
    const { result } = renderHook(() =>
      useGameNarrative({
        challengeId: CHALLENGE_ID,
        challengeDate: CHALLENGE_DATE,
        startCountry: START,
        endCountry: END,
        shortestPath: 3,
        guessesCount: 0,
        isCompleted: false,
        presentationOverride: null,
      })
    );

    expect(['baseline', 'hybrid']).toContain(result.current.presentationVariant);
  });

  it('uses baseline variant when override is "baseline"', () => {
    const { result } = renderHook(() =>
      useGameNarrative({
        challengeId: CHALLENGE_ID,
        challengeDate: CHALLENGE_DATE,
        startCountry: START,
        endCountry: END,
        shortestPath: 3,
        guessesCount: 0,
        isCompleted: false,
        presentationOverride: 'baseline',
      })
    );

    expect(result.current.presentationVariant).toBe('baseline');
    expect(result.current.isHybridPresentation).toBe(false);
  });

  it('uses hybrid variant when override is "hybrid"', () => {
    const { result } = renderHook(() =>
      useGameNarrative({
        challengeId: CHALLENGE_ID,
        challengeDate: CHALLENGE_DATE,
        startCountry: START,
        endCountry: END,
        shortestPath: 3,
        guessesCount: 0,
        isCompleted: false,
        presentationOverride: 'hybrid',
      })
    );

    expect(result.current.presentationVariant).toBe('hybrid');
    expect(result.current.isHybridPresentation).toBe(true);
  });

  it('returns start milestone when challengeId is undefined', () => {
    const { result } = renderHook(() =>
      useGameNarrative({
        challengeId: undefined,
        challengeDate: undefined,
        startCountry: START,
        endCountry: END,
        shortestPath: 3,
        guessesCount: 5,
        isCompleted: false,
      })
    );

    expect(result.current.narrativeMilestone).toBe('start');
  });
});
