'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/lib/stores/authStore';
import { getLeaderboard } from '@/lib/api/users';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui';
import type { LeaderboardType } from '@/types/user';

const FILTERS: LeaderboardType[] = ['max_streak', 'games_won', 'current_streak'];

function getMedal(rank: number): string | null {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return null;
}

export function LeaderboardPage() {
  const t = useTranslations();
  const accessToken = useAuthStore((s) => s.accessToken);
  const [type, setType] = useState<LeaderboardType>('max_streak');

  const { data, isLoading, error } = useQuery({
    queryKey: ['leaderboard', type, Boolean(accessToken)],
    queryFn: () => getLeaderboard(type, 100, accessToken || undefined),
  });

  const typeLabel = useMemo(() => {
    if (type === 'max_streak') return t('leaderboard.types.maxStreak');
    if (type === 'games_won') return t('leaderboard.types.gamesWon');
    return t('leaderboard.types.currentStreak');
  }, [t, type]);

  return (
    <main className="max-w-4xl mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t('leaderboard.title')}</CardTitle>
          <p className="text-sm text-text-secondary">
            {t('leaderboard.currentFilter', { filter: typeLabel })}
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((filterType) => (
              <Button
                key={filterType}
                size="sm"
                variant={type === filterType ? 'primary' : 'outline'}
                onClick={() => setType(filterType)}
              >
                {filterType === 'max_streak' && t('leaderboard.types.maxStreak')}
                {filterType === 'games_won' && t('leaderboard.types.gamesWon')}
                {filterType === 'current_streak' && t('leaderboard.types.currentStreak')}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <Card>
          <CardContent>{t('common.loading')}</CardContent>
        </Card>
      )}

      {error && (
        <Card>
          <CardContent className="text-error">{t('common.error')}</CardContent>
        </Card>
      )}

      {data && (
        <>
          {accessToken && data.user_rank && (
            <Card>
              <CardContent className="font-medium">
                {t('leaderboard.yourRank')}: #{data.user_rank}
              </CardContent>
            </Card>
          )}

          <Card data-testid="leaderboard">
            <CardContent className="space-y-2">
              {data.entries.length === 0 ? (
                <p className="text-text-secondary">{t('leaderboard.empty')}</p>
              ) : (
                data.entries.map((entry) => (
                  <div
                    key={entry.user_id}
                    className="grid grid-cols-[auto_1fr_auto] gap-3 items-center p-3 rounded-lg border border-border"
                    data-testid="leaderboard-item"
                  >
                    <div className="min-w-12 font-bold" data-testid="user-rank">
                      {getMedal(entry.rank) ? `${getMedal(entry.rank)} ` : ''}#{entry.rank}
                    </div>
                    <div>
                      <div className="font-medium" data-testid="user-name">
                        {entry.display_name || entry.username || t('leaderboard.anonymous')}
                      </div>
                      <div className="text-xs text-text-secondary">
                        {t('leaderboard.games')}: {entry.games_played}
                        {entry.home_country_code
                          ? ` • ${t('leaderboard.country')}: ${entry.home_country_code}`
                          : ''}
                      </div>
                    </div>
                    <div className="text-lg font-bold text-primary" data-testid="user-score">
                      {entry.score}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </>
      )}
    </main>
  );
}
