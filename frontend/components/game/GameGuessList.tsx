'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { EmojiScore } from '@/components/game/EmojiScore';
import type { GuessEntry } from '@/types/game';

interface GameGuessListProps {
  guesses: GuessEntry[];
  getCountryNameByLocale: (country: { name_ar: string; name_en: string }) => string;
  title: string;
  noGuessesLabel: string;
  startTypingLabel: string;
}

export function GameGuessList({
  guesses,
  getCountryNameByLocale,
  title,
  noGuessesLabel,
  startTypingLabel,
}: GameGuessListProps) {
  return (
    <Card data-testid="game-guess-list">
      <CardHeader>
        <CardTitle className="text-base">
          {title} ({guesses.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {guesses.length === 0 ? (
          <div className="text-center py-8 text-text-secondary">
            <p>{noGuessesLabel}</p>
            <p className="text-sm mt-2">{startTypingLabel}</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {guesses.map((guess, index) => (
              <div key={guess.country_id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                <span className="text-lg font-bold text-text-secondary w-8">{index + 1}.</span>
                <span className="text-2xl">{guess.flag_emoji}</span>
                <span className="flex-1 font-medium">
                  {getCountryNameByLocale({ name_ar: guess.name_ar, name_en: guess.name_en || guess.name_ar })}
                </span>
                <EmojiScore emoji={guess.emoji} size="sm" animate={false} />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
