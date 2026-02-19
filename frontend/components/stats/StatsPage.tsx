'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui';
import { useAuthStore } from '@/lib/stores/authStore';
import { getGameStats } from '@/lib/api/game';
import { getQuizStats } from '@/lib/api/quiz';

export function StatsPage() {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const accessToken = useAuthStore((s) => s.accessToken);
  const isInitialized = useAuthStore((s) => s.isInitialized);

  const signInHref = useMemo(() => {
    const next = encodeURIComponent(pathname || `/${locale}/stats`);
    return `/${locale}/auth/sign-in?next=${next}`;
  }, [locale, pathname]);

  const gameStatsQuery = useQuery({
    queryKey: ['game-stats'],
    queryFn: () => getGameStats(accessToken!),
    enabled: Boolean(accessToken),
  });

  const quizStatsQuery = useQuery({
    queryKey: ['quiz-stats'],
    queryFn: () => getQuizStats(accessToken!),
    enabled: Boolean(accessToken),
  });

  if (!isInitialized) {
    return (
      <main className="max-w-4xl mx-auto p-4">
        <Card>
          <CardContent>{t('common.loading')}</CardContent>
        </Card>
      </main>
    );
  }

  if (!accessToken) {
    return (
      <main className="max-w-4xl mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>{t('stats.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>{t('stats.signInRequired')}</p>
            <Link href={signInHref}>
              <Button>{t('auth.signIn')}</Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (gameStatsQuery.isLoading || quizStatsQuery.isLoading) {
    return (
      <main className="max-w-4xl mx-auto p-4">
        <Card>
          <CardContent>{t('common.loading')}</CardContent>
        </Card>
      </main>
    );
  }

  if (gameStatsQuery.error || quizStatsQuery.error || !gameStatsQuery.data || !quizStatsQuery.data) {
    return (
      <main className="max-w-4xl mx-auto p-4">
        <Card>
          <CardContent className="text-error">{t('common.error')}</CardContent>
        </Card>
      </main>
    );
  }

  const gameStats = gameStatsQuery.data;
  const quizStats = quizStatsQuery.data;

  return (
    <main className="max-w-4xl mx-auto p-4 space-y-4" data-testid="user-stats">
      <Card>
        <CardHeader>
          <CardTitle>{t('stats.gameStats')}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <div data-testid="games-played">{t('stats.gamesPlayed')}: {gameStats.games_played}</div>
          <div>{t('stats.gamesWon')}: {gameStats.games_won}</div>
          <div data-testid="win-rate">{t('stats.winRate')}: {gameStats.win_rate.toFixed(1)}%</div>
          <div data-testid="current-streak">{t('stats.currentStreak')}: {gameStats.current_streak}</div>
          <div>{t('stats.maxStreak')}: {gameStats.max_streak}</div>
          <div>{t('stats.averageGuesses')}: {gameStats.average_guesses.toFixed(1)}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('stats.quizStats')}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <div>{t('stats.totalQuestions')}: {quizStats.total_answered}</div>
          <div>{t('stats.correctAnswers')}: {quizStats.total_correct}</div>
          <div>{t('stats.accuracy')}: {quizStats.accuracy.toFixed(1)}%</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('stats.byCategory')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {Object.entries(quizStats.by_category).map(([name, stat]) => (
            <div key={name} className="flex items-center justify-between text-sm border-b border-border pb-2">
              <span>{name}</span>
              <span>{stat.correct}/{stat.answered} ({stat.accuracy.toFixed(1)}%)</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('stats.byDifficulty')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {Object.entries(quizStats.by_difficulty).map(([name, stat]) => (
            <div key={name} className="flex items-center justify-between text-sm border-b border-border pb-2">
              <span>{name}</span>
              <span>{stat.correct}/{stat.answered} ({stat.accuracy.toFixed(1)}%)</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </main>
  );
}
