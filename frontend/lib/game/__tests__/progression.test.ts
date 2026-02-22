import { describe, it, expect } from 'vitest';
import {
  computeComboFromGuesses,
  computeComboState,
  computeEfficiencyBenchmark,
  deriveEfficiencyBucket,
} from '@/lib/game/progression';

describe('deriveEfficiencyBucket', () => {
  it('returns pending before first guess', () => {
    expect(deriveEfficiencyBucket(0, 4)).toBe('pending');
  });

  it('returns high when equal to shortest path', () => {
    expect(deriveEfficiencyBucket(4, 4)).toBe('high');
  });

  it('returns medium in middle range', () => {
    expect(deriveEfficiencyBucket(6, 4)).toBe('medium');
  });

  it('returns low when far from shortest path', () => {
    expect(deriveEfficiencyBucket(10, 4)).toBe('low');
  });
});

describe('computeEfficiencyBenchmark', () => {
  it('calculates ratio and delta from shortest path', () => {
    expect(computeEfficiencyBenchmark(5, 4)).toEqual({
      deltaFromShortestPath: 1,
      ratioToOptimal: 0.8,
      bucket: 'medium',
    });
  });

  it('handles empty guesses as pending', () => {
    expect(computeEfficiencyBenchmark(0, 4)).toEqual({
      deltaFromShortestPath: 0,
      ratioToOptimal: 0,
      bucket: 'pending',
    });
  });
});

describe('computeComboState', () => {
  it('increments combo on positive guess', () => {
    expect(computeComboState(2, '🟢')).toMatchObject({
      previousCombo: 2,
      nextCombo: 3,
      momentum: 'up',
      transition: 'increase',
    });
  });

  it('resets combo on failed guess', () => {
    expect(computeComboState(3, '🔴')).toMatchObject({
      previousCombo: 3,
      nextCombo: 0,
      momentum: 'down',
      transition: 'reset',
    });
  });

  it('keeps steady state on failed guess with zero combo', () => {
    expect(computeComboState(0, '⚫')).toMatchObject({
      previousCombo: 0,
      nextCombo: 0,
      momentum: 'steady',
      transition: 'no_change',
    });
  });
});

describe('computeComboFromGuesses', () => {
  it('returns trailing streak from guess history', () => {
    expect(
      computeComboFromGuesses([
        {
          country_id: '1',
          country_code: 'JOR',
          name_ar: 'الأردن',
          flag_emoji: '🇯🇴',
          emoji: '🟢',
          order: 1,
        },
        {
          country_id: '2',
          country_code: 'SAU',
          name_ar: 'السعودية',
          flag_emoji: '🇸🇦',
          emoji: '🟡',
          order: 2,
        },
        {
          country_id: '3',
          country_code: 'USA',
          name_ar: 'أمريكا',
          flag_emoji: '🇺🇸',
          emoji: '🔴',
          order: 3,
        },
        {
          country_id: '4',
          country_code: 'EGY',
          name_ar: 'مصر',
          flag_emoji: '🇪🇬',
          emoji: '🟢',
          order: 4,
        },
      ])
    ).toBe(1);
  });
});
