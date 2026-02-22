import { describe, it, expect } from 'vitest';
import { buildShareRecapText, getNarrativeMilestone, resolvePresentationVariant } from '@/lib/game/phase3';

describe('phase3 helpers', () => {
  it('resolves deterministic presentation variant without override', () => {
    const variantA = resolvePresentationVariant('challenge-a', '2026-02-20', null);
    const variantB = resolvePresentationVariant('challenge-a', '2026-02-20', null);
    expect(variantA).toBe(variantB);
    expect(['baseline', 'hybrid']).toContain(variantA);
  });

  it('respects explicit presentation override', () => {
    expect(resolvePresentationVariant('challenge-a', '2026-02-20', 'baseline')).toBe('baseline');
    expect(resolvePresentationVariant('challenge-a', '2026-02-20', 'hybrid')).toBe('hybrid');
  });

  it('derives start, midpoint, and finish milestones', () => {
    expect(getNarrativeMilestone({ guessesCount: 0, shortestPath: 4, isCompleted: false })).toBe('start');
    expect(getNarrativeMilestone({ guessesCount: 2, shortestPath: 4, isCompleted: false })).toBe('midpoint');
    expect(getNarrativeMilestone({ guessesCount: 5, shortestPath: 4, isCompleted: true })).toBe('finish');
  });

  it('builds locale-aware share recap text', () => {
    const en = buildShareRecapText({
      locale: 'en',
      startCountry: 'Jordan',
      endCountry: 'Egypt',
      guessesCount: 5,
      shortestPath: 4,
      score: 92,
      qualityTier: 'near_optimal',
      efficiency: 'medium',
    });
    const ar = buildShareRecapText({
      locale: 'ar',
      startCountry: 'الأردن',
      endCountry: 'مصر',
      guessesCount: 4,
      shortestPath: 4,
      score: 100,
      qualityTier: 'perfect',
      efficiency: 'high',
    });

    expect(en).toContain('Score: 92');
    expect(en).toContain('Jordan -> Egypt');
    expect(ar).toContain('رحلتي اليوم على Rahal');
    expect(ar).toContain('الأردن → مصر');
  });
});
