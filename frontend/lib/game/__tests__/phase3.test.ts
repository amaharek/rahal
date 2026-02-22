import { describe, it, expect } from 'vitest';
import {
  buildShareRecapText,
  getExperimentIdentity,
  getNarrativeMilestone,
  resolvePresentationVariant,
} from '@/lib/game/phase3';

describe('phase3 helpers', () => {
  it('returns stable guest identity when user is not authenticated', () => {
    window.localStorage.clear();

    const first = getExperimentIdentity(null);
    const second = getExperimentIdentity(null);

    expect(first).toMatch(/^guest:/);
    expect(first).toBe(second);
  });

  it('uses user identity when user is authenticated', () => {
    expect(getExperimentIdentity('user-123')).toBe('user:user-123');
  });

  it('resolves deterministic presentation variant without override', () => {
    const variantA = resolvePresentationVariant('challenge-a', '2026-02-20', null, 'user:u1');
    const variantB = resolvePresentationVariant('challenge-a', '2026-02-20', null, 'user:u1');
    expect(variantA).toBe(variantB);
    expect(['baseline', 'hybrid']).toContain(variantA);
  });

  it('can bucket different identities into different variants', () => {
    const variantUserA = resolvePresentationVariant('challenge-a', '2026-02-20', null, 'user:a');
    const variantUserB = resolvePresentationVariant('challenge-a', '2026-02-20', null, 'user:b');
    expect(['baseline', 'hybrid']).toContain(variantUserA);
    expect(['baseline', 'hybrid']).toContain(variantUserB);
  });

  it('respects explicit presentation override', () => {
    expect(resolvePresentationVariant('challenge-a', '2026-02-20', 'baseline', 'user:u1')).toBe('baseline');
    expect(resolvePresentationVariant('challenge-a', '2026-02-20', 'hybrid', 'user:u1')).toBe('hybrid');
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
