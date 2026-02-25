'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/stores/authStore';
import { getGameStats } from '@/lib/api/game';

export function useHomeStats() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const isAuthenticated = Boolean(accessToken);

  const { data, isLoading } = useQuery({
    queryKey: ['homeStats', accessToken],
    queryFn: () => getGameStats(accessToken!),
    enabled: isInitialized && isAuthenticated,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: false,
  });

  const today = new Date().toISOString().split('T')[0];
  const playedToday = data?.last_played === today;

  const justExtended =
    typeof window !== 'undefined' &&
    sessionStorage.getItem('rahal_streak_extended') === 'true';

  return {
    streak: data?.current_streak ?? null,
    gamesPlayed: data?.games_played ?? null,
    accuracy: data ? Math.round(data.win_rate) : null,
    lastPlayedDate: data?.last_played ?? null,
    playedToday,
    isLoading: isInitialized ? isLoading : true,
    isAuthenticated,
    justExtended,
  };
}
