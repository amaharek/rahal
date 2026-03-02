'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { useQuiz } from '@/lib/hooks/useQuiz';
import QuestionCard from '@/components/quiz/QuestionCard';
import AnswerOptions from '@/components/quiz/AnswerOptions';
import AutocompleteAnswer from '@/components/quiz/AutocompleteAnswer';
import Timer from '@/components/quiz/Timer';
import { Button } from '@/components/ui';
import type { AnswerResponse } from '@/types/quiz';

const DEFAULT_NUM_QUESTIONS = 10;
const TIME_PER_QUESTION_SECONDS = 10;
const FEEDBACK_DELAY_MS = 1500;

export default function QuizPage() {
  const t = useTranslations();
  const locale = useLocale();
  const {
    session,
    currentQuestion,
    currentQuestionIndex,
    isStarted,
    isCompleted,
    answers,
    hintsUsed,
    totalScore,
    correctCount,
    streak,
    timeRemaining,
    isLoading,
    error,
    progress,
    accuracy,
    startQuiz,
    submitAnswer,
    nextQuestion,
    useHint,
    resetQuiz,
    setTimeRemaining,
    isSubmitting,
    lastAnswer,
  } = useQuiz();

  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | undefined>();
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState<AnswerResponse | null>(null);
  const [questionTimerKey, setQuestionTimerKey] = useState(0);
  const [floatingScore, setFloatingScore] = useState<number | null>(null);
  const [animatedScore, setAnimatedScore] = useState(0);
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track answer results for progress dots
  const [answerResults, setAnswerResults] = useState<Array<'correct' | 'incorrect' | null>>(
    Array(DEFAULT_NUM_QUESTIONS).fill(null)
  );

  useEffect(() => {
    setSelectedOptionIndex(undefined);
    setIsAnswerSubmitted(false);
    setCurrentAnswer(null);
    setQuestionTimerKey((prev) => prev + 1);
    setFloatingScore(null);
    if (autoAdvanceRef.current) {
      clearTimeout(autoAdvanceRef.current);
      autoAdvanceRef.current = null;
    }
  }, [currentQuestionIndex]);

  // Auto-advance after feedback
  useEffect(() => {
    if (isAnswerSubmitted && currentAnswer) {
      autoAdvanceRef.current = setTimeout(() => {
        nextQuestion();
      }, FEEDBACK_DELAY_MS);
      return () => {
        if (autoAdvanceRef.current) {
          clearTimeout(autoAdvanceRef.current);
        }
      };
    }
  }, [isAnswerSubmitted, currentAnswer, nextQuestion]);

  // Animated score counter on completion
  useEffect(() => {
    if (isCompleted && totalScore > 0) {
      const duration = 1500;
      const steps = 30;
      const increment = totalScore / steps;
      let current = 0;
      const interval = setInterval(() => {
        current += increment;
        if (current >= totalScore) {
          setAnimatedScore(totalScore);
          clearInterval(interval);
        } else {
          setAnimatedScore(Math.round(current));
        }
      }, duration / steps);
      return () => clearInterval(interval);
    }
  }, [isCompleted, totalScore]);

  const handleStartQuiz = async () => {
    try {
      await startQuiz({ num_questions: DEFAULT_NUM_QUESTIONS });
    } catch (err) {
      console.error('Failed to start quiz:', err);
    }
  };

  const doSubmit = useCallback(
    async (optionIndex: number) => {
      if (!currentQuestion || isAnswerSubmitted || isSubmitting) return;

      const selectedOption = currentQuestion.options?.[optionIndex];
      if (!selectedOption) return;

      setSelectedOptionIndex(optionIndex);
      setIsAnswerSubmitted(true);

      try {
        const result = await submitAnswer(
          currentQuestion.id,
          selectedOption,
          hintsUsed,
          undefined
        );
        setCurrentAnswer(result);

        // Update progress dots
        setAnswerResults((prev) => {
          const next = [...prev];
          next[currentQuestionIndex] = result.is_correct ? 'correct' : 'incorrect';
          return next;
        });

        // Show floating score
        if (result.score > 0) {
          setFloatingScore(result.score);
        }
      } catch (err: unknown) {
        console.error('Failed to submit answer:', err);
        const e = err as { status?: number };
        if (e?.status === 404) {
          alert(t('errors.general') + ' - ' + t('quiz.tryAgain'));
          resetQuiz();
        } else {
          setIsAnswerSubmitted(false);
          setSelectedOptionIndex(undefined);
        }
      }
    },
    [currentQuestion, isAnswerSubmitted, isSubmitting, hintsUsed, submitAnswer, currentQuestionIndex, resetQuiz, t]
  );

  // Kahoot-style: tap/click instantly submits
  const handleOptionSelect = useCallback(
    (_option: { id: string; key: string }, index: number) => {
      if (isAnswerSubmitted || isSubmitting) return;
      doSubmit(index);
    },
    [isAnswerSubmitted, isSubmitting, doSubmit]
  );

  // Keyboard shortcuts: 1-4 for instant submit
  useEffect(() => {
    if (!currentQuestion || isAnswerSubmitted || isSubmitting) return;
    if (currentQuestion.question_type !== 'multiple_choice') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const keyNum = parseInt(e.key);
      if (keyNum >= 1 && keyNum <= 4) {
        const optionIndex = keyNum - 1;
        if (currentQuestion.options && optionIndex < currentQuestion.options.length) {
          doSubmit(optionIndex);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentQuestion, isAnswerSubmitted, isSubmitting, doSubmit]);

  const handleAutocompleteSubmit = async (answer: string) => {
    if (!currentQuestion || isAnswerSubmitted || !answer.trim()) return;

    setIsAnswerSubmitted(true);

    try {
      const result = await submitAnswer(
        currentQuestion.id,
        answer,
        hintsUsed,
        undefined
      );
      setCurrentAnswer(result);
      setAnswerResults((prev) => {
        const next = [...prev];
        next[currentQuestionIndex] = result.is_correct ? 'correct' : 'incorrect';
        return next;
      });
      if (result.score > 0) {
        setFloatingScore(result.score);
      }
    } catch (err: unknown) {
      console.error('Failed to submit answer:', err);
      const e = err as { status?: number };
      if (e?.status === 404) {
        alert(t('errors.general') + ' - ' + t('quiz.tryAgain'));
        resetQuiz();
      } else {
        setIsAnswerSubmitted(false);
      }
    }
  };

  const handleTimerExpire = useCallback(async () => {
    if (!isAnswerSubmitted && currentQuestion) {
      setIsAnswerSubmitted(true);
      setAnswerResults((prev) => {
        const next = [...prev];
        next[currentQuestionIndex] = 'incorrect';
        return next;
      });
      try {
        const result = await submitAnswer(currentQuestion.id, '', hintsUsed, undefined);
        setCurrentAnswer(result);
      } catch (err: unknown) {
        const e = err as { status?: number };
        if (e?.status === 404) {
          alert(t('errors.general') + ' - ' + t('quiz.tryAgain'));
          resetQuiz();
        }
      }
    }
  }, [isAnswerSubmitted, currentQuestion, currentQuestionIndex, hintsUsed, submitAnswer, resetQuiz, t]);

  const getCorrectAnswerIndex = (): number | undefined => {
    if (!currentQuestion?.options || !currentAnswer) return undefined;
    return currentQuestion.options.findIndex(
      (opt) => opt === currentAnswer.correct_answer
    );
  };

  const handleShareScore = async () => {
    const totalQuestions = session?.questions.length || DEFAULT_NUM_QUESTIONS;
    const shareText = `Rahal Quiz 🎯 | ${correctCount}/${totalQuestions} correct | ${totalScore} points | rahal.app`;
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ text: shareText });
      } catch {
        // User cancelled share
      }
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(shareText);
    }
  };

  // Loading state with skeleton shimmer
  if (isLoading && !isStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-lg px-4 space-y-4">
          <div className="h-4 w-3/4 mx-auto rounded-full bg-border animate-pulse" />
          <div className="h-24 rounded-xl bg-border animate-pulse" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 rounded-xl bg-border animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Start screen
  if (!isStarted) {
    return (
      <main className="min-h-screen pb-20">
        <header className="bg-primary text-white py-4 px-4">
          <div className="max-w-3xl mx-auto">
            <Link href={`/${locale}`} className="text-white/80 text-sm mb-2 inline-block">
              ← {t('common.back')}
            </Link>
            <h1 className="text-2xl font-bold">{t('quiz.title')}</h1>
            <p className="text-white/80 text-sm">{t('quiz.subtitle')}</p>
          </div>
        </header>

        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="text-6xl mb-6">🎯</div>
            <h2 className="text-2xl font-bold mb-4">{t('quiz.ready')}</h2>
            <p className="text-text-secondary mb-8 max-w-md mx-auto">
              {t('quiz.description')}
            </p>

            <div className="grid grid-cols-3 gap-4 mb-8 max-w-sm mx-auto">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {DEFAULT_NUM_QUESTIONS}
                </div>
                <div className="text-sm text-text-secondary">{t('quiz.questions')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {TIME_PER_QUESTION_SECONDS}
                </div>
                <div className="text-sm text-text-secondary">{t('quiz.secondsPerQuestion')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">3</div>
                <div className="text-sm text-text-secondary">{t('quiz.hints')}</div>
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              onClick={handleStartQuiz}
              disabled={isLoading}
              className="px-12"
            >
              {isLoading ? t('common.loading') : t('quiz.start')}
            </Button>

            {error && (
              <p className="mt-4 text-error text-sm">{error}</p>
            )}
          </div>
        </div>
      </main>
    );
  }

  // Completion screen
  if (isCompleted) {
    const totalQuestions = session?.questions.length || DEFAULT_NUM_QUESTIONS;
    const isPerfect = correctCount === totalQuestions;
    const isGood = accuracy >= 70;

    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
        {/* CSS Confetti */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                backgroundColor: ['#f44336', '#e91e63', '#9c27b0', '#2196f3', '#4caf50', '#ff9800', '#ffeb3b'][i % 7],
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>

        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-success/5 pointer-events-none" />

        <div className="relative z-10 text-center max-w-md w-full">
          {/* Emoji reaction */}
          <div className="text-7xl mb-4 animate-bounce">
            {isPerfect ? '🏆' : isGood ? '🎉' : '💪'}
          </div>

          <h2 className="text-3xl font-bold mb-2">
            {isPerfect
              ? t('quiz.perfect')
              : isGood
              ? t('quiz.completed')
              : t('quiz.tryAgain')}
          </h2>
          <p className="text-text-secondary mb-8">
            {t('quiz.completedMessage')}
          </p>

          {/* Animated score counter */}
          <div className="text-6xl font-bold text-primary mb-8 tabular-nums">
            {animatedScore}
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            <div className="bg-surface rounded-xl p-4 border border-border">
              <div className="text-2xl font-bold text-primary">{totalScore}</div>
              <div className="text-xs text-text-secondary">{t('quiz.finalScore')}</div>
            </div>
            <div className="bg-surface rounded-xl p-4 border border-border">
              <div className="text-2xl font-bold text-primary">
                {correctCount}/{totalQuestions}
              </div>
              <div className="text-xs text-text-secondary">{t('quiz.correct')}</div>
            </div>
            <div className="bg-surface rounded-xl p-4 border border-border">
              <div className="text-2xl font-bold text-primary">{accuracy}%</div>
              <div className="text-xs text-text-secondary">{t('quiz.accuracy')}</div>
            </div>
            <div className="bg-surface rounded-xl p-4 border border-border">
              <div className="text-2xl font-bold text-primary">{hintsUsed}</div>
              <div className="text-xs text-text-secondary">{t('quiz.hintsUsed')}</div>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex gap-3 justify-center">
            <Button variant="primary" size="lg" onClick={handleShareScore}>
              {t('common.share')}
            </Button>
            <Button variant="outline" size="lg" onClick={resetQuiz}>
              {t('quiz.playAgain')}
            </Button>
          </div>
        </div>

        {/* Confetti keyframes injected as style */}
        <style jsx>{`
          @keyframes confetti {
            0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
            100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
          }
          .animate-confetti {
            animation: confetti linear forwards;
          }
        `}</style>
      </main>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-lg px-4 space-y-4">
          <div className="h-4 w-3/4 mx-auto rounded-full bg-border animate-pulse" />
          <div className="h-24 rounded-xl bg-border animate-pulse" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 rounded-xl bg-border animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const formattedOptions = currentQuestion.options?.map((opt, idx) => ({
    id: `option-${idx}`,
    key: opt,
  })) || [];

  return (
    <main className="min-h-screen flex flex-col bg-background">
      {/* HUD Bar */}
      <div className="bg-surface border-b border-border px-4 py-2">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          {/* Close button */}
          <Link
            href={`/${locale}`}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-border/50 text-text-secondary"
            aria-label={t('common.close')}
          >
            ✕
          </Link>

          {/* Progress dots */}
          <div className="flex items-center gap-1.5 flex-1 justify-center">
            {Array.from({ length: progress.total }).map((_, i) => (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  answerResults[i] === 'correct'
                    ? 'bg-green-500'
                    : answerResults[i] === 'incorrect'
                    ? 'bg-red-500'
                    : i === currentQuestionIndex
                    ? 'bg-primary scale-125'
                    : 'bg-border'
                }`}
              />
            ))}
          </div>

          {/* Score + streak */}
          <div className="flex items-center gap-2">
            {streak >= 2 && (
              <span className="text-sm animate-pulse">🔥</span>
            )}
            <span className="text-lg font-bold text-primary tabular-nums relative">
              {totalScore}
              {/* Floating +score animation */}
              {floatingScore !== null && (
                <span
                  key={`float-${currentQuestionIndex}`}
                  className="absolute -top-4 left-1/2 -translate-x-1/2 text-sm font-bold text-green-500 animate-float-up pointer-events-none"
                >
                  +{floatingScore}
                </span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Timer bar */}
      <Timer
        key={questionTimerKey}
        initialSeconds={TIME_PER_QUESTION_SECONDS}
        onExpire={handleTimerExpire}
        isPaused={isAnswerSubmitted}
        variant="bar"
        locale={locale as 'ar' | 'en' | 'es'}
      />

      {/* Game area */}
      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 py-4">
        {/* Category pill + difficulty dot */}
        <div className="flex items-center gap-2 justify-center mb-3">
          <span className="px-3 py-1 text-xs rounded-full bg-primary/10 text-primary font-medium">
            {currentQuestion.category}
          </span>
          <span
            className={`w-2 h-2 rounded-full ${
              currentQuestion.difficulty === 'easy'
                ? 'bg-green-500'
                : currentQuestion.difficulty === 'medium'
                ? 'bg-yellow-500'
                : 'bg-red-500'
            }`}
          />
        </div>

        {/* Question text — the star */}
        <div className="flex-1 flex items-center justify-center mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-center text-text-primary leading-relaxed">
            {currentQuestion.question_ar}
          </h2>
        </div>

        {/* Answer options */}
        <div className="space-y-3 pb-4">
          {currentQuestion.question_type === 'multiple_choice' ? (
            <AnswerOptions
              options={formattedOptions}
              onSelect={handleOptionSelect}
              selectedIndex={selectedOptionIndex}
              correctIndex={isAnswerSubmitted ? getCorrectAnswerIndex() : undefined}
              isSubmitted={isAnswerSubmitted}
              showKeyBadges
            />
          ) : (
            <AutocompleteAnswer
              onSubmit={handleAutocompleteSubmit}
              isSubmitted={isAnswerSubmitted}
              isCorrect={currentAnswer?.is_correct}
              correctAnswerKey={currentAnswer?.correct_answer}
            />
          )}

          {/* Feedback banner */}
          {isAnswerSubmitted && currentAnswer && (
            <div
              className={`p-3 rounded-xl text-center font-bold text-lg ${
                currentAnswer.is_correct
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {currentAnswer.is_correct ? t('quiz.correct') : t('quiz.incorrect')}
              {currentAnswer.is_correct && (
                <span className="ml-2 text-primary">+{currentAnswer.score} {t('quiz.points')}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Float-up animation + confetti keyframes */}
      <style jsx>{`
        @keyframes float-up {
          0% { transform: translate(-50%, 0); opacity: 1; }
          100% { transform: translate(-50%, -20px); opacity: 0; }
        }
        .animate-float-up {
          animation: float-up 0.8s ease-out forwards;
        }
      `}</style>
    </main>
  );
}
