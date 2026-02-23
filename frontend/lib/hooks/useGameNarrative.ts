'use client';

import { useLocale, useTranslations } from 'next-intl';
import { getNarrativeMilestone, getExperimentIdentity, resolvePresentationVariant } from '@/lib/game/phase3';
import type { GamePresentationVariant, NarrativeMilestone, RouteMode } from '@/types/game';

export interface NarrativeCopy {
  title: string;
  body: string;
}

export interface UseGameNarrativeParams {
  challengeId: string | undefined;
  challengeDate: string | undefined;
  startCountry: { name_ar: string; name_en: string } | undefined;
  endCountry: { name_ar: string; name_en: string } | undefined;
  shortestPath: number;
  guessesCount: number;
  isCompleted: boolean;
  presentationOverride?: string | null;
  userId?: string;
}

export interface UseGameNarrativeReturn {
  presentationVariant: GamePresentationVariant;
  isHybridPresentation: boolean;
  narrativeMilestone: NarrativeMilestone;
  milestoneCopy: NarrativeCopy;
  milestoneEmoji: string;
}

/**
 * Derives the presentation variant and narrative copy for the current game state.
 * Isolates all phase3/narrative logic from the rendering component.
 */
export function useGameNarrative(params: UseGameNarrativeParams): UseGameNarrativeReturn {
  const {
    challengeId,
    challengeDate,
    startCountry,
    endCountry,
    shortestPath,
    guessesCount,
    isCompleted,
    presentationOverride,
    userId,
  } = params;

  const t = useTranslations();
  const locale = useLocale();

  const getCountryName = (country: { name_ar: string; name_en: string } | undefined) => {
    if (!country) return '-';
    return locale === 'ar' ? country.name_ar : country.name_en || country.name_ar;
  };

  const experimentIdentity = getExperimentIdentity(userId);
  const presentationVariant: GamePresentationVariant =
    challengeId && challengeDate
      ? resolvePresentationVariant(
          challengeId,
          challengeDate,
          presentationOverride ?? null,
          experimentIdentity
        )
      : 'hybrid';

  const isHybridPresentation = presentationVariant === 'hybrid';

  const narrativeMilestone: NarrativeMilestone =
    challengeId
      ? getNarrativeMilestone({ guessesCount, shortestPath, isCompleted })
      : 'start';

  const getMilestoneCopy = (): NarrativeCopy => {
    if (!challengeId) {
      return {
        title: t('game.narrative.start.title'),
        body: t('game.narrative.start.body', { from: '-', to: '-' }),
      };
    }

    const from = getCountryName(startCountry);
    const to = getCountryName(endCountry);
    const midpointTarget = Math.max(1, Math.ceil(shortestPath / 2));

    if (narrativeMilestone === 'finish') {
      return {
        title: t('game.narrative.finish.title'),
        body: t('game.narrative.finish.body', { guesses: guessesCount, shortestPath }),
      };
    }

    if (narrativeMilestone === 'midpoint') {
      return {
        title: t('game.narrative.midpoint.title'),
        body: t('game.narrative.midpoint.body', {
          from,
          to,
          progress: guessesCount,
          target: midpointTarget,
        }),
      };
    }

    return {
      title: t('game.narrative.start.title'),
      body: t('game.narrative.start.body', { from, to }),
    };
  };

  const milestoneEmoji =
    narrativeMilestone === 'start'
      ? '🧭'
      : narrativeMilestone === 'midpoint'
        ? '📍'
        : '🏁';

  return {
    presentationVariant,
    isHybridPresentation,
    narrativeMilestone,
    milestoneCopy: getMilestoneCopy(),
    milestoneEmoji,
  };
}
