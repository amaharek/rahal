'use client';

import { useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useIsRTL } from '@/lib/hooks/useDirection';

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
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

export default function AnswerOptions({
  options,
  onSelect,
  selectedIndex,
  correctIndex,
  isSubmitted = false,
}: AnswerOptionsProps) {
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const isRTL = useIsRTL();

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
      'w-full p-4 rounded-lg border-2 transition-all',
      'flex items-center gap-4',
      'focus:outline-none focus:ring-2 focus:ring-primary',
      isRTL && 'flex-row-reverse',
      // Default state
      !isSubmitted && !isSelected && 'border-border hover:border-primary/50 bg-surface',
      // Selected state (before submission)
      !isSubmitted && isSelected && 'border-primary bg-primary/10 selected active',
      // Submitted: correct answer
      isSubmitted && isCorrect && 'border-green-500 bg-green-50 correct success',
      // Submitted: wrong selection
      isSubmitted && isWrongSelection && 'border-red-500 bg-red-50 incorrect error',
      // Submitted: unselected wrong option
      isSubmitted && !isCorrect && !isWrongSelection && 'border-border bg-surface opacity-50'
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
      dir={isRTL ? 'rtl' : 'ltr'}
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
          aria-label={isRTL ? `خيار ${OPTION_LETTERS[index]}` : `option ${OPTION_LETTERS[index]}`}
          aria-selected={selectedIndex === index}
          onClick={() => onSelect(option, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          className={getOptionClasses(index)}
        >
          <span
            data-testid={`option-letter-${index}`}
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm',
              'bg-primary/10 text-primary'
            )}
          >
            {OPTION_LETTERS[index]}
          </span>
          <span className="flex-1 text-text-primary">
            {option.key}
          </span>
        </button>
      ))}
    </div>
  );
}
