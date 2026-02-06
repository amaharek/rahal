'use client';

import { cn } from '@/lib/utils';
import { QuestionCategory, QuestionDifficulty, QuestionType, DIFFICULTY_COLORS } from '@/types/quiz';

interface QuestionCardProps {
  question: {
    id: string;
    question_key: string;
    category: QuestionCategory;
    difficulty: QuestionDifficulty;
    question_type: QuestionType;
    points: number;
  };
  currentQuestion: number;
  totalQuestions: number;
  locale: 'ar' | 'en';
}

const DIFFICULTY_CLASS_MAP: Record<QuestionDifficulty, string> = {
  easy: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  hard: 'bg-red-100 text-red-800',
};

export default function QuestionCard({
  question,
  currentQuestion,
  totalQuestions,
  locale,
}: QuestionCardProps) {
  const isRTL = locale === 'ar';

  return (
    <article
      role="article"
      aria-label={`question ${currentQuestion} of ${totalQuestions}`}
      tabIndex={0}
      className={cn(
        'bg-surface rounded-xl border border-border p-6 shadow-sm',
        'focus:outline-none focus:ring-2 focus:ring-primary'
      )}
    >
      {/* Header with question number and badges */}
      <div className={cn('flex items-center justify-between mb-4', isRTL && 'flex-row-reverse')}>
        <div className={cn('flex items-center gap-2', isRTL && 'flex-row-reverse')}>
          <span data-testid="question-number" className="text-lg font-bold text-text-primary">
            {currentQuestion}
          </span>
          <span className="text-text-secondary">/</span>
          <span data-testid="total-questions" className="text-text-secondary">
            {totalQuestions}
          </span>
        </div>

        <div className={cn('flex items-center gap-2', isRTL && 'flex-row-reverse')}>
          {/* Category badge */}
          <span
            data-testid="question-category"
            className="px-3 py-1 text-sm rounded-full bg-primary/10 text-primary"
          >
            {question.category}
          </span>

          {/* Difficulty badge */}
          <span
            data-testid="question-difficulty"
            data-difficulty={question.difficulty}
            className={cn(
              'px-3 py-1 text-sm rounded-full',
              DIFFICULTY_CLASS_MAP[question.difficulty]
            )}
          >
            {question.difficulty}
          </span>
        </div>
      </div>

      {/* Question text */}
      <div
        data-testid="question-text"
        dir={isRTL ? 'rtl' : 'ltr'}
        className={cn(
          'text-xl font-medium text-text-primary mb-4',
          isRTL ? 'text-right' : 'text-left'
        )}
      >
        {question.question_key}
      </div>

      {/* Points display */}
      <div className={cn('flex items-center gap-1', isRTL && 'flex-row-reverse justify-end')}>
        <span
          data-testid="question-points"
          className="text-lg font-bold text-primary"
        >
          {question.points}
        </span>
        <span className="text-text-secondary">
          {isRTL ? 'نقطة' : 'points'}
        </span>
      </div>
    </article>
  );
}
