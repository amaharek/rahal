'use client';

import { useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface AnswerOption {
  id: string;
  key: string;
}

interface AnswerOptionsProps {
  options: AnswerOption[];
  onSelect: (option: AnswerOption, index: number) => void;
  selectedIndex?: number;
  correctIndex?: number;
  isSubmitted?: boolean;
  showKeyBadges?: boolean;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

/** Kahoot-style pastel background colors for each option */
const OPTION_COLORS = [
  'bg-blue-50 border-blue-200 hover:border-blue-400',
  'bg-orange-50 border-orange-200 hover:border-orange-400',
  'bg-green-50 border-green-200 hover:border-green-400',
  'bg-rose-50 border-rose-200 hover:border-rose-400',
];

const OPTION_COLORS_SELECTED = [
  'bg-blue-100 border-blue-400',
  'bg-orange-100 border-orange-400',
  'bg-green-100 border-green-400',
  'bg-rose-100 border-rose-400',
];

export default function AnswerOptions({
  options,
  onSelect,
  selectedIndex,
  correctIndex,
  isSubmitted = false,
  showKeyBadges = false,
}: AnswerOptionsProps) {
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const t = useTranslations();

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
      let nextIndex = index;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          nextIndex = (index + 1) % options.length;
          break;
        case 'ArrowUp':
          event.preventDefault();
          nextIndex = (index - 1 + options.length) % options.length;
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          if (!isSubmitted) {
            onSelect(options[index], index);
          }
          return;
        default:
          return;
      }

      optionRefs.current[nextIndex]?.focus();
    },
    [options, isSubmitted, onSelect]
  );

  if (options.length === 0) {
    return null;
  }

  const getOptionClasses = (index: number) => {
    const isSelected = selectedIndex === index;
    const isCorrect = correctIndex === index;
    const isWrongSelection = isSubmitted && isSelected && correctIndex !== index;

    return cn(
      'w-full min-h-[56px] p-4 rounded-xl border-2 transition-all',
      'flex items-center gap-3',
      'focus:outline-none focus:ring-2 focus:ring-primary',
      'active:scale-[0.97]',
      // Default state — Kahoot pastel colors
      !isSubmitted && !isSelected && OPTION_COLORS[index % 4],
      // Selected state (before submission) — slightly deeper shade
      !isSubmitted && isSelected && OPTION_COLORS_SELECTED[index % 4],
      // Submitted: correct answer — green with scale-up
      isSubmitted && isCorrect && 'border-green-500 bg-green-100 scale-[1.02] correct success',
      // Submitted: wrong selection — red with shake
      isSubmitted && isWrongSelection && 'border-red-500 bg-red-100 animate-shake incorrect error',
      // Submitted: unselected wrong option — faded
      isSubmitted && !isCorrect && !isWrongSelection && 'border-border bg-surface opacity-40'
    );
  };

  const getDataCorrect = (index: number): string | undefined => {
    if (!isSubmitted) return undefined;
    if (correctIndex === index) return 'true';
    if (selectedIndex === index) return 'false';
    return undefined;
  };

  return (
    <div
      data-testid="answer-options-container"
      className="flex flex-col gap-3"
    >
      {options.map((option, index) => (
        <button
          key={option.id}
          ref={(el) => { optionRefs.current[index] = el; }}
          data-testid={`answer-option-${index}`}
          data-correct={getDataCorrect(index)}
          type="button"
          disabled={isSubmitted}
          aria-label={t('quiz.option', { letter: OPTION_LETTERS[index] })}
          aria-selected={selectedIndex === index}
          onClick={() => onSelect(option, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          className={getOptionClasses(index)}
        >
          <span
            data-testid={`option-letter-${index}`}
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0',
              'bg-white/80 text-text-primary'
            )}
          >
            {OPTION_LETTERS[index]}
          </span>
          <span className="flex-1 text-text-primary font-medium">
            {option.key}
          </span>
          {/* Desktop keyboard shortcut badge */}
          {showKeyBadges && !isSubmitted && (
            <span className="hidden sm:flex w-6 h-6 items-center justify-center rounded-full bg-white/80 text-xs font-bold text-text-secondary shrink-0">
              {index + 1}
            </span>
          )}
        </button>
      ))}

      {/* Shake animation */}
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          50% { transform: translateX(6px); }
          75% { transform: translateX(-4px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>
    </div>
  );
}
