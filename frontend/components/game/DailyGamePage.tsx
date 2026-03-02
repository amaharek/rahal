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
import { GameHeaderBar } from '@/components/game/GameHeaderBar';
import { GameCompletionSheet } from '@/components/game/GameCompletionSheet';
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

  if (lastComboTransition && lastComboTransition.transition !== 'no_change') {
    telemetry.trackCombo(lastComboTransition);
  }

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

  const dockSharedProps = {
    onCountrySelect: handleCountrySelectWithTelemetry,
    onInputFocusStart: handleInputFocusStart,
    onCountryCommitted: handleCountryCommitted,
    onHintRequest: handleHintRequest,
    hintDisabled: hintsUsed >= 3,
    hintPending: isHintPending,
    disabled: isGuessPending,
    placeholder: t('game.enterCountry'),
    hintLabel: t('game.nextHint'),
  };

  return (
    <GameLayout
      title={t('game.title')}
      subtitle={t('game.subtitle')}
      showMobileDock={!isCompleted}
      dockProps={!isCompleted ? dockSharedProps : undefined}
    >
      <GameHeaderBar
        startCountry={challenge.start_country}
        endCountry={challenge.end_country}
        routeMode={routeMode}
        onRouteModeChange={setRouteMode}
        getCountryNameByLocale={getCountryNameByLocale}
        direction={direction}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4 mt-3">
        {/* Left: map hero with HUD overlay */}
        <div className="relative min-h-[50vh] overflow-hidden rounded-lg" data-testid="game-map">
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
          {/* Mobile overlay — hidden on desktop (sidebar card takes over) */}
          <div className="absolute bottom-0 left-0 right-0 p-2 lg:hidden">
            <GameHUD
              streak={streakValue}
              guessCount={guesses.length}
              combo={combo}
              momentum={momentum}
              variant="compact"
            />
          </div>
        </div>

        {/* Right: action area */}
        <div className="space-y-3">
          {/* Desktop HUD card — hidden on mobile (map overlay takes over) */}
          <div className="hidden lg:block">
            <GameHUD
              streak={streakValue}
              guessCount={guesses.length}
              combo={combo}
              momentum={momentum}
            />
          </div>

          {!isCompleted && (
            <div className="hidden lg:block">
              <GameActionDock {...dockSharedProps} />
            </div>
          )}

          <GameCompletionSheet
            isCompleted={isCompleted}
            guesses={guesses}
            score={score}
            shortestPath={challenge.shortest_path}
            qualityTier={qualityTier}
            efficiencyBucket={efficiencyBucket}
            benchmarkDelta={benchmark.deltaFromShortestPath}
            startCountry={challenge.start_country}
            endCountry={challenge.end_country}
            onShare={handleShareRecap}
            shareStatus={shareStatus}
            t={t}
            onRetry={handleRetryCta}
            onLeaderboard={() => router.push(`/${locale}/leaderboard`)}
            isHybridPresentation={isHybridPresentation}
          />

          {isHybridPresentation && (
            <Card
              className="border-primary/35 bg-primary/5"
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
                  <span className="text-xl" aria-hidden="true">
                    {milestoneEmoji}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {!isCompleted && (
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
