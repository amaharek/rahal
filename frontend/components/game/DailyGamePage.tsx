'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useDirection } from '@/lib/hooks/useDirection';
import { getDailyChallenge, getGameStats, submitGuess, useHint } from '@/lib/api/game';
import { useGameStore } from '@/lib/stores/gameStore';
import { useAuthStore } from '@/lib/stores/authStore';
import {
  resetChallengeTelemetryState,
  trackDockAction,
  trackGuessSubmission,
  trackHudRenderState,
  trackInputFocusStart,
} from '@/lib/telemetry/gameTelemetry';
import { MapSkeleton, MapErrorBoundary } from '@/components/game/GameMap';
import { GameHUD, deriveEfficiencyBucket } from '@/components/game/GameHUD';
import { GameChallengeCard } from '@/components/game/GameChallengeCard';
import { GameActionDock } from '@/components/game/GameActionDock';
import { GameHintsPanel } from '@/components/game/GameHintsPanel';
import { GameGuessList } from '@/components/game/GameGuessList';
import { Card, CardContent, Button } from '@/components/ui';
import type { Country, GuessEntry, HintResponse, RouteMode } from '@/types/game';

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
  const t = useTranslations();
  const locale = useLocale();
  const direction = useDirection();
  const [routeMode, setRouteMode] = useState<RouteMode>('shortest');
  const [currentHint, setCurrentHint] = useState<HintResponse | null>(null);
  const [qualityExplanation, setQualityExplanation] = useState<string | null>(null);

  const accessToken = useAuthStore((state) => state.accessToken);

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

  const efficiencyBucket = useMemo(
    () => (challenge ? deriveEfficiencyBucket(guesses.length, challenge.shortest_path) : 'pending'),
    [challenge, guesses.length]
  );

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

  const guessMutation = useMutation({
    mutationFn: (country: Country) =>
      submitGuess({
        challenge_id: challenge!.id,
        country_id: country.id,
        mode: routeMode,
      }),
    onSuccess: (response) => {
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

    trackGuessSubmission(challenge.id, routeMode, country.code);
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

  return (
    <main className="min-h-screen pb-[12rem] lg:pb-20">
      <header className="bg-primary text-white py-3 px-4">
        <div className="max-w-7xl mx-auto">
          <Link href={`/${locale}`} className="text-white/80 text-sm mb-1 inline-block">
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
          localeLabel={t}
        />

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
                  {qualityExplanation && <p className="text-sm text-text-secondary">{qualityExplanation}</p>}
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
