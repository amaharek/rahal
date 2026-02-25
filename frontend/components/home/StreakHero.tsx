'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/Skeleton';

interface StreakHeroProps {
  streak: number | null;
  isLoading: boolean;
  justExtended: boolean;
}

export function StreakHero({ streak, isLoading, justExtended }: StreakHeroProps) {
  const t = useTranslations('home');

  useEffect(() => {
    if (justExtended) {
      sessionStorage.removeItem('rahal_streak_extended');
    }
  }, [justExtended]);

  if (isLoading) {
    return (
      <div className="mb-6 flex justify-center">
        <Skeleton className="h-16 w-32" />
      </div>
    );
  }

  if (streak === null || streak === 0) return null;

  return (
    <div className="mb-6 flex justify-center">
      <motion.div
        className="flex flex-col items-center gap-1"
        animate={
          justExtended
            ? { scale: [1, 1.3, 1] }
            : { scale: 1 }
        }
        transition={{ duration: 0.6, ease: 'easeInOut' }}
      >
        <div className="flex items-center gap-2">
          <Flame className="w-8 h-8 text-orange-400" />
          <span className="text-5xl font-bold text-white">{streak}</span>
        </div>
        <span className="text-sm text-white/70 font-medium">
          {t('dayStreak')}
        </span>
        {justExtended && (
          <span className="text-xs text-orange-300 font-semibold animate-pulse">
            {t('streakExtended')}
          </span>
        )}
      </motion.div>
    </div>
  );
}
