'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ChevronDown, ChevronUp, Map } from 'lucide-react';
import { getDailyChallenge, submitGuess, useHint } from '@/lib/api/game';
import { useGameStore } from '@/lib/stores/gameStore';
import { CountryInput } from '@/components/game/CountryInput';
import { EmojiScore } from '@/components/game/EmojiScore';
import { MapSkeleton, MapErrorBoundary } from '@/components/game/GameMap';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import { useDirection } from '@/lib/hooks/useDirection';
import type { Country, GuessEntry, HintType, HintResponse } from '@/types/game';

// Lazy load GameMap (SSR disabled due to react-simple-maps)
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
        console.error('[GamePage] Failed to load GameMap:', error);
        throw error;
      }),
  {
    ssr: false,
    loading: () => <MapSkeleton />,
  }
);

export default function GamePage() {
  const t = useTranslations();
  const direction = useDirection();
  const {
    challenge,
    guesses,
    hintsUsed,
    isCompleted,
    score,
    showMap,
    mapZoom,
    mapCenter,
    setChallenge,
    addGuess,
    useHint: storeUseHint,
    completeGame,
    setError,
    toggleMap,
    setMapZoom,
    setMapCenter,
  } = useGameStore();

  // State for hint display
  const [currentHint, setCurrentHint] = useState<HintResponse | null>(null);

  // Fetch daily challenge
  const { data, isLoading, error } = useQuery({
    queryKey: ['dailyChallenge'],
    queryFn: () => getDailyChallenge(),
  });

  // Update store when challenge is fetched
  useEffect(() => {
    if (data) {
      setChallenge(data);
    }
  }, [data, setChallenge]);

  // Convert guesses to map format
  const guessedCountryCodes = useMemo(() => {
    return guesses.map((guess) => ({
      code: guess.country_code,
      isOnPath: guess.emoji === '🟢' || guess.emoji === '🟡',
    }));
  }, [guesses]);

  // Submit guess mutation
  const guessMutation = useMutation({
    mutationFn: (country: Country) =>
      submitGuess({
        challenge_id: challenge!.id,
        country_id: country.id,
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
        // Calculate score - this would come from backend
        completeGame(1000 - (response.total_guesses - challenge!.shortest_path) * 50);
      }
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  // Hint mutation
  const hintMutation = useMutation({
    mutationFn: (hintType: HintType) =>
      useHint({
        challenge_id: challenge!.id,
        hint_type: hintType,
      }),
    onSuccess: (response) => {
      setCurrentHint(response);
      storeUseHint();
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  // Handle hint request
  const handleHintRequest = (hintType: HintType) => {
    if (!challenge || hintsUsed >= 3 || hintMutation.isPending) return;
    hintMutation.mutate(hintType);
  };

  // Format hint data for display
  const formatHintDisplay = (hint: HintResponse): string => {
    const { hint_type, hint_data } = hint;

    if (hint_type === 'border_hint') {
      const countryName = (hint_data.country_name_en ||
        hint_data.country_name_ar) as string | undefined;
      const borderCountries = hint_data.border_countries as string[];
      if (countryName && borderCountries?.length) {
        return t('game.hintDisplay.borderHint', {
          country: countryName,
          countries: borderCountries.join(', '),
        });
      }
    }

    if (hint_type === 'all_borders_hint' && hint_data.path_countries) {
      const pathCountries = hint_data.path_countries as string[];
      return t('game.hintDisplay.pathHint', {
        countries: pathCountries.join(' → '),
      });
    }

    if (hint_type === 'first_letter_hint' && hint_data.first_letters) {
      const letters = hint_data.first_letters as string[];
      return t('game.hintDisplay.firstLettersHint', {
        letters: letters.join(', '),
      });
    }

    return JSON.stringify(hint_data);
  };

  const handleCountrySelect = (country: Country) => {
    if (!challenge || isCompleted) return;

    // Check if already guessed
    const alreadyGuessed = guesses.some((g) => g.country_id === country.id);
    if (alreadyGuessed) {
      setError(t('errors.alreadyGuessed'));
      return;
    }

    guessMutation.mutate(country);
  };

  const getCountryNameByLocale = (country: { name_ar: string; name_en: string }) => {
    return country.name_en || country.name_ar;
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
            <Button onClick={() => window.location.reload()}>
              {t('common.retry')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!challenge) return null;

  return (
    <main className="min-h-screen pb-20">
      {/* Header */}
      <header className="bg-primary text-white py-3 px-4">
        <div className="max-w-7xl mx-auto">
          <Link href="/es" className="text-white/80 text-sm mb-1 inline-block">
            ← {t('common.back')}
          </Link>
          <h1 className="text-xl font-bold">{t('game.title')}</h1>
          <p className="text-white/80 text-xs">{t('game.subtitle')}</p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-3">
        {/* Challenge Display */}
        <Card className="mb-3">
          <CardContent className="py-2">
            <div className="flex items-center justify-between gap-3">
              {/* Start Country */}
              <div className="text-center flex-1">
                <div className="text-2xl mb-0.5">
                  {challenge.start_country.flag_emoji}
                </div>
                <div className="font-bold text-sm">
                  {getCountryNameByLocale(challenge.start_country)}
                </div>
                <div className="text-xs text-text-secondary">{t('game.from')}</div>
              </div>

              {/* Arrow */}
              <div className="text-xl text-primary">{direction === 'rtl' ? '←' : '→'}</div>

              {/* End Country */}
              <div className="text-center flex-1">
                <div className="text-2xl mb-0.5">
                  {challenge.end_country.flag_emoji}
                </div>
                <div className="font-bold text-sm">
                  {getCountryNameByLocale(challenge.end_country)}
                </div>
                <div className="text-xs text-text-secondary">{t('game.to')}</div>
              </div>
            </div>

            {/* Shortest Path Info */}
            <div className="text-center mt-2 pt-2 border-t border-border">
              <span className="text-xs text-text-secondary">
                {t('game.shortestPath')}: {challenge.shortest_path}{' '}
                {t('game.pathCountriesUnit')}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-3">
          <CardContent className="py-3 flex items-center justify-between gap-3">
            <div className="text-sm text-text-secondary">{t('practice.cta')}</div>
            <Link href="/es/game/practice">
              <Button size="sm" variant="outline">{t('practice.startButton')}</Button>
            </Link>
          </CardContent>
        </Card>

        {/* Two-column layout for desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Map Section - First on mobile (order-1), First on desktop (lg:order-1) */}
          <div className="order-1 lg:order-1">
            {/* Mobile: Collapsible Map */}
            <div className="lg:hidden mb-4">
              <Button
                variant="outline"
                onClick={toggleMap}
                className="w-full flex items-center justify-center gap-2"
              >
                <Map className="w-4 h-4" />
                {showMap ? t('game.map.hideMap') : t('game.map.showMap')}
                {showMap ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </div>

            {/* Map Component */}
            <div className={`${showMap ? 'block' : 'hidden'} lg:block`}>
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

          {/* Game Controls Section - Second on mobile (order-2), Second on desktop (lg:order-2) */}
          <div className="order-2 lg:order-2 space-y-4">
            {/* Game Completed */}
            {isCompleted ? (
              <Card className="bg-success/10 border-success">
                <CardContent className="text-center">
                  <div className="text-4xl mb-2">🎉</div>
                  <h2 className="text-xl font-bold text-success mb-2">
                    {t('game.completed')}
                  </h2>
                  <p className="text-text-secondary mb-4">
                    {t('game.completedMessage')}
                  </p>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-2xl font-bold text-primary">{score}</div>
                      <div className="text-sm text-text-secondary">
                        {t('game.score')}
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-primary">
                        {guesses.length}
                      </div>
                      <div className="text-sm text-text-secondary">
                        {t('game.totalGuesses')}
                      </div>
                    </div>
                  </div>
                  <Button variant="primary" className="w-full">
                    {t('game.shareResult')}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              /* Country Input */
              <div>
                <CountryInput
                  onSelect={handleCountrySelect}
                  placeholder={t('game.enterCountry')}
                  disabled={guessMutation.isPending}
                  autoFocus
                />
              </div>
            )}

            {/* Hints */}
            {!isCompleted && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {t('game.hints')} ({3 - hintsUsed} {t('game.hintsRemaining')})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={hintsUsed >= 3 || hintMutation.isPending}
                      className="flex-1"
                      onClick={() => handleHintRequest('border_hint')}
                    >
                      {t('game.hintTypes.border')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={hintsUsed >= 3 || hintMutation.isPending}
                      className="flex-1"
                      onClick={() => handleHintRequest('all_borders_hint')}
                    >
                      {t('game.hintTypes.allBorders')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={hintsUsed >= 3 || hintMutation.isPending}
                      className="flex-1"
                      onClick={() => handleHintRequest('first_letter_hint')}
                    >
                      {t('game.hintTypes.firstLetter')}
                    </Button>
                  </div>

                  {/* Hint Display */}
                  {currentHint && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="text-sm text-yellow-800 font-medium mb-1">
                        {currentHint.hint_type === 'border_hint' && t('game.hintTypes.border')}
                        {currentHint.hint_type === 'all_borders_hint' && t('game.hintTypes.allBorders')}
                        {currentHint.hint_type === 'first_letter_hint' && t('game.hintTypes.firstLetter')}
                      </div>
                      <div className="text-yellow-900">
                        {formatHintDisplay(currentHint)}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Guesses History */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {t('game.guesses')} ({guesses.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {guesses.length === 0 ? (
                  <div className="text-center py-8 text-text-secondary">
                    <p>{t('game.noGuessesYet')}</p>
                    <p className="text-sm mt-2">{t('game.startTyping')}</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {guesses.map((guess, index) => (
                      <div
                        key={guess.country_id}
                        className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg"
                      >
                        <span className="text-lg font-bold text-text-secondary w-8">
                          {index + 1}.
                        </span>
                        <span className="text-2xl">{guess.flag_emoji}</span>
                        <span className="flex-1 font-medium">
                          {guess.name_en || guess.name_ar}
                        </span>
                        <EmojiScore emoji={guess.emoji} size="sm" animate={false} />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
