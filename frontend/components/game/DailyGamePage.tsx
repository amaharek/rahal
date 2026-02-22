'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDirection } from '@/lib/hooks/useDirection';
import { getDailyChallenge, getGameStats, submitGuess, useHint } from '@/lib/api/game';
import { useGameStore } from '@/lib/stores/gameStore';
import { useAuthStore } from '@/lib/stores/authStore';
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
import { MapSkeleton, MapErrorBoundary } from '@/components/game/GameMap';
import { GameHUD } from '@/components/game/GameHUD';
import { GameChallengeCard } from '@/components/game/GameChallengeCard';
import { GameActionDock } from '@/components/game/GameActionDock';
import { GameHintsPanel } from '@/components/game/GameHintsPanel';
import { GameGuessList } from '@/components/game/GameGuessList';
import { Card, CardContent, Button } from '@/components/ui';
import {
  computeComboFromGuesses,
  computeComboState,
  computeEfficiencyBenchmark,
} from '@/lib/game/progression';
import {
  buildShareRecapText,
  getExperimentIdentity,
  getNarrativeMilestone,
  resolvePresentationVariant,
} from '@/lib/game/phase3';
import type {
  ComboMomentum,
  Country,
  GamePresentationVariant,
  GuessEntry,
  HintResponse,
  NarrativeMilestone,
  QualityTier,
  RouteMode,
} from '@/types/game';

const GameMap = dynamic(
  () =>
    import('@/components/game/GameMap')
      .then((mod) => {
        if (!mod.GameMap) {
          throw new Error('GameMap component not found in module');
        }
        return mod.GameMap;
      })
      .catch((error) => {
        console.error('[DailyGamePage] Failed to load GameMap:', error);
        throw error;
      }),
  {
    ssr: false,
    loading: () => <MapSkeleton />,
  }
);

