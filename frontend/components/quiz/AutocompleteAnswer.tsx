'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { cn, debounce } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface Suggestion {
  id: string;
  key: string;
}

interface AutocompleteAnswerProps {
  suggestions?: Suggestion[] | string[];
  onSubmit: (answer: string) => void;
  onChange?: (value: string) => void;
  isLoading?: boolean;
  error?: string;
  isSubmitted?: boolean;
  isCorrect?: boolean;
  correctAnswerKey?: string;
}

export default function AutocompleteAnswer({
  suggestions = [],
  onSubmit,
  onChange,
  isLoading = false,
  error,
  isSubmitted = false,
  isCorrect,
  correctAnswerKey,
}: AutocompleteAnswerProps) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations();

  // Normalize suggestions to Suggestion format
  const normalizedSuggestions: Suggestion[] = useMemo(() => {
    return suggestions.map((s, i) => {
      if (typeof s === 'string') {
        return { id: `suggestion-${i}`, key: s };
      }
      return s;
    });
  }, [suggestions]);

  // Filter suggestions based on input (case-insensitive)
  // If filter returns results, use them. Otherwise show all suggestions.
  const filteredSuggestions = useMemo(() => {
    if (!inputValue.trim()) return normalizedSuggestions;
    const searchLower = inputValue.toLowerCase();
    const filtered = normalizedSuggestions.filter((s) =>
      s.key.toLowerCase().includes(searchLower)
    );
    // If filtering returns results, use them. Otherwise show all to allow selection.
    return filtered.length > 0 ? filtered : normalizedSuggestions;
  }, [normalizedSuggestions, inputValue]);

  // Debounced onChange callback
  const debouncedOnChange = useMemo(() => {
    if (!onChange) return undefined;
    return debounce((value: string) => {
      onChange(value);
    }, 300);
  }, [onChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setShowSuggestions(true);
    setHighlightedIndex(-1);
    debouncedOnChange?.(value);
  };

  const selectSuggestion = useCallback((suggestion: Suggestion) => {
    setInputValue(suggestion.key);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || filteredSuggestions.length === 0) {
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
        if (highlightedIndex >= 0) {
          e.preventDefault();
          selectSuggestion(filteredSuggestions[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(inputValue);
  };

  // Show suggestions when typing
  const shouldShowSuggestions =
    showSuggestions && inputValue.trim().length > 0 && filteredSuggestions.length > 0;

  return (
    <div className="relative">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => inputValue.trim() && setShowSuggestions(true)}
            disabled={isSubmitted}
            aria-autocomplete="list"
            aria-label={t('quiz.enterAnswer')}
            aria-expanded={shouldShowSuggestions}
            aria-controls="suggestions-list"
            className={cn(
              'w-full px-4 py-3 rounded-lg border-2 transition-all',
              'bg-surface text-text-primary',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary',
              isSubmitted && 'opacity-50 cursor-not-allowed',
              error && 'border-red-500',
              !error && 'border-border'
            )}
            placeholder={t('quiz.enterAnswer')}
          />

          {/* Loading indicator */}
          {isLoading && (
            <div
              data-testid="loading-indicator"
              role="status"
              aria-label={t('common.loading')}
              className="absolute top-1/2 -translate-y-1/2 end-3"
            >
              <span className="animate-spin inline-block">⏳</span>
            </div>
          )}

          {/* Feedback icon after submission */}
          {isSubmitted && isCorrect !== undefined && (
            <div
              data-testid="answer-feedback"
              data-correct={isCorrect ? 'true' : 'false'}
              className="absolute top-1/2 -translate-y-1/2 end-3"
            >
              {isCorrect ? (
                <span role="img" aria-label="success checkmark" className="text-green-500 text-xl">
                  ✓
                </span>
              ) : (
                <span role="img" aria-label="incorrect" className="text-red-500 text-xl">
                  ✗
                </span>
              )}
            </div>
          )}
        </div>

        {/* Submit button — kept for autocomplete questions */}
        {!isSubmitted && (
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className={cn(
              'w-full mt-3 py-3 rounded-xl font-semibold transition-all',
              inputValue.trim()
                ? 'bg-primary text-white hover:bg-primary/90'
                : 'bg-border text-text-secondary cursor-not-allowed'
            )}
          >
            {t('quiz.submitAnswer')}
          </button>
        )}

        {/* Suggestions dropdown */}
        {shouldShowSuggestions && !isLoading && (
          <ul
            id="suggestions-list"
            data-testid="suggestions-list"
            role="listbox"
            className={cn(
              'absolute z-10 w-full mt-1 max-h-60 overflow-auto',
              'bg-surface border border-border rounded-lg shadow-lg'
            )}
          >
            {filteredSuggestions.map((suggestion, index) => (
              <li
                key={suggestion.id}
                data-testid={`suggestion-item-${index}`}
                role="option"
                aria-selected={highlightedIndex === index}
                onClick={() => selectSuggestion(suggestion)}
                className={cn(
                  'px-4 py-2 cursor-pointer transition-colors',
                  highlightedIndex === index
                    ? 'bg-primary/10 text-primary highlighted active'
                    : 'hover:bg-primary/5 text-text-primary'
                )}
              >
                {suggestion.key}
              </li>
            ))}
          </ul>
        )}
      </form>

      {/* Error message */}
      {error && (
        <div role="alert" className="mt-2 text-red-500 text-sm">
          {error}
        </div>
      )}

      {/* Correct answer display when wrong */}
      {isSubmitted && isCorrect === false && correctAnswerKey && (
        <div
          data-testid="correct-answer"
          className="mt-3 p-3 rounded-lg bg-green-50 border border-green-200 flex items-center gap-2"
        >
          <span className="text-green-600 font-medium">
            {t('quiz.correctAnswerIs')}
          </span>
          <span className="text-green-800">{correctAnswerKey}</span>
        </div>
      )}
    </div>
  );
}
