'use client';

import { useEffect } from 'react';
import {
  trackCompletionPanelViewed,
  trackABOutcomeCompletion,
  trackComboStateChanged,
  resetChallengeTelemetryState,
  trackDockAction,
  trackEfficiencyBenchmarkShown,
  trackGuessSubmission,
  trackHudRenderState,
  trackInputFocusStart,
  trackNarrativeMilestoneShown,
  trackPostgameRecapShared,
  trackPresentationVariantAssigned,
  trackRecapCardViewed,
  trackRetryCtaClicked,
} from '@/lib/telemetry/gameTelemetry';
import type {
  ComboMomentum,
  EfficiencyBucket,
  GamePresentationVariant,
  NarrativeMilestone,
  QualityTier,
  RouteMode,
  ScoreEmoji,
} from '@/types/game';

export interface UseGameTelemetryParams {
  challengeId: string | undefined;
  routeMode: RouteMode;
  guessesCount: number;
  isCompleted: boolean;
  score: number | null;
  qualityTier: QualityTier | null;
  streakValue: number | null;
  hintsRemaining: number;
  efficiencyBucket: EfficiencyBucket;
  shortestPath: number | undefined;
  deltaFromShortestPath: number;
  presentationVariant: GamePresentationVariant;
  isHybridPresentation: boolean;
  narrativeMilestone: NarrativeMilestone;
  combo: number;
  momentum: ComboMomentum;
}

export interface UseGameTelemetryActions {
  trackGuess: (countryCode: string) => void;
  trackHint: () => void;
  trackDock: (action: 'submit_guess' | 'use_hint') => void;
  trackFocusStart: () => void;
  trackCombo: (params: {
    previousCombo: number;
    nextCombo: number;
    momentum: ComboMomentum;
    transition: 'increase' | 'reset' | 'no_change';
    scoreEmoji: ScoreEmoji;
  }) => void;
  trackShare: (method: 'native' | 'clipboard') => void;
  trackRetry: (destination: 'practice') => void;
}

export function useGameTelemetry(params: UseGameTelemetryParams): UseGameTelemetryActions {
  const {
    challengeId,
    routeMode,
    guessesCount,
    isCompleted,
    score,
    qualityTier,
    streakValue,
    hintsRemaining,
    efficiencyBucket,
    shortestPath,
    deltaFromShortestPath,
    presentationVariant,
    isHybridPresentation,
    narrativeMilestone,
  } = params;

  // Reset telemetry state when challenge changes
  useEffect(() => {
    if (!challengeId) return;

    resetChallengeTelemetryState(challengeId);
    return () => {
      resetChallengeTelemetryState(challengeId);
    };
  }, [challengeId]);

  // HUD render state
  useEffect(() => {
    if (!challengeId) return;

    trackHudRenderState({
      challengeId,
      mode: routeMode,
      streak: streakValue,
      hintsRemaining,
      efficiency: efficiencyBucket,
      guessesCount,
      isCompleted,
    });
  }, [challengeId, routeMode, streakValue, hintsRemaining, efficiencyBucket, guessesCount, isCompleted]);

  // Efficiency benchmark
  useEffect(() => {
    if (!challengeId || guessesCount === 0 || shortestPath === undefined) return;

    trackEfficiencyBenchmarkShown({
      challengeId,
      mode: routeMode,
      shortestPath,
      guessesCount,
      deltaFromShortestPath,
      efficiency: efficiencyBucket,
    });
  }, [challengeId, routeMode, guessesCount, deltaFromShortestPath, efficiencyBucket, shortestPath]);

  // Completion panel
  useEffect(() => {
    if (!challengeId || !isCompleted) return;

    trackCompletionPanelViewed({
      challengeId,
      mode: routeMode,
      score: score ?? 0,
      totalGuesses: guessesCount,
      qualityTier,
    });
  }, [challengeId, isCompleted, routeMode, score, guessesCount, qualityTier]);

  // A/B outcome
  useEffect(() => {
    if (!challengeId || !isCompleted) return;

    trackABOutcomeCompletion({
      challengeId,
      mode: routeMode,
      variant: presentationVariant,
      score: score ?? 0,
      totalGuesses: guessesCount,
      qualityTier,
    });
  }, [challengeId, isCompleted, routeMode, presentationVariant, score, guessesCount, qualityTier]);

  // Presentation variant assigned
  useEffect(() => {
    if (!challengeId) return;

    trackPresentationVariantAssigned({
      challengeId,
      mode: routeMode,
      variant: presentationVariant,
    });
  }, [challengeId, routeMode, presentationVariant]);

  // Narrative milestone (hybrid only)
  useEffect(() => {
    if (!challengeId || !isHybridPresentation) return;

    trackNarrativeMilestoneShown({
      challengeId,
      mode: routeMode,
      milestone: narrativeMilestone,
    });
  }, [challengeId, routeMode, narrativeMilestone, isHybridPresentation]);

  // Recap card viewed (hybrid, completed)
  useEffect(() => {
    if (!challengeId || !isCompleted || !isHybridPresentation) return;

    trackRecapCardViewed({
      challengeId,
      mode: routeMode,
      variant: presentationVariant,
    });
  }, [challengeId, isCompleted, isHybridPresentation, presentationVariant, routeMode]);

  // Action trackers
  const trackGuess = (countryCode: string) => {
    if (!challengeId) return;
    trackGuessSubmission(challengeId, routeMode, countryCode, presentationVariant);
  };

  const trackHint = () => {
    if (!challengeId) return;
    trackDockAction(challengeId, routeMode, 'use_hint');
  };

  const trackDock = (action: 'submit_guess' | 'use_hint') => {
    if (!challengeId) return;
    trackDockAction(challengeId, routeMode, action);
  };

  const trackFocusStart = () => {
    if (!challengeId) return;
    trackInputFocusStart(challengeId);
  };

  const trackCombo = (comboParams: {
    previousCombo: number;
    nextCombo: number;
    momentum: ComboMomentum;
    transition: 'increase' | 'reset' | 'no_change';
    scoreEmoji: ScoreEmoji;
  }) => {
    if (!challengeId || comboParams.transition === 'no_change') return;
    trackComboStateChanged({
      challengeId,
      mode: routeMode,
      ...comboParams,
    });
  };

  const trackShare = (method: 'native' | 'clipboard') => {
    if (!challengeId) return;
    trackPostgameRecapShared({ challengeId, mode: routeMode, shareMethod: method });
  };

  const trackRetry = (destination: 'practice') => {
    if (!challengeId) return;
    trackRetryCtaClicked({ challengeId, mode: routeMode, destination });
  };

  return {
    trackGuess,
    trackHint,
    trackDock,
    trackFocusStart,
    trackCombo,
    trackShare,
    trackRetry,
  };
}
