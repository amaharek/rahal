'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { getDailyChallenge, getGameStats, submitGuess, useHint } from '@/lib/api/game';
import { useGameStore } from '@/lib/stores/gameStore';
import { useAuthStore } from '@/lib/stores/authStore';
import {
  computeComboFromGuesses,
  computeComboState,
  computeEfficiencyBenchmark,
} from '@/lib/game/progression';
import { buildShareCard, computeChallengeNumber, getExperimentIdentity, resolvePresentationVariant } from '@/lib/game/phase3';
import type {
  ComboMomentum,
  Country,
  DailyChallenge,
  GamePresentationVariant,
  GuessEntry,
  HintResponse,
  QualityTier,
  RouteMode,
  ScoreEmoji,
} from '@/types/game';

export interface ComboTransition {
  previousCombo: number;
  nextCombo: number;
  momentum: ComboMomentum;
  transition: 'increase' | 'reset' | 'no_change';
  scoreEmoji: ScoreEmoji;
}

export interface UseGameSessionReturn {
  // Challenge data
  challenge: DailyChallenge | null;
  guesses: GuessEntry[];
  hintsUsed: number;
  isCompleted: boolean;
  score: number | null;
  mapZoom: number;
  mapCenter: [number, number];
  currentHint: HintResponse | null;
  qualityExplanation: string | null;
  qualityTier: QualityTier | null;
  shareStatus: 'idle' | 'copied' | 'error';
  streakValue: number | null;
  routeMode: RouteMode;

  // Combo state (exposed for telemetry)
  combo: number;
  momentum: ComboMomentum;
  lastComboTransition: ComboTransition | null;

  // Computed
  guessedCountryCodes: Array<{ code: string; isOnPath: boolean; name: string }>;
  benchmark: ReturnType<typeof computeEfficiencyBenchmark>;
  efficiencyBucket: ReturnType<typeof computeEfficiencyBenchmark>['bucket'];
  presentationVariant: GamePresentationVariant;
  isHybridPresentation: boolean;
  hintsRemaining: number;

  // Loading / error
  isLoading: boolean;
  error: Error | null;
  isGuessPending: boolean;
  isHintPending: boolean;

  // Actions
  setRouteMode: (mode: RouteMode) => void;
  setMapZoom: (zoom: number) => void;
  setMapCenter: (center: [number, number]) => void;
  handleCountrySelect: (country: Country) => void;
  handleHintRequest: () => void;
  handleShareRecap: () => Promise<void>;
  getCountryNameByLocale: (country: { name_ar: string; name_en: string }) => string;
}

