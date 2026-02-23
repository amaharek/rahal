'use client';

import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useDirection } from '@/lib/hooks/useDirection';
import { useGameSession } from '@/lib/hooks/useGameSession';
import { useGameTelemetry } from '@/lib/hooks/useGameTelemetry';
import { useGameNarrative } from '@/lib/hooks/useGameNarrative';
import { MapSkeleton, MapErrorBoundary } from '@/components/game/GameMap';
import { GameHUD } from '@/components/game/GameHUD';
import { GameChallengeCard } from '@/components/game/GameChallengeCard';
import { GameActionDock } from '@/components/game/GameActionDock';
import { GameHintsPanel } from '@/components/game/GameHintsPanel';
import { GameGuessList } from '@/components/game/GameGuessList';
import { GameLayout } from '@/components/game/GameLayout';
import { Card, CardContent, Button } from '@/components/ui';

const GameMap = dynamic(
  () =>
    import('@/components/game/GameMap')
      .then((mod) => {
        if (!mod.GameMap) throw new Error('GameMap component not found in module');
        return mod.GameMap;
      })
      .catch((error) => {
        console.error('[DailyGamePage] Failed to load GameMap:', error);
        throw error;
      }),
  { ssr: false, loading: () => <MapSkeleton /> }
);

export function DailyGamePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations();
  const locale = useLocale();
  const direction = useDirection();

  const presentationOverride = searchParams.get('presentation');

  // ── Core session (data, mutations, state) ───────────────────────────────
  const session = useGameSession(presentationOverride);

  const {
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
    efficiencyBucket,
    hintsRemaining,
    isLoading,
    error,
    isGuessPending,
    isHintPending,
    setRouteMode,
    setMapZoom,
    setMapCenter,
    handleCountrySelect,
    handleHintRequest: _handleHintRequest,
    handleShareRecap: _handleShareRecap,
    getCountryNameByLocale,
  } = session;

  // ── Narrative / presentation variant ───────────────────────────────────
  const { isHybridPresentation, narrativeMilestone, milestoneCopy, milestoneEmoji } =
    useGameNarrative({
      challengeId: challenge?.id,
      challengeDate: challenge?.challenge_date,
      startCountry: challenge?.start_country,
      endCountry: challenge?.end_country,
      shortestPath: challenge?.shortest_path ?? 1,
      guessesCount: guesses.length,
      isCompleted,
      presentationOverride,
    });

  // ── Telemetry ───────────────────────────────────────────────────────────
  const telemetry = useGameTelemetry({
    challengeId: challenge?.id,
    routeMode,
    guessesCount: guesses.length,
    isCompleted,
    score,
    qualityTier,
    streakValue,
    hintsRemaining,
    efficiencyBucket,
    shortestPath: challenge?.shortest_path,
    deltaFromShortestPath: benchmark.deltaFromShortestPath,
    presentationVariant: session.presentationVariant,
    isHybridPresentation,
    narrativeMilestone,
    combo,
    momentum,
  });

  // Fire combo telemetry when transition changes
  if (lastComboTransition && lastComboTransition.transition !== 'no_change') {
    telemetry.trackCombo(lastComboTransition);
  }

  // ── Helpers ─────────────────────────────────────────────────────────────
  const formatHintDisplay = (hint: typeof currentHint): string => {
    if (!hint) return '';
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

  const getCompletionGradeLabel = () => {
    if (!qualityTier) return t('game.completion.gradeLevels.good_discovery');
    return t(`game.completion.gradeLevels.${qualityTier}`);
  };

  const handleHintRequest = () => {
    telemetry.trackHint();
    _handleHintRequest();
  };

  const handleCountryCommitted = (_countryCode: string) => {
    if (!challenge || isCompleted) return;
    telemetry.trackDock('submit_guess');
  };

  const handleInputFocusStart = () => {
    if (!challenge || isCompleted) return;
    telemetry.trackFocusStart();
  };

  const handleCountrySelectWithTelemetry = (country: import('@/types/game').Country) => {
    if (challenge && !isCompleted) {
      telemetry.trackGuess(country.code);
    }
    handleCountrySelect(country);
  };

  const handleRetryCta = () => {
    if (!challenge) return;
    telemetry.trackRetry('practice');
    const params = new URLSearchParams({
      from: challenge.start_country.id,
      to: challenge.end_country.id,
      mode: routeMode,
    });
    router.push(`/${locale}/game/practice?${params.toString()}`);
  };

  const handleShareRecap = async () => {
    await _handleShareRecap();
    if (challenge) {
      telemetry.trackShare(
        typeof navigator !== 'undefined' && typeof navigator.share === 'function'
          ? 'native'
          : 'clipboard'
      );
    }
  };

  // ── Loading / error states ──────────────────────────────────────────────
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

  if (!challenge) return null;

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <GameLayout
      title={t('game.title')}
      subtitle={t('game.subtitle')}
      showMobileDock={!isCompleted}
      dockProps={
        !isCompleted
          ? {
              onCountrySelect: handleCountrySelectWithTelemetry,
              onInputFocusStart: handleInputFocusStart,
              onCountryCommitted: handleCountryCommitted,
              onHintRequest: handleHintRequest,
              hintDisabled: hintsUsed >= 3,
              hintPending: isHintPending,
              disabled: isGuessPending,
              placeholder: t('game.enterCountry'),
              hintLabel: t('game.nextHint'),
            }
          : undefined
      }
    >
      {/* Route mode selector */}
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
          data-variant={session.presentationVariant}
          data-milestone={narrativeMilestone}
        >
          <CardContent className="py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-primary">{milestoneCopy.title}</p>
                <p className="text-xs text-text-secondary">{milestoneCopy.body}</p>
              </div>
              <span className="text-xl" aria-hidden="true">{milestoneEmoji}</span>
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

        <div className="space-y-4">
          {!isCompleted && (
            <div className="hidden lg:block">
              <GameActionDock
                onCountrySelect={handleCountrySelectWithTelemetry}
                onInputFocusStart={handleInputFocusStart}
                onCountryCommitted={handleCountryCommitted}
                onHintRequest={handleHintRequest}
                hintDisabled={hintsUsed >= 3}
                hintPending={isHintPending}
                disabled={isGuessPending}
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
                  <p className="text-base font-bold text-primary">{getCompletionGradeLabel()}</p>
                </div>
                {qualityExplanation && (
                  <p className="text-sm text-text-secondary">{qualityExplanation}</p>
                )}
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
              hintPending={isHintPending}
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
    </GameLayout>
  );
}
