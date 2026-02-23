'use client';

import { useState, useCallback, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { useQuiz } from '@/lib/hooks/useQuiz';
import QuestionCard from '@/components/quiz/QuestionCard';
import AnswerOptions from '@/components/quiz/AnswerOptions';
import AutocompleteAnswer from '@/components/quiz/AutocompleteAnswer';
import Timer from '@/components/quiz/Timer';
import QuizProgress from '@/components/quiz/QuizProgress';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import type { AnswerResponse } from '@/types/quiz';

const DEFAULT_NUM_QUESTIONS = 10;
const TIME_PER_QUESTION_SECONDS = 30;

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

  useEffect(() => {
    setSelectedOptionIndex(undefined);
    setIsAnswerSubmitted(false);
    setCurrentAnswer(null);
    setQuestionTimerKey((prev) => prev + 1);
  }, [currentQuestionIndex]);

  const handleStartQuiz = async () => {
    try {
      await startQuiz({ num_questions: DEFAULT_NUM_QUESTIONS });
    } catch (err) {
      console.error('Failed to start quiz:', err);
    }
  };

  const handleOptionSelect = useCallback(
    (option: { id: string; key: string }, index: number) => {
      if (isAnswerSubmitted || isSubmitting) return;
      setSelectedOptionIndex(index);
    },
    [isAnswerSubmitted, isSubmitting]
  );

  const handleSubmit = async () => {
    if (!currentQuestion || selectedOptionIndex === undefined || isAnswerSubmitted) return;

    const selectedOption = currentQuestion.options?.[selectedOptionIndex];
    if (!selectedOption) return;

    setIsAnswerSubmitted(true);

    try {
      const result = await submitAnswer(
        currentQuestion.id,
        selectedOption,
        hintsUsed,
        undefined
      );
      setCurrentAnswer(result);
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

  const handleNextQuestion = () => {
    nextQuestion();
  };

  const handleTimerExpire = useCallback(async () => {
    if (!isAnswerSubmitted && currentQuestion) {
      setIsAnswerSubmitted(true);
      try {
        await submitAnswer(currentQuestion.id, '', hintsUsed, undefined);
      } catch (err: unknown) {
        const e = err as { status?: number };
        if (e?.status === 404) {
          alert(t('errors.general') + ' - ' + t('quiz.tryAgain'));
          resetQuiz();
        }
      }
    }
  }, [isAnswerSubmitted, currentQuestion, hintsUsed, submitAnswer, resetQuiz, t]);

  const handleUseHint = () => {
    if (hintsUsed < 3 && !isAnswerSubmitted) {
      useHint();
    }
  };

  const getCorrectAnswerIndex = (): number | undefined => {
    if (!currentQuestion?.options || !currentAnswer) return undefined;
    return currentQuestion.options.findIndex(
      (opt) => opt === currentAnswer.correct_answer
    );
  };

  if (isLoading && !isStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <span className="text-4xl animate-spin inline-block">🎯</span>
          <p className="mt-4 text-text-secondary">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

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
          <Card className="text-center">
            <CardContent className="py-12">
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
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  if (isCompleted) {
    const totalQuestions = session?.questions.length || DEFAULT_NUM_QUESTIONS;
    const isPerfect = correctCount === totalQuestions;
    const isGood = accuracy >= 70;

    return (
      <main className="min-h-screen pb-20">
        <header className="bg-primary text-white py-4 px-4">
          <div className="max-w-3xl mx-auto">
            <Link href={`/${locale}`} className="text-white/80 text-sm mb-2 inline-block">
              ← {t('common.back')}
            </Link>
            <h1 className="text-2xl font-bold">{t('quiz.title')}</h1>
          </div>
        </header>

        <div className="max-w-3xl mx-auto px-4 py-8">
          <Card className={isPerfect ? 'bg-success/10 border-success' : ''}>
            <CardContent className="text-center py-12">
              <div className="text-6xl mb-4">
                {isPerfect ? '🏆' : isGood ? '🎉' : '💪'}
              </div>
              <h2 className="text-2xl font-bold mb-2">
                {isPerfect
                  ? t('quiz.perfect')
                  : isGood
                  ? t('quiz.completed')
                  : t('quiz.tryAgain')}
              </h2>
              <p className="text-text-secondary mb-8">
                {t('quiz.completedMessage')}
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-surface rounded-lg p-4 border border-border">
                  <div className="text-3xl font-bold text-primary">{totalScore}</div>
                  <div className="text-sm text-text-secondary">{t('quiz.finalScore')}</div>
                </div>
                <div className="bg-surface rounded-lg p-4 border border-border">
                  <div className="text-3xl font-bold text-primary">
                    {correctCount}/{totalQuestions}
                  </div>
                  <div className="text-sm text-text-secondary">{t('quiz.correct')}</div>
                </div>
                <div className="bg-surface rounded-lg p-4 border border-border">
                  <div className="text-3xl font-bold text-primary">{accuracy}%</div>
                  <div className="text-sm text-text-secondary">{t('quiz.accuracy')}</div>
                </div>
                <div className="bg-surface rounded-lg p-4 border border-border">
                  <div className="text-3xl font-bold text-primary">{hintsUsed}</div>
                  <div className="text-sm text-text-secondary">{t('quiz.hintsUsed')}</div>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <Button variant="outline" onClick={resetQuiz}>
                  {t('quiz.playAgain')}
                </Button>
                <Link href={`/${locale}`}>
                  <Button variant="primary">{t('common.home')}</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <span className="text-4xl animate-spin inline-block">🔄</span>
          <p className="mt-4 text-text-secondary">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  const formattedOptions = currentQuestion.options?.map((opt, idx) => ({
    id: `option-${idx}`,
    key: opt,
  })) || [];

  return (
    <main className="min-h-screen pb-20">
      <header className="bg-primary text-white py-3 px-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <Link href={`/${locale}`} className="text-white/80 text-sm mb-1 inline-block">
              ← {t('common.back')}
            </Link>
            <h1 className="text-xl font-bold">{t('quiz.title')}</h1>
          </div>
          <Timer
            key={questionTimerKey}
            initialSeconds={TIME_PER_QUESTION_SECONDS}
            onExpire={handleTimerExpire}
            isPaused={isAnswerSubmitted}
            showProgress
            locale={locale as 'ar' | 'en' | 'es'}
          />
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
        <QuizProgress
          currentQuestion={progress.current}
          totalQuestions={progress.total}
          score={totalScore}
          hintsRemaining={3 - hintsUsed}
          accuracy={answers.length > 0 ? accuracy : undefined}
          correctStreak={streak > 0 ? streak : undefined}
        />

        <QuestionCard
          question={{
            id: currentQuestion.id,
            question_key: currentQuestion.question_ar,
            category: currentQuestion.category,
            difficulty: currentQuestion.difficulty,
            question_type: currentQuestion.question_type,
            points: 100,
          }}
          currentQuestion={progress.current}
          totalQuestions={progress.total}
        />

        <Card>
          <CardContent>
            {currentQuestion.question_type === 'multiple_choice' ? (
              <div className="space-y-3">
                <AnswerOptions
                  options={formattedOptions}
                  onSelect={handleOptionSelect}
                  selectedIndex={selectedOptionIndex}
                  correctIndex={isAnswerSubmitted ? getCorrectAnswerIndex() : undefined}
                  isSubmitted={isAnswerSubmitted}
                />

                {!isAnswerSubmitted && (
                  <Button
                    variant="primary"
                    className="w-full mt-3"
                    onClick={handleSubmit}
                    disabled={selectedOptionIndex === undefined || isSubmitting}
                  >
                    {isSubmitting ? t('common.loading') : t('quiz.submitAnswer')}
                  </Button>
                )}
              </div>
            ) : (
              <AutocompleteAnswer
                onSubmit={handleAutocompleteSubmit}
                isSubmitted={isAnswerSubmitted}
                isCorrect={currentAnswer?.is_correct}
                correctAnswerKey={currentAnswer?.correct_answer}
              />
            )}

            {isAnswerSubmitted && currentAnswer && (
              <div
                className={`mt-3 p-3 rounded-lg ${
                  currentAnswer.is_correct
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">
                    {currentAnswer.is_correct ? '✓' : '✗'}
                  </span>
                  <span
                    className={`font-bold ${
                      currentAnswer.is_correct ? 'text-green-700' : 'text-red-700'
                    }`}
                  >
                    {currentAnswer.is_correct ? t('quiz.correct') : t('quiz.incorrect')}
                  </span>
                  <span className="text-primary font-bold mr-auto">
                    +{currentAnswer.score} {t('quiz.points')}
                  </span>
                </div>
                {currentAnswer.explanation && (
                  <p className="text-text-secondary text-sm">
                    {currentAnswer.explanation}
                  </p>
                )}
              </div>
            )}

            {isAnswerSubmitted && (
              <Button
                variant="primary"
                className="w-full mt-3"
                onClick={handleNextQuestion}
              >
                {progress.current === progress.total
                  ? t('quiz.viewResults')
                  : t('quiz.nextQuestion')}
              </Button>
            )}
          </CardContent>
        </Card>

        {!isAnswerSubmitted && currentQuestion.hint && (
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-text-secondary text-sm">
                    {t('quiz.hintsRemaining')}: {3 - hintsUsed}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUseHint}
                  disabled={hintsUsed >= 3}
                >
                  {t('quiz.useHint')} (-20 {t('quiz.points')})
                </Button>
              </div>
              {hintsUsed > 0 && currentQuestion.hint && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <span className="text-yellow-800">{currentQuestion.hint}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {error && (
          <div className="text-center p-4 bg-error/10 border border-error rounded-lg">
            <p className="text-error">{error}</p>
          </div>
        )}
      </div>
    </main>
  );
}
