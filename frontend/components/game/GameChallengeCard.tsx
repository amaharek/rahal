'use client';

import { Card, CardContent } from '@/components/ui';

interface ChallengeCountry {
  flag_emoji: string | null;
  name_ar: string;
  name_en: string;
}

interface GameChallengeCardProps {
  startCountry: ChallengeCountry;
  endCountry: ChallengeCountry;
  shortestPath: number;
  direction: 'rtl' | 'ltr';
  getCountryNameByLocale: (country: ChallengeCountry) => string;
  t: (key: string) => string;
}

export function GameChallengeCard({
  startCountry,
  endCountry,
  shortestPath,
  direction,
  getCountryNameByLocale,
  t,
}: GameChallengeCardProps) {
  return (
    <Card className="mb-3" data-testid="game-challenge-card">
      <CardContent className="py-2">
        <div className="flex items-center justify-between gap-3">
          <div className="text-center flex-1">
            <div className="text-2xl mb-0.5">{startCountry.flag_emoji}</div>
            <div className="font-bold text-sm">{getCountryNameByLocale(startCountry)}</div>
            <div className="text-xs text-text-secondary">{t('game.from')}</div>
          </div>
          <div className="text-xl text-primary">{direction === 'rtl' ? '←' : '→'}</div>
          <div className="text-center flex-1">
            <div className="text-2xl mb-0.5">{endCountry.flag_emoji}</div>
            <div className="font-bold text-sm">{getCountryNameByLocale(endCountry)}</div>
            <div className="text-xs text-text-secondary">{t('game.to')}</div>
          </div>
        </div>
        <div className="text-center mt-2 pt-2 border-t border-border">
          <span className="text-xs text-text-secondary">
            {t('game.shortestPath')}: {shortestPath} {t('game.pathCountriesUnit')}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
