'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { buildEmojiPath } from '@/lib/game/shareEmoji';
import type { EfficiencyBucket, GuessEntry, QualityTier } from '@/types/game';

interface ChallengeCountry {
  id: string;
  code: string;
  flag_emoji: string | null;
  name_ar: string;
  name_en: string;
}

interface GameCompletionSheetProps {
  isCompleted: boolean;
  guesses: GuessEntry[];
  score: number | null;
  shortestPath: number;
  qualityTier: QualityTier | null;
  efficiencyBucket: EfficiencyBucket;
  benchmarkDelta: number;
  startCountry: ChallengeCountry;
  endCountry: ChallengeCountry;
  onShare: () => void;
  shareStatus: 'idle' | 'copied' | 'error';
  t: (key: string) => string;
  onRetry: () => void;
  onLeaderboard: () => void;
  isHybridPresentation: boolean;
}

export function GameCompletionSheet({
  isCompleted,
  guesses,
  score,
  shortestPath,
  qualityTier,
  efficiencyBucket,
  benchmarkDelta,
  onShare,
  shareStatus,
  t,
  onRetry,
  onLeaderboard,
  isHybridPresentation,
}: GameCompletionSheetProps) {
  const emojiPath = buildEmojiPath(guesses, true);
  const gradeLabel = qualityTier
    ? t(`game.completion.gradeLevels.${qualityTier}`)
    : t('game.completion.gradeLevels.good_discovery');
  const benchmarkLabel =
    benchmarkDelta === 0 ? '✓' : benchmarkDelta > 0 ? `+${benchmarkDelta}` : `${benchmarkDelta}`;

  return (
    <AnimatePresence>
      {isCompleted && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-50 max-h-[85dvh] overflow-y-auto overscroll-contain rounded-t-2xl bg-surface shadow-xl lg:relative lg:rounded-lg lg:shadow-none lg:max-h-none"
          data-testid="game-completion-sheet"
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1 lg:hidden">
            <div className="w-10 h-1 rounded-full bg-border" />
          </div>

          <div className="px-4 pb-6 pt-2 space-y-4">
            {/* Emoji path */}
            <div className="text-center py-2">
              <p
                className="text-3xl tracking-widest leading-relaxed"
                data-testid="completion-emoji-path"
              >
                {emojiPath}
              </p>
            </div>

            {/* Stat tiles */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-surface-elevated rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-primary">{score ?? 0}</div>
                <div className="text-xs text-text-secondary">{t('game.score')}</div>
              </div>
              <div className="bg-surface-elevated rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-primary">
                  {guesses.length} / {shortestPath}
                </div>
                <div className="text-xs text-text-secondary">{t('game.totalGuesses')}</div>
              </div>
              <div
                className="bg-surface-elevated rounded-lg p-3 text-center"
                data-testid="completion-grade"
              >
                <div className="text-base font-bold text-primary">{gradeLabel}</div>
                <div className="text-xs text-text-secondary">{t('game.completion.gradeLabel')}</div>
              </div>
            </div>

            {/* Efficiency + benchmark (secondary) */}
            <div className="text-center text-xs text-text-secondary">
              {t(`game.hud.efficiencyLevels.${efficiencyBucket}`)} · {benchmarkLabel}{' '}
              {t('game.hud.benchmark.label')}
            </div>

            {/* Share button — primary CTA */}
            <button
              type="button"
              className="w-full py-3 px-4 bg-primary text-white rounded-lg font-semibold text-base"
              onClick={onShare}
              data-testid="share-recap-button"
            >
              {shareStatus === 'copied'
                ? t('common.copied')
                : shareStatus === 'error'
                  ? t('common.retry')
                  : t('game.recap.shareCta')}
            </button>

            {/* Secondary actions */}
            <div className="flex gap-2">
              <button
                type="button"
                className="flex-1 py-2 px-3 text-sm text-text-secondary border border-border rounded-lg"
                onClick={onLeaderboard}
                data-testid="recap-leaderboard-cta"
              >
                {t('game.recap.leaderboardCta')}
              </button>
              <button
                type="button"
                className="flex-1 py-2 px-3 text-sm text-text-secondary border border-border rounded-lg"
                onClick={onRetry}
                data-testid="completion-retry-cta"
              >
                {t('game.completion.retryCta')}
              </button>
            </div>

            {/* Narrative recap (hybrid only) */}
            {isHybridPresentation && (
              <div
                className="rounded-lg border border-primary/25 bg-primary/5 p-3"
                data-testid="postgame-recap-card"
              >
                <p className="text-sm font-semibold text-primary">{t('game.recap.title')}</p>
                <p className="mt-1 text-xs text-text-secondary">{t('game.recap.retentionHook')}</p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
