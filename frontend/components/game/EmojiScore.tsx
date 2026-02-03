'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { ScoreEmoji } from '@/types/game';
import { EMOJI_DESCRIPTIONS } from '@/types/game';

interface EmojiScoreProps {
  emoji: ScoreEmoji;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
}

const emojiColors: Record<ScoreEmoji, string> = {
  '🟢': 'bg-score-excellent/20 border-score-excellent',
  '🟡': 'bg-score-good/20 border-score-good',
  '🟠': 'bg-score-okay/20 border-score-okay',
  '🔴': 'bg-score-far/20 border-score-far',
  '⚫': 'bg-score-wrong/20 border-score-wrong',
};

const sizes = {
  sm: 'w-8 h-8 text-lg',
  md: 'w-12 h-12 text-2xl',
  lg: 'w-16 h-16 text-4xl',
};

export function EmojiScore({
  emoji,
  description,
  size = 'md',
  animate = true,
}: EmojiScoreProps) {
  const content = (
    <div
      className={cn(
        'flex items-center justify-center rounded-full border-2',
        emojiColors[emoji],
        sizes[size]
      )}
    >
      {emoji}
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-2">
      {animate ? (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        >
          {content}
        </motion.div>
      ) : (
        content
      )}
      {description !== undefined && (
        <span className="text-sm text-text-secondary">
          {description || EMOJI_DESCRIPTIONS[emoji]}
        </span>
      )}
    </div>
  );
}