export function useGameSession(presentationOverride?: string | null): UseGameSessionReturn {
  const locale = useLocale();
  const t = useTranslations();

  const [routeMode, setRouteMode] = useState<RouteMode>('shortest');
  const [currentHint, setCurrentHint] = useState<HintResponse | null>(null);
  const [qualityExplanation, setQualityExplanation] = useState<string | null>(null);
  const [qualityTier, setQualityTier] = useState<QualityTier | null>(null);
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const [combo, setCombo] = useState(0);
  const [momentum, setMomentum] = useState<ComboMomentum>('steady');
  const [lastComboTransition, setLastComboTransition] = useState<ComboTransition | null>(null);

  const accessToken = useAuthStore((state) => state.accessToken);
  const userId = useAuthStore((state) => state.user?.id);

  const {
    challenge,
    guesses,
    hintsUsed,
    isCompleted,
    score,
    mapZoom,
    mapCenter,
    setChallenge,
    addGuess,
    useHint: storeUseHint,
    completeGame,
    setError,
    setMapZoom,
    setMapCenter,
  } = useGameStore();

  const { data: statsData } = useQuery({
    queryKey: ['gameStatsHud', accessToken],
    queryFn: () => getGameStats(accessToken as string),
    enabled: Boolean(accessToken),
    retry: false,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['dailyChallenge', routeMode],
    queryFn: () => getDailyChallenge(routeMode),
  });

  useEffect(() => {
    if (data) {
      setChallenge(data);
      setCurrentHint(null);
      setQualityExplanation(null);
      setQualityTier(null);
      setMomentum('steady');
    }
  }, [data, setChallenge]);

  useEffect(() => {
    setShareStatus('idle');
  }, [challenge?.id, routeMode]);

  useEffect(() => {
    setCombo(computeComboFromGuesses(guesses));
  }, [guesses]);

  const guessedCountryCodes = useMemo(
    () =>
      guesses.map((guess) => ({
        code: guess.country_code,
        isOnPath: guess.emoji === '🟢' || guess.emoji === '🟡',
        name: locale === 'ar' ? guess.name_ar : guess.name_en || guess.name_ar,
      })),
    [guesses, locale]
  );

  const benchmark = useMemo(
    () =>
      challenge
        ? computeEfficiencyBenchmark(guesses.length, challenge.shortest_path)
        : computeEfficiencyBenchmark(0, 1),
    [challenge, guesses.length]
  );

  const experimentIdentity = getExperimentIdentity(userId);
  const presentationVariant: GamePresentationVariant = challenge
    ? resolvePresentationVariant(
        challenge.id,
        challenge.challenge_date,
        presentationOverride ?? null,
        experimentIdentity
      )
    : 'hybrid';
  const isHybridPresentation = presentationVariant === 'hybrid';

  const hintsRemaining = Math.max(0, 3 - hintsUsed);
  const streakValue = statsData?.current_streak ?? null;

  const guessMutation = useMutation({
    mutationFn: (country: Country) =>
      submitGuess({
        challenge_id: challenge!.id,
        country_id: country.id,
        mode: routeMode,
      }),
    onSuccess: (response) => {
      const comboState = computeComboState(combo, response.score_emoji);
      setCombo(comboState.nextCombo);
      setMomentum(comboState.momentum);
      setLastComboTransition({
        previousCombo: comboState.previousCombo,
        nextCombo: comboState.nextCombo,
        momentum: comboState.momentum,
        transition: comboState.transition,
        scoreEmoji: response.score_emoji,
      });

      const newGuess: GuessEntry = {
        country_id: response.country.id,
        country_code: response.country.code,
        name_ar: response.country.name_ar,
        name_en: response.country.name_en,
        flag_emoji: response.country.flag_emoji,
        emoji: response.score_emoji,
        order: guesses.length + 1,
      };
      addGuess(newGuess);

      if (response.game_complete) {
        completeGame(response.score ?? 0);
        setQualityExplanation(response.quality_explanation_ar);
        setQualityTier(response.quality_tier);
      }
    },
    onError: (mutationError: Error) => {
      setError(mutationError.message);
    },
  });

  const hintMutation = useMutation({
    mutationFn: () =>
      useHint({
        challenge_id: challenge!.id,
        mode: routeMode,
      }),
    onSuccess: (response) => {
      setCurrentHint(response);
      storeUseHint();
    },
    onError: (mutationError: Error) => {
      setError(mutationError.message);
    },
  });

  const getCountryNameByLocale = (country: { name_ar: string; name_en: string }) =>
    locale === 'ar' ? country.name_ar : country.name_en || country.name_ar;

  const handleCountrySelect = (country: Country) => {
    if (!challenge || isCompleted) return;

    const alreadyGuessed = guesses.some((g) => g.country_id === country.id);
    if (alreadyGuessed) {
      setError(t('errors.alreadyGuessed'));
      return;
    }

    guessMutation.mutate(country);
  };

  const handleHintRequest = () => {
    if (!challenge || hintsUsed >= 3 || hintMutation.isPending) return;
    hintMutation.mutate();
  };

  const handleShareRecap = async () => {
    if (!challenge || !isCompleted) return;

    const shareText = buildShareCard({
      locale,
      challengeNumber: computeChallengeNumber(challenge.challenge_date),
      startFlagEmoji: challenge.start_country.flag_emoji ?? '',
      endFlagEmoji: challenge.end_country.flag_emoji ?? '',
      guesses,
      shortestPath: challenge.shortest_path,
      score,
      isCompleted,
    });

    try {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share({ text: shareText });
      } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
      } else {
        throw new Error('share unavailable');
      }
      setShareStatus('copied');
    } catch {
      setShareStatus('error');
    }
  };

  return {
    challenge,
    guesses,
    hintsUsed,
    isCompleted,
    score,
    mapZoom,
    mapCenter,
    currentHint,
    qualityExplanation,
    qualityTier,
    shareStatus,
    streakValue,
    routeMode,
    combo,
    momentum,
    lastComboTransition,
    guessedCountryCodes,
    benchmark,
    efficiencyBucket: benchmark.bucket,
    presentationVariant,
    isHybridPresentation,
    hintsRemaining,
    isLoading,
    error: error as Error | null,
    isGuessPending: guessMutation.isPending,
    isHintPending: hintMutation.isPending,
    setRouteMode,
    setMapZoom,
    setMapCenter,
    handleCountrySelect,
    handleHintRequest,
    handleShareRecap,
    getCountryNameByLocale,
  };
}
