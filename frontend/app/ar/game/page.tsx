'use client';

import { useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { getDailyChallenge, submitGuess } from '@/lib/api/game';
import { useGameStore } from '@/lib/stores/gameStore';
import { CountryInput } from '@/components/game/CountryInput';
import { EmojiScore } from '@/components/game/EmojiScore';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import type { Country, GuessEntry } from '@/types/game';

export default function GamePage() {
  const t = useTranslations();
  const {
    challenge,
    guesses,
    hintsUsed,
    isCompleted,
    score,
    setChallenge,
    addGuess,
    completeGame,
    setLoading,
    setError,
  } = useGameStore();

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
        name_ar: response.country.name_ar,
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
      <header className="bg-primary text-white py-4 px-4">
        <div className="max-w-4xl mx-auto">
          <Link href="/ar" className="text-white/80 text-sm mb-2 inline-block">
            ← {t('common.back')}
          </Link>
          <h1 className="text-2xl font-bold">{t('game.title')}</h1>
          <p className="text-white/80 text-sm">{t('game.subtitle')}</p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Challenge Display */}
        <Card className="mb-6">
          <CardContent>
            <div className="flex items-center justify-between gap-4">
              {/* Start Country */}
              <div className="text-center flex-1">
                <div className="text-3xl mb-1">
                  {challenge.start_country.flag_emoji}
                </div>
                <div className="font-bold">{challenge.start_country.name_ar}</div>
                <div className="text-xs text-text-secondary">{t('game.from')}</div>
              </div>

              {/* Arrow */}
              <div className="text-2xl text-primary">→</div>

              {/* End Country */}
              <div className="text-center flex-1">
                <div className="text-3xl mb-1">
                  {challenge.end_country.flag_emoji}
                </div>
                <div className="font-bold">{challenge.end_country.name_ar}</div>
                <div className="text-xs text-text-secondary">{t('game.to')}</div>
              </div>
            </div>

            {/* Shortest Path Info */}
            <div className="text-center mt-4 pt-4 border-t border-border">
              <span className="text-sm text-text-secondary">
                {t('game.shortestPath')}: {challenge.shortest_path}{' '}
                {challenge.shortest_path === 1 ? 'دولة' : 'دول'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Game Completed */}
        {isCompleted ? (
          <Card className="mb-6 bg-success/10 border-success">
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
          <div className="mb-6">
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
          <Card className="mb-6">
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
                  disabled={hintsUsed >= 3}
                  className="flex-1"
                >
                  {t('game.hintTypes.border')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={hintsUsed >= 3}
                  className="flex-1"
                >
                  {t('game.hintTypes.allBorders')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={hintsUsed >= 3}
                  className="flex-1"
                >
                  {t('game.hintTypes.firstLetter')}
                </Button>
              </div>
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
              <div className="space-y-3">
                {guesses.map((guess, index) => (
                  <div
                    key={guess.country_id}
                    className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                  >
                    <span className="text-lg font-bold text-text-secondary w-8">
                      {index + 1}.
                    </span>
                    <span className="text-2xl">{guess.flag_emoji}</span>
                    <span className="flex-1 font-medium">{guess.name_ar}</span>
                    <EmojiScore emoji={guess.emoji} size="sm" animate={false} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
