'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  ChevronDown,
  ChevronUp,
  Map,
  ArrowRight,
  Lightbulb,
  Share2,
  Trophy,
  Hash,
  ChevronRight,
  Compass,
  MapPin,
  Home,
  HelpCircle,
  BarChart3,
  User,
} from 'lucide-react';
import { getDailyChallenge, submitGuess, useHint } from '@/lib/api/game';
import { useGameStore } from '@/lib/stores/gameStore';
import { CountryInput } from '@/components/game/CountryInput';
import { EmojiScore } from '@/components/game/EmojiScore';
import { MapSkeleton, MapErrorBoundary } from '@/components/game/GameMap';
import { Button } from '@/components/ui';
import type { Country, GuessEntry, HintType, HintResponse } from '@/types/game';

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

  const [currentHint, setCurrentHint] = useState<HintResponse | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['dailyChallenge'],
    queryFn: () => getDailyChallenge(),
  });

  useEffect(() => {
    if (data) {
      setChallenge(data);
    }
  }, [data, setChallenge]);

  const guessedCountryCodes = useMemo(() => {
    return guesses.map((guess) => ({
      code: guess.country_id.toUpperCase(),
      isOnPath: guess.emoji === '🟢' || guess.emoji === '🟡',
    }));
  }, [guesses]);

  const guessMutation = useMutation({
    mutationFn: (country: Country) =>
      submitGuess({
        challenge_id: challenge!.id,
        country_id: country.id,
      }),
    onSuccess: (response) => {
      const newGuess: GuessEntry = {
        country_id: response.country.id,
        name_ar: response.country.name_ar,
        flag_emoji: response.country.flag_emoji,
        emoji: response.score_emoji,
        order: guesses.length + 1,
      };
      addGuess(newGuess);

      if (response.game_complete) {
        completeGame(1000 - (response.total_guesses - challenge!.shortest_path) * 50);
      }
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

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

  const handleHintRequest = (hintType: HintType) => {
    if (!challenge || hintsUsed >= 3 || hintMutation.isPending) return;
    hintMutation.mutate(hintType);
  };

  const formatHintDisplay = (hint: HintResponse): string => {
    const { hint_type, hint_data } = hint;

    if (hint_type === 'border_hint' && hint_data.country) {
      const country = hint_data.country as { name_ar: string; flag_emoji?: string };
      return `${country.flag_emoji || ''} ${country.name_ar}`;
    }

    if (hint_type === 'all_borders_hint' && hint_data.countries) {
      const countries = hint_data.countries as Array<{ name_ar: string; flag_emoji?: string }>;
      return countries.map((c) => `${c.flag_emoji || ''} ${c.name_ar}`).join('\u060C ');
    }

    if (hint_type === 'first_letter_hint' && hint_data.letter) {
      return hint_data.letter as string;
    }

    return JSON.stringify(hint_data);
  };

  const handleCountrySelect = (country: Country) => {
    if (!challenge || isCompleted) return;

    const alreadyGuessed = guesses.some((g) => g.country_id === country.id);
    if (alreadyGuessed) {
      setError(t('errors.alreadyGuessed'));
      return;
    }

    guessMutation.mutate(country);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Compass className="w-8 h-8 text-primary animate-pulse-soft" />
          </div>
          <p className="text-text-secondary font-medium">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="bg-surface rounded-2xl border border-border p-8 max-w-md w-full text-center shadow-sm">
          <p className="text-error mb-4 font-medium">{t('common.error')}</p>
          <Button onClick={() => window.location.reload()}>
            {t('common.retry')}
          </Button>
        </div>
      </div>
    );
  }

  if (!challenge) return null;

  return (
    <main className="min-h-screen bg-background pb-24">
      {/* Header */}
      <nav className="sticky top-0 z-50 bg-surface/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/ar"
              className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-text-primary">{t('game.title')}</h1>
              <p className="text-xs text-text-muted">{t('game.subtitle')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <Hash className="w-4 h-4" />
            <span>{t('game.guesses')} {guesses.length}</span>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Challenge Display */}
        <div className="bg-surface rounded-2xl border border-border p-6 mb-6 shadow-xs">
          <div className="flex items-center justify-between gap-4">
            <div className="text-center flex-1">
              <div className="text-3xl mb-2">{challenge.start_country.flag_emoji}</div>
              <div className="font-bold text-text-primary text-sm">{challenge.start_country.name_ar}</div>
              <div className="text-[11px] text-text-muted mt-0.5 uppercase tracking-wide">{t('game.from')}</div>
            </div>

            <div className="flex items-center gap-2">
              <div className="h-[1px] w-8 bg-border" />
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <ArrowRight className="w-5 h-5 text-primary flip-x" />
              </div>
              <div className="h-[1px] w-8 bg-border" />
            </div>

            <div className="text-center flex-1">
              <div className="text-3xl mb-2">{challenge.end_country.flag_emoji}</div>
              <div className="font-bold text-text-primary text-sm">{challenge.end_country.name_ar}</div>
              <div className="text-[11px] text-text-muted mt-0.5 uppercase tracking-wide">{t('game.to')}</div>
            </div>
          </div>

          <div className="text-center mt-5 pt-4 border-t border-border">
            <span className="inline-flex items-center gap-2 text-xs text-text-muted bg-background rounded-full px-3 py-1.5">
              <MapPin className="w-3.5 h-3.5" />
              {t('game.shortestPath')}: {challenge.shortest_path}{' '}
              {challenge.shortest_path === 1 ? '\u062F\u0648\u0644\u0629' : '\u062F\u0648\u0644'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Map Section */}
          <div className="order-2 lg:order-1">
            <div className="lg:hidden mb-4">
              <Button
                variant="outline"
                onClick={toggleMap}
                className="w-full flex items-center justify-center gap-2"
              >
                <Map className="w-4 h-4" />
                {showMap ? t('game.map.hideMap') : t('game.map.showMap')}
                {showMap ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>

            <div className={`${showMap ? 'block' : 'hidden'} lg:block`}>
              <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-xs">
                <MapErrorBoundary>
                  <GameMap
                    startCountryCode={challenge.start_country.code}
                    endCountryCode={challenge.end_country.code}
                    guessedCountryCodes={guessedCountryCodes}
                    zoom={mapZoom}
                    center={mapCenter}
                    onZoomChange={setMapZoom}
                    onCenterChange={setMapCenter}
                  />
                </MapErrorBoundary>
              </div>
            </div>
          </div>

          {/* Game Controls Section */}
          <div className="order-1 lg:order-2 space-y-5">
            {/* Game Completed */}
            {isCompleted ? (
              <div className="bg-surface rounded-2xl border border-success/30 p-8 text-center shadow-xs">
                <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-8 h-8 text-success" />
                </div>
                <h2 className="text-xl font-bold text-text-primary mb-2">
                  {t('game.completed')}
                </h2>
                <p className="text-text-secondary mb-6 text-sm">
                  {t('game.completedMessage')}
                </p>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-background rounded-xl p-4">
                    <div className="text-2xl font-bold text-primary">{score}</div>
                    <div className="text-xs text-text-muted mt-1">{t('game.score')}</div>
                  </div>
                  <div className="bg-background rounded-xl p-4">
                    <div className="text-2xl font-bold text-primary">{guesses.length}</div>
                    <div className="text-xs text-text-muted mt-1">{t('game.totalGuesses')}</div>
                  </div>
                </div>
                <Button variant="primary" className="w-full gap-2">
                  <Share2 className="w-4 h-4" />
                  {t('game.shareResult')}
                </Button>
              </div>
            ) : (
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
              <div className="bg-surface rounded-2xl border border-border p-5 shadow-xs">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="w-4 h-4 text-text-muted" />
                  <span className="text-sm font-bold text-text-primary">
                    {t('game.hints')}
                  </span>
                  <span className="text-xs text-text-muted mr-auto">
                    ({3 - hintsUsed} {t('game.hintsRemaining')})
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={hintsUsed >= 3 || hintMutation.isPending}
                    className="flex-1 text-xs"
                    onClick={() => handleHintRequest('border_hint')}
                  >
                    {t('game.hintTypes.border')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={hintsUsed >= 3 || hintMutation.isPending}
                    className="flex-1 text-xs"
                    onClick={() => handleHintRequest('all_borders_hint')}
                  >
                    {t('game.hintTypes.allBorders')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={hintsUsed >= 3 || hintMutation.isPending}
                    className="flex-1 text-xs"
                    onClick={() => handleHintRequest('first_letter_hint')}
                  >
                    {t('game.hintTypes.firstLetter')}
                  </Button>
                </div>

                {currentHint && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200/60 rounded-xl">
                    <div className="text-xs text-yellow-700 font-medium mb-1">
                      {currentHint.hint_type === 'border_hint' && t('game.hintTypes.border')}
                      {currentHint.hint_type === 'all_borders_hint' && t('game.hintTypes.allBorders')}
                      {currentHint.hint_type === 'first_letter_hint' && t('game.hintTypes.firstLetter')}
                    </div>
                    <div className="text-sm text-yellow-900 font-medium">
                      {formatHintDisplay(currentHint)}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Guesses History */}
            <div className="bg-surface rounded-2xl border border-border shadow-xs overflow-hidden">
              <div className="flex items-center gap-2 p-5 pb-4 border-b border-border">
                <span className="text-sm font-bold text-text-primary">
                  {t('game.guesses')}
                </span>
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                  {guesses.length}
                </span>
              </div>
              <div className="p-5 pt-4">
                {guesses.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="w-12 h-12 rounded-2xl bg-background flex items-center justify-center mx-auto mb-3">
                      <MapPin className="w-5 h-5 text-text-muted" />
                    </div>
                    <p className="text-sm text-text-secondary font-medium">{t('game.noGuessesYet')}</p>
                    <p className="text-xs text-text-muted mt-1">{t('game.startTyping')}</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {guesses.map((guess, index) => (
                      <div
                        key={guess.country_id}
                        className="flex items-center gap-3 p-3 bg-background rounded-xl"
                      >
                        <span className="w-7 h-7 rounded-lg bg-surface border border-border flex items-center justify-center text-xs font-bold text-text-muted">
                          {index + 1}
                        </span>
                        <span className="text-xl">{guess.flag_emoji}</span>
                        <span className="flex-1 font-medium text-sm text-text-primary">{guess.name_ar}</span>
                        <EmojiScore emoji={guess.emoji} size="sm" animate={false} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-lg border-t border-border" aria-label="Navigation">
        <div className="max-w-5xl mx-auto flex justify-around items-center h-16 px-4">
          <Link href="/ar" className="flex flex-col items-center gap-1 text-text-muted hover:text-primary transition-colors">
            <Home className="w-5 h-5" />
            <span className="text-[11px] font-medium">{t('nav.home')}</span>
          </Link>
          <Link href="/ar/game" className="flex flex-col items-center gap-1 text-primary">
            <MapPin className="w-5 h-5" />
            <span className="text-[11px] font-medium">{t('nav.game')}</span>
          </Link>
          <Link href="/ar/quiz" className="flex flex-col items-center gap-1 text-text-muted hover:text-primary transition-colors">
            <HelpCircle className="w-5 h-5" />
            <span className="text-[11px] font-medium">{t('nav.quiz')}</span>
          </Link>
          <Link href="/ar/stats" className="flex flex-col items-center gap-1 text-text-muted hover:text-primary transition-colors">
            <BarChart3 className="w-5 h-5" />
            <span className="text-[11px] font-medium">{t('nav.stats')}</span>
          </Link>
          <Link href="/ar/profile" className="flex flex-col items-center gap-1 text-text-muted hover:text-primary transition-colors">
            <User className="w-5 h-5" />
            <span className="text-[11px] font-medium">{t('nav.profile')}</span>
          </Link>
        </div>
      </nav>
    </main>
  );
}