export function DailyGamePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations();
  const locale = useLocale();
  const direction = useDirection();
  const [routeMode, setRouteMode] = useState<RouteMode>('shortest');
  const [currentHint, setCurrentHint] = useState<HintResponse | null>(null);
  const [qualityExplanation, setQualityExplanation] = useState<string | null>(null);
  const [qualityTier, setQualityTier] = useState<QualityTier | null>(null);
  const [combo, setCombo] = useState(0);
  const [momentum, setMomentum] = useState<ComboMomentum>('steady');
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied' | 'error'>('idle');

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
    if (!challenge) {
      return;
    }

    resetChallengeTelemetryState(challenge.id);

    return () => {
      resetChallengeTelemetryState(challenge.id);
    };
  }, [challenge?.id]);

  const guessedCountryCodes = useMemo(
    () =>
      guesses.map((guess) => ({
        code: guess.country_code,
        isOnPath: guess.emoji === '🟢' || guess.emoji === '🟡',
      })),
    [guesses]
  );

  useEffect(() => {
    setCombo(computeComboFromGuesses(guesses));
  }, [guesses]);

  const benchmark = useMemo(
    () =>
      challenge
        ? computeEfficiencyBenchmark(guesses.length, challenge.shortest_path)
        : computeEfficiencyBenchmark(0, 1),
    [challenge, guesses.length]
  );
  const efficiencyBucket = benchmark.bucket;
  const presentationOverride = searchParams.get('presentation');
  const experimentIdentity = getExperimentIdentity(userId);
  const presentationVariant: GamePresentationVariant = challenge
    ? resolvePresentationVariant(
        challenge.id,
        challenge.challenge_date,
        presentationOverride,
        experimentIdentity
      )
    : 'hybrid';
  const isHybridPresentation = presentationVariant === 'hybrid';
  const narrativeMilestone: NarrativeMilestone = challenge
    ? getNarrativeMilestone({
        guessesCount: guesses.length,
        shortestPath: challenge.shortest_path,
        isCompleted,
      })
    : 'start';

  const hintsRemaining = Math.max(0, 3 - hintsUsed);
  const streakValue = statsData?.current_streak ?? null;

  useEffect(() => {
    if (!challenge) {
      return;
    }

    trackHudRenderState({
      challengeId: challenge.id,
      mode: routeMode,
      streak: streakValue,
      hintsRemaining,
      efficiency: efficiencyBucket,
      guessesCount: guesses.length,
      isCompleted,
    });
  }, [
    challenge,
    routeMode,
    streakValue,
    hintsRemaining,
    efficiencyBucket,
    guesses.length,
    isCompleted,
  ]);

  useEffect(() => {
    if (!challenge || guesses.length === 0) {
      return;
    }

    trackEfficiencyBenchmarkShown({
      challengeId: challenge.id,
      mode: routeMode,
      shortestPath: challenge.shortest_path,
      guessesCount: guesses.length,
      deltaFromShortestPath: benchmark.deltaFromShortestPath,
      efficiency: benchmark.bucket,
    });
  }, [challenge, routeMode, guesses.length, benchmark.deltaFromShortestPath, benchmark.bucket]);

  useEffect(() => {
    if (!challenge || !isCompleted) {
      return;
    }

    trackCompletionPanelViewed({
      challengeId: challenge.id,
      mode: routeMode,
      score: score ?? 0,
      totalGuesses: guesses.length,
      qualityTier,
    });
  }, [challenge, isCompleted, routeMode, score, guesses.length, qualityTier]);

  useEffect(() => {
    if (!challenge || !isCompleted) {
      return;
    }

    trackABOutcomeCompletion({
      challengeId: challenge.id,
      mode: routeMode,
      variant: presentationVariant,
      score: score ?? 0,
      totalGuesses: guesses.length,
      qualityTier,
    });
  }, [challenge, isCompleted, routeMode, presentationVariant, score, guesses.length, qualityTier]);

  useEffect(() => {
    if (!challenge) {
      return;
    }

    trackPresentationVariantAssigned({
      challengeId: challenge.id,
      mode: routeMode,
      variant: presentationVariant,
    });
  }, [challenge, routeMode, presentationVariant]);

  useEffect(() => {
    if (!challenge || !isHybridPresentation) {
      return;
    }

    trackNarrativeMilestoneShown({
      challengeId: challenge.id,
      mode: routeMode,
      milestone: narrativeMilestone,
    });
  }, [challenge, routeMode, narrativeMilestone, isHybridPresentation]);

  useEffect(() => {
    if (!challenge || !isCompleted || !isHybridPresentation) {
      return;
    }

    trackRecapCardViewed({
      challengeId: challenge.id,
      mode: routeMode,
      variant: presentationVariant,
    });
  }, [challenge, isCompleted, isHybridPresentation, presentationVariant, routeMode]);

  useEffect(() => {
    setShareStatus('idle');
  }, [challenge?.id, routeMode]);

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

      if (challenge && comboState.transition !== 'no_change') {
        trackComboStateChanged({
          challengeId: challenge.id,
          mode: routeMode,
          previousCombo: comboState.previousCombo,
          nextCombo: comboState.nextCombo,
          momentum: comboState.momentum,
          transition: comboState.transition,
          scoreEmoji: response.score_emoji,
        });
      }

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

  const handleHintRequest = () => {
    if (!challenge || hintsUsed >= 3 || hintMutation.isPending) {
      return;
    }

    trackDockAction(challenge.id, routeMode, 'use_hint');
    hintMutation.mutate();
  };

  const formatHintDisplay = (hint: HintResponse): string => {
    const { hint_type, hint_data } = hint;
    if (hint_type === 'progressive_1') {
      const countryName = (hint_data.country_name_ar || hint_data.country_name_en) as
        | string
        | undefined;
      const borderCountries = hint_data.border_countries as string[];
      if (countryName && borderCountries?.length) {
        return t('game.hintDisplay.borderHint', {
          country: countryName,
          countries: borderCountries.join(locale === 'ar' ? '، ' : ', '),
        });
      }
    }
    if (hint_type === 'progressive_2') {
      const letters = hint_data.first_letters as string[];
      if (letters?.length) {
        return t('game.hintDisplay.firstLettersHint', {
          letters: letters.join(locale === 'ar' ? '، ' : ', '),
        });
      }
    }
    if (hint_type === 'progressive_3') {
      const pathCountries = hint_data.path_countries as string[];
      if (pathCountries?.length) {
        return t('game.hintDisplay.pathHint', {
          countries: pathCountries.join(direction === 'rtl' ? ' ← ' : ' → '),
        });
      }
    }
    return JSON.stringify(hint_data);
  };

  const handleCountrySelect = (country: Country) => {
    if (!challenge || isCompleted) {
      return;
    }

    const alreadyGuessed = guesses.some((g) => g.country_id === country.id);
    if (alreadyGuessed) {
      setError(t('errors.alreadyGuessed'));
      return;
    }

    trackGuessSubmission(challenge.id, routeMode, country.code, presentationVariant);
    guessMutation.mutate(country);
  };

  const handleCountryCommitted = (_countryCode: string) => {
    if (!challenge || isCompleted) {
      return;
    }

    trackDockAction(challenge.id, routeMode, 'submit_guess');
  };

  const handleInputFocusStart = () => {
    if (!challenge || isCompleted) {
      return;
    }

    trackInputFocusStart(challenge.id);
  };

  const getCountryNameByLocale = (country: { name_ar: string; name_en: string }) =>
    locale === 'ar' ? country.name_ar : country.name_en || country.name_ar;

  const getCompletionGradeLabel = (tier: QualityTier | null): string => {
    if (!tier) {
      return t('game.completion.gradeLevels.good_discovery');
    }
    return t(`game.completion.gradeLevels.${tier}`);
  };

  const getMilestoneCopy = (milestone: NarrativeMilestone): { title: string; body: string } => {
    if (!challenge) {
      return {
        title: t('game.narrative.start.title'),
        body: t('game.narrative.start.body', { from: '-', to: '-' }),
      };
    }

    const from = getCountryNameByLocale(challenge.start_country);
    const to = getCountryNameByLocale(challenge.end_country);
    const midpointTarget = Math.max(1, Math.ceil(challenge.shortest_path / 2));

    if (milestone === 'finish') {
      return {
        title: t('game.narrative.finish.title'),
        body: t('game.narrative.finish.body', {
          guesses: guesses.length,
          shortestPath: challenge.shortest_path,
        }),
      };
    }

    if (milestone === 'midpoint') {
      return {
        title: t('game.narrative.midpoint.title'),
        body: t('game.narrative.midpoint.body', {
          from,
          to,
          progress: guesses.length,
          target: midpointTarget,
        }),
      };
    }

    return {
      title: t('game.narrative.start.title'),
      body: t('game.narrative.start.body', { from, to }),
    };
  };

  const handleRetryCta = () => {
    if (!challenge) {
      return;
    }

    trackRetryCtaClicked({
      challengeId: challenge.id,
      mode: routeMode,
      destination: 'practice',
    });

    const params = new URLSearchParams({
      from: challenge.start_country.id,
      to: challenge.end_country.id,
      mode: routeMode,
    });
    router.push(`/${locale}/game/practice?${params.toString()}`);
  };

  const handleShareRecap = async () => {
    if (!challenge || !isCompleted) {
      return;
    }

    const shareText = buildShareRecapText({
      locale,
      startCountry: getCountryNameByLocale(challenge.start_country),
      endCountry: getCountryNameByLocale(challenge.end_country),
      guessesCount: guesses.length,
      shortestPath: challenge.shortest_path,
      score,
      qualityTier,
      efficiency: efficiencyBucket,
    });

    try {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share({ text: shareText });
        trackPostgameRecapShared({
          challengeId: challenge.id,
          mode: routeMode,
          shareMethod: 'native',
        });
      } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
        trackPostgameRecapShared({
          challengeId: challenge.id,
          mode: routeMode,
          shareMethod: 'clipboard',
        });
      } else {
        throw new Error('share unavailable');
      }

      setShareStatus('copied');
    } catch {
      setShareStatus('error');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <span className="text-4xl animate-spin inline-block">🌍</span>
          <p className="mt-4 text-text-secondary">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent>
            <p className="text-error mb-4">{t('common.error')}</p>
            <Button onClick={() => window.location.reload()}>{t('common.retry')}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!challenge) {
    return null;
  }

  const milestoneCopy = getMilestoneCopy(narrativeMilestone);

  return (
    <main className="min-h-screen pb-[12rem] lg:pb-20">
      <header className="bg-primary text-white py-3 px-4">
        <div className="max-w-7xl mx-auto">
          <Link
            href={`/${locale}`}
            className="inline-flex min-h-6 items-center px-1 text-white text-sm mb-1"
          >
            ← {t('common.back')}
          </Link>
          <h1 className="text-xl font-bold">{t('game.title')}</h1>
          <p className="text-white/80 text-xs">{t('game.subtitle')}</p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-3">
        <Card className="mb-3">
          <CardContent className="py-3 flex gap-2">
            <Button
              variant={routeMode === 'shortest' ? 'primary' : 'outline'}
              size="sm"
              className="flex-1"
              onClick={() => setRouteMode('shortest')}
            >
              {t('game.routeModes.shortest')}
            </Button>
            <Button
              variant={routeMode === 'explorer' ? 'primary' : 'outline'}
              size="sm"
              className="flex-1"
              onClick={() => setRouteMode('explorer')}
            >
              {t('game.routeModes.explorer')}
            </Button>
          </CardContent>
        </Card>

        <GameHUD
          streak={streakValue}
          hintsRemaining={hintsRemaining}
          efficiency={efficiencyBucket}
          combo={combo}
          momentum={momentum}
          benchmarkDelta={benchmark.deltaFromShortestPath}
          localeLabel={t}
        />

        {isHybridPresentation && (
          <Card
            className="mb-3 border-primary/35 bg-primary/5"
            data-testid="narrative-milestone-card"
            data-variant={presentationVariant}
            data-milestone={narrativeMilestone}
          >
            <CardContent className="py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-primary">{milestoneCopy.title}</p>
                  <p className="text-xs text-text-secondary">{milestoneCopy.body}</p>
                </div>
                <span className="text-xl" aria-hidden="true">
                  {narrativeMilestone === 'start'
                    ? '🧭'
                    : narrativeMilestone === 'midpoint'
                      ? '📍'
                      : '🏁'}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        <GameChallengeCard
          startCountry={challenge.start_country}
          endCountry={challenge.end_country}
          shortestPath={challenge.shortest_path}
          direction={direction}
          getCountryNameByLocale={getCountryNameByLocale}
          t={t}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="order-1 lg:order-1">
            <div data-testid="game-map">
              <MapErrorBoundary>
                <GameMap
                  startCountryCode={challenge.start_country.code}
                  endCountryCode={challenge.end_country.code}
                  startCountryName={getCountryNameByLocale(challenge.start_country)}
                  endCountryName={getCountryNameByLocale(challenge.end_country)}
                  guessedCountryCodes={guessedCountryCodes}
                  pathCountryCodes={challenge.path_country_codes || []}
                  zoom={mapZoom}
                  center={mapCenter}
                  onZoomChange={setMapZoom}
                  onCenterChange={setMapCenter}
                />
              </MapErrorBoundary>
            </div>
          </div>

          <div className="order-2 lg:order-2 space-y-4">
            {!isCompleted && (
              <div className="hidden lg:block">
                <GameActionDock
                  onCountrySelect={handleCountrySelect}
                  onInputFocusStart={handleInputFocusStart}
                  onCountryCommitted={handleCountryCommitted}
                  onHintRequest={handleHintRequest}
                  hintDisabled={hintsUsed >= 3}
                  hintPending={hintMutation.isPending}
                  disabled={guessMutation.isPending}
                  placeholder={t('game.enterCountry')}
                  hintLabel={t('game.nextHint')}
                />
              </div>
            )}

            {isCompleted ? (
              <Card className="bg-success/10 border-success">
                <CardContent className="text-center" data-testid="game-completion-card">
                  <div className="text-4xl mb-2">🎉</div>
                  <h2 className="text-xl font-bold text-success mb-2">{t('game.completed')}</h2>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-2xl font-bold text-primary">{score}</div>
                      <div className="text-sm text-text-secondary">{t('game.score')}</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-primary">{guesses.length}</div>
                      <div className="text-sm text-text-secondary">{t('game.totalGuesses')}</div>
                    </div>
                  </div>
                  <div className="mb-4" data-testid="completion-grade">
                    <p className="text-xs text-text-secondary">{t('game.completion.gradeLabel')}</p>
                    <p className="text-base font-bold text-primary">{getCompletionGradeLabel(qualityTier)}</p>
                  </div>
                  {qualityExplanation && <p className="text-sm text-text-secondary">{qualityExplanation}</p>}
                  {isHybridPresentation && (
                    <Card
                      className="mt-4 border border-primary/25 bg-primary/5"
                      data-testid="postgame-recap-card"
                    >
                      <CardContent className="py-3 text-start">
                        <p className="text-sm font-semibold text-primary">{t('game.recap.title')}</p>
                        <p className="mt-1 text-xs text-text-secondary">
                          {t('game.recap.summary', {
                            from: getCountryNameByLocale(challenge.start_country),
                            to: getCountryNameByLocale(challenge.end_country),
                            guesses: guesses.length,
                            shortestPath: challenge.shortest_path,
                          })}
                        </p>
                        <p className="mt-1 text-xs text-text-secondary">
                          {t('game.recap.retentionHook')}
                        </p>
                        <div className="mt-3 flex flex-col gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleShareRecap}
                            data-testid="share-recap-button"
                          >
                            {shareStatus === 'copied'
                              ? t('common.copied')
                              : shareStatus === 'error'
                                ? t('common.retry')
                                : t('game.recap.shareCta')}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => router.push(`/${locale}/leaderboard`)}
                            data-testid="recap-leaderboard-cta"
                          >
                            {t('game.recap.leaderboardCta')}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  <Button
                    className="mt-4 w-full"
                    onClick={handleRetryCta}
                    data-testid="completion-retry-cta"
                  >
                    {t('game.completion.retryCta')}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <GameHintsPanel
                hintsUsed={hintsUsed}
                hintsTitle={t('game.hints')}
                hintsRemainingLabel={t('game.hintsRemaining')}
                nextHintLabel={t('game.nextHint')}
                hintPending={hintMutation.isPending}
                currentHint={currentHint}
                formatHintDisplay={formatHintDisplay}
                onHintRequest={handleHintRequest}
              />
            )}

            <GameGuessList
              guesses={guesses}
              getCountryNameByLocale={getCountryNameByLocale}
              title={t('game.guesses')}
              noGuessesLabel={t('game.noGuessesYet')}
              startTypingLabel={t('game.startTyping')}
            />
          </div>
        </div>
      </div>

      {!isCompleted && (
        <GameActionDock
          fixedMobile
          onCountrySelect={handleCountrySelect}
          onInputFocusStart={handleInputFocusStart}
          onCountryCommitted={handleCountryCommitted}
          onHintRequest={handleHintRequest}
          hintDisabled={hintsUsed >= 3}
          hintPending={hintMutation.isPending}
          disabled={guessMutation.isPending}
          placeholder={t('game.enterCountry')}
          hintLabel={t('game.nextHint')}
        />
      )}
    </main>
  );
}
