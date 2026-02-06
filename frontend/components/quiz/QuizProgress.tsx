'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface CategoryStat {
  correct: number;
  total: number;
}

interface QuizProgressProps {
  currentQuestion: number;
  totalQuestions: number;
  score: number;
  hintsRemaining: number;
  accuracy?: number;
  timeElapsed?: number;
  correctStreak?: number;
  categoryStats?: Record<string, CategoryStat>;
  correctAnswers?: number;
  milestones?: string[];
  compact?: boolean;
  locale: 'ar' | 'en';
}

function formatTimeElapsed(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

const CATEGORY_TRANSLATIONS: Record<string, string> = {
  capitals: 'العواصم',
  flags: 'الأعلام',
  landmarks: 'المعالم',
  attractions: 'معالم الجذب',
  geography: 'الجغرافيا',
  borders: 'الحدود',
  population: 'السكان',
  arab_world: 'العالم العربي',
};

export default function QuizProgress({
  currentQuestion,
  totalQuestions,
  score,
  hintsRemaining,
  accuracy,
  timeElapsed,
  correctStreak,
  categoryStats,
  correctAnswers,
  milestones,
  compact = false,
  locale,
}: QuizProgressProps) {
  const isRTL = locale === 'ar';
  const progressPercentage = (currentQuestion / totalQuestions) * 100;
  const isComplete = currentQuestion === totalQuestions;
  const prevScoreRef = useRef(score);
  const [scoreAnimating, setScoreAnimating] = useState(false);

  // Handle score animation
  useEffect(() => {
    if (score !== prevScoreRef.current) {
      setScoreAnimating(true);
      const timeout = setTimeout(() => setScoreAnimating(false), 300);
      prevScoreRef.current = score;
      return () => clearTimeout(timeout);
    }
  }, [score]);

  // Calculate average points per correct answer
  const avgPoints = correctAnswers && correctAnswers > 0 ? Math.round(score / correctAnswers) : null;

  return (
    <div
      role="region"
      aria-label={isRTL ? 'التقدم' : 'progress'}
      dir={isRTL ? 'rtl' : 'ltr'}
      className={cn(
        'bg-surface rounded-xl border border-border p-4 shadow-sm',
        compact && 'compact small p-2'
      )}
    >
      {/* Progress bar */}
      <div
        role="progressbar"
        aria-valuenow={currentQuestion}
        aria-valuemax={totalQuestions}
        aria-label={`question ${currentQuestion} progress`}
        className="w-full h-2 bg-border rounded-full overflow-hidden mb-4"
      >
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Main stats row */}
      <div className={cn('flex items-center justify-between gap-4 mb-4', isRTL && 'flex-row-reverse')}>
        {/* Question progress */}
        <div className={cn('flex items-center gap-2', isRTL && 'flex-row-reverse')}>
          <span className="text-lg font-bold text-text-primary">
            {currentQuestion}/{totalQuestions}
          </span>
          {isComplete && (
            <span className="ml-2 text-green-600 font-medium">
              {isRTL ? 'مكتمل' : 'complete'}
            </span>
          )}
        </div>

        {/* Score */}
        <div className={cn('flex items-center gap-2', isRTL && 'flex-row-reverse')}>
          <span className="text-text-secondary text-sm">
            {isRTL ? 'النتيجة' : 'score'}
          </span>
          <span
            data-testid="score-value"
            className={cn(
              'text-lg font-bold text-primary',
              scoreAnimating && 'animate-pulse transition'
            )}
          >
            {score}
          </span>
        </div>

        {/* Hints */}
        <div
          data-testid="hints-display"
          className={cn(
            'flex items-center gap-2',
            isRTL && 'flex-row-reverse',
            hintsRemaining === 0 && 'empty disabled muted opacity-50'
          )}
        >
          <span className="text-text-secondary text-sm">
            {isRTL ? 'تلميح' : 'hints'}
          </span>
          <span data-testid="hints-count" className="text-lg font-bold text-text-primary">{hintsRemaining}</span>
        </div>
      </div>

      {/* Optional stats row */}
      {(accuracy !== undefined || timeElapsed !== undefined || correctStreak !== undefined || avgPoints !== null) && (
        <div
          className={cn(
            'flex items-center gap-4 mb-4 flex-wrap',
            isRTL && 'flex-row-reverse'
          )}
        >
          {/* Accuracy */}
          {accuracy !== undefined && (
            <div className={cn('flex items-center gap-1', isRTL && 'flex-row-reverse')}>
              <span className="text-text-secondary text-sm">
                {isRTL ? 'الدقة' : 'accuracy'}
              </span>
              <span className="font-medium text-text-primary">{accuracy}%</span>
            </div>
          )}

          {/* Time elapsed */}
          {timeElapsed !== undefined && (
            <div className={cn('flex items-center gap-1', isRTL && 'flex-row-reverse')}>
              <span className="text-text-secondary">⏱️</span>
              <span className="font-mono text-text-primary">{formatTimeElapsed(timeElapsed)}</span>
            </div>
          )}

          {/* Streak */}
          {correctStreak !== undefined && (
            <div className={cn('flex items-center gap-1', isRTL && 'flex-row-reverse')}>
              <span className="text-text-secondary text-sm">
                {isRTL ? 'متتالي' : 'streak'}
              </span>
              <span className="font-bold text-orange-500">🔥 {correctStreak}</span>
            </div>
          )}

          {/* Average points */}
          {avgPoints !== null && (
            <div className={cn('flex items-center gap-1', isRTL && 'flex-row-reverse')}>
              <span className="text-text-secondary text-sm">
                {isRTL ? 'متوسط' : 'avg'}
              </span>
              <span className="font-medium text-text-primary">{avgPoints}</span>
            </div>
          )}
        </div>
      )}

      {/* Category stats */}
      {categoryStats && Object.keys(categoryStats).length > 0 && (
        <div className="border-t border-border pt-3 mt-3">
          <div
            className={cn(
              'flex flex-wrap gap-3',
              isRTL && 'flex-row-reverse'
            )}
          >
            {Object.entries(categoryStats).map(([category, stats]) => (
              <div
                key={category}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded-full bg-primary/5',
                  isRTL && 'flex-row-reverse'
                )}
              >
                <span className="text-xs text-text-secondary">
                  {isRTL ? CATEGORY_TRANSLATIONS[category] || category : category}
                </span>
                <span className="text-xs font-medium text-primary">
                  {stats.correct}/{stats.total}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Milestones */}
      {milestones && milestones.length > 0 && (
        <div className="border-t border-border pt-3 mt-3">
          <div className={cn('flex flex-wrap gap-2', isRTL && 'flex-row-reverse')}>
            {milestones.map((milestone, index) => (
              <span
                key={index}
                className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-sm font-medium"
              >
                {milestone === 'perfect_start' && (isRTL ? 'ممتاز! بداية مثالية' : 'Perfect start!')}
                {milestone === 'no_hints_used' && (isRTL ? 'بدون تلميحات' : 'No hints used')}
                {!['perfect_start', 'no_hints_used'].includes(milestone) && milestone}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
