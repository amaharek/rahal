'use client';

import { useState, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import {
  ChevronRight,
  Brain,
  Clock,
  Lightbulb,
  Trophy,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  RotateCcw,
  Home,
  MapPin,
  HelpCircle,
  BarChart3,
  User,
  Zap,
  Target,
} from 'lucide-react';
import { useQuiz } from '@/lib/hooks/useQuiz';
import QuestionCard from '@/components/quiz/QuestionCard';
import AnswerOptions from '@/components/quiz/AnswerOptions';
import AutocompleteAnswer from '@/components/quiz/AutocompleteAnswer';
import Timer from '@/components/quiz/Timer';
import QuizProgress from '@/components/quiz/QuizProgress';
import { Button } from '@/components/ui';
import type { AnswerResponse } from '@/types/quiz';

const DEFAULT_NUM_QUESTIONS = 10;
const TIME_PER_QUESTION_SECONDS = 30;

export default function QuizPage() {
  const t = useTranslations();
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
    } catch (err: any) {
      console.error('Failed to submit answer:', err);
      // Handle 404 error (stale question)
      if (err?.status === 404) {
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
    } catch (err: any) {
      console.error('Failed to submit answer:', err);
      // Handle 404 error (stale question)
      if (err?.status === 404) {
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

  const handleTimerExpire = useCallback(() => {
    if (!isAnswerSubmitted && currentQuestion) {
      setIsAnswerSubmitted(true);
      try {
        await submitAnswer(currentQuestion.id, '', hintsUsed, undefined);
      } catch (err: any) {
        // Handle 404 error (stale question)
        if (err?.status === 404) {
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

  // Loading state
  if (isLoading && !isStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-secondary animate-pulse-soft" />
          </div>
          <p className="text-text-secondary font-medium">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  // Start screen
  if (!isStarted) {
    return (
      <main className="min-h-screen bg-background pb-24">
        <nav className="sticky top-0 z-50 bg-surface/80 backdrop-blur-lg border-b border-border">
          <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-3">
            <Link
              href="/ar"
              className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-text-primary">{t('quiz.title')}</h1>
              <p className="text-xs text-text-muted">{t('quiz.subtitle')}</p>
            </div>
          </div>
        </nav>

        <div className="max-w-3xl mx-auto px-4 py-12">
          <div className="bg-surface rounded-2xl border border-border shadow-xs overflow-hidden">
            <div className="relative bg-secondary p-10 text-center">
              <div className="absolute inset-0 opacity-[0.06]">
                <svg className="w-full h-full" viewBox="0 0 400 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="100" cy="100" r="80" stroke="white" strokeWidth="0.5" />
                  <circle cx="300" cy="100" r="80" stroke="white" strokeWidth="0.5" />
                  <circle cx="200" cy="100" r="60" stroke="white" strokeWidth="0.5" />
                </svg>
              </div>
              <div className="relative">
                <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-6">
                  <Brain className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">{t('quiz.ready')}</h2>
                <p className="text-white/70 max-w-md mx-auto text-sm leading-relaxed">
                  {t('quiz.description')}
                </p>
              </div>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="text-center p-4 bg-background rounded-xl">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
                    <Target className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-xl font-bold text-text-primary">
                    {DEFAULT_NUM_QUESTIONS}
                  </div>
                  <div className="text-xs text-text-muted">{t('quiz.questions')}</div>
                </div>
                <div className="text-center p-4 bg-background rounded-xl">
                  <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center mx-auto mb-2">
                    <Clock className="w-5 h-5 text-secondary" />
                  </div>
                  <div className="text-xl font-bold text-text-primary">
                    {TIME_PER_QUESTION_SECONDS}
                  </div>
                  <div className="text-xs text-text-muted">{t('quiz.secondsPerQuestion')}</div>
                </div>
                <div className="text-center p-4 bg-background rounded-xl">
                  <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center mx-auto mb-2">
                    <Lightbulb className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div className="text-xl font-bold text-text-primary">3</div>
                  <div className="text-xs text-text-muted">{t('quiz.hints')}</div>
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                onClick={handleStartQuiz}
                disabled={isLoading}
                className="w-full gap-2"
              >
                <Zap className="w-5 h-5" />
                {isLoading ? t('common.loading') : t('quiz.start')}
              </Button>

              {error && (
                <p className="mt-4 text-error text-sm text-center">{error}</p>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-lg border-t border-border" aria-label="Navigation">
          <div className="max-w-5xl mx-auto flex justify-around items-center h-16 px-4">
            <Link href="/ar" className="flex flex-col items-center gap-1 text-text-muted hover:text-primary transition-colors">
              <Home className="w-5 h-5" />
              <span className="text-[11px] font-medium">{t('nav.home')}</span>
            </Link>
            <Link href="/ar/game" className="flex flex-col items-center gap-1 text-text-muted hover:text-primary transition-colors">
              <MapPin className="w-5 h-5" />
              <span className="text-[11px] font-medium">{t('nav.game')}</span>
            </Link>
            <Link href="/ar/quiz" className="flex flex-col items-center gap-1 text-primary">
              <HelpCircle className="w-5 h-5" />
              <span className="text-[11px] font-medium">{t('nav.quiz')}</span>
            </Link>
            <Link href="/ar/stats" className="flex flex-col items-center gap-1 text-text-muted hover:text-primary transition-colors">
              <BarChart3 className="w-5 h-5" />
              <span className="text-[11px] font-medium">{t('nav.stats')}</span>
            </Link>
            <Link href="/ar/profile" className="flex flex-col items-center gap-1 text-text-muted hover:text-primary transition-colors">
              <User className="w-5 h-5" />
              <span className="text-[11px] font-medium">{t('nav.profile')}</span>
            </Link>
          </div>
        </nav>
      </main>
    );
  }

  // Completion screen
  if (isCompleted) {
    const totalQuestions = session?.questions.length || DEFAULT_NUM_QUESTIONS;
    const isPerfect = correctCount === totalQuestions;
    const isGood = accuracy >= 70;

    return (
      <main className="min-h-screen bg-background pb-24">
        <nav className="sticky top-0 z-50 bg-surface/80 backdrop-blur-lg border-b border-border">
          <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-3">
            <Link
              href="/ar"
              className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-bold text-text-primary">{t('quiz.title')}</h1>
          </div>
        </nav>

        <div className="max-w-3xl mx-auto px-4 py-12">
          <div className={`bg-surface rounded-2xl border shadow-xs overflow-hidden ${isPerfect ? 'border-success/30' : 'border-border'}`}>
            <div className={`p-10 text-center ${isPerfect ? 'bg-success/5' : ''}`}>
              <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 ${
                isPerfect ? 'bg-success/10' : isGood ? 'bg-primary/10' : 'bg-secondary/10'
              }`}>
                <Trophy className={`w-10 h-10 ${
                  isPerfect ? 'text-success' : isGood ? 'text-primary' : 'text-secondary'
                }`} />
              </div>
              <h2 className="text-2xl font-bold text-text-primary mb-2">
                {isPerfect
                  ? t('quiz.perfect')
                  : isGood
                  ? t('quiz.completed')
                  : t('quiz.tryAgain')}
              </h2>
              <p className="text-text-secondary text-sm">
                {t('quiz.completedMessage')}
              </p>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                <div className="bg-background rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-primary">{totalScore}</div>
                  <div className="text-xs text-text-muted mt-1">{t('quiz.finalScore')}</div>
                </div>
                <div className="bg-background rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-primary">
                    {correctCount}/{totalQuestions}
                  </div>
                  <div className="text-xs text-text-muted mt-1">{t('quiz.correct')}</div>
                </div>
                <div className="bg-background rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-primary">{accuracy}%</div>
                  <div className="text-xs text-text-muted mt-1">{t('quiz.accuracy')}</div>
                </div>
                <div className="bg-background rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-primary">{hintsUsed}</div>
                  <div className="text-xs text-text-muted mt-1">{t('quiz.hintsUsed')}</div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={resetQuiz} className="flex-1 gap-2">
                  <RotateCcw className="w-4 h-4" />
                  {t('quiz.playAgain')}
                </Button>
                <Link href="/ar" className="flex-1">
                  <Button variant="primary" className="w-full gap-2">
                    <Home className="w-4 h-4" />
                    {t('common.home')}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-lg border-t border-border" aria-label="Navigation">
          <div className="max-w-5xl mx-auto flex justify-around items-center h-16 px-4">
            <Link href="/ar" className="flex flex-col items-center gap-1 text-text-muted hover:text-primary transition-colors">
              <Home className="w-5 h-5" />
              <span className="text-[11px] font-medium">{t('nav.home')}</span>
            </Link>
            <Link href="/ar/game" className="flex flex-col items-center gap-1 text-text-muted hover:text-primary transition-colors">
              <MapPin className="w-5 h-5" />
              <span className="text-[11px] font-medium">{t('nav.game')}</span>
            </Link>
            <Link href="/ar/quiz" className="flex flex-col items-center gap-1 text-primary">
              <HelpCircle className="w-5 h-5" />
              <span className="text-[11px] font-medium">{t('nav.quiz')}</span>
            </Link>
            <Link href="/ar/stats" className="flex flex-col items-center gap-1 text-text-muted hover:text-primary transition-colors">
              <BarChart3 className="w-5 h-5" />
              <span className="text-[11px] font-medium">{t('nav.stats')}</span>
            </Link>
            <Link href="/ar/profile" className="flex flex-col items-center gap-1 text-text-muted hover:text-primary transition-colors">
              <User className="w-5 h-5" />
              <span className="text-[11px] font-medium">{t('nav.profile')}</span>
            </Link>
          </div>
        </nav>
      </main>
    );
  }

  // Quiz in progress - loading
  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-secondary animate-pulse-soft" />
          </div>
          <p className="text-text-secondary font-medium">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  const formattedOptions = currentQuestion.options?.map((opt, idx) => ({
    id: `option-${idx}`,
    key: opt,
  })) || [];

  return (
    <main className="min-h-screen bg-background pb-24">
      {/* Header */}
      <nav className="sticky top-0 z-50 bg-surface/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/ar"
              className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-bold text-text-primary">{t('quiz.title')}</h1>
          </div>
          <Timer
            key={questionTimerKey}
            initialSeconds={TIME_PER_QUESTION_SECONDS}
            onExpire={handleTimerExpire}
            isPaused={isAnswerSubmitted}
            showProgress
            locale="ar"
          />
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {/* Progress */}
        <QuizProgress
          currentQuestion={progress.current}
          totalQuestions={progress.total}
          score={totalScore}
          hintsRemaining={3 - hintsUsed}
          accuracy={answers.length > 0 ? accuracy : undefined}
          correctStreak={streak > 0 ? streak : undefined}
        />

        {/* Question Card */}
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

        {/* Answer Section */}
        <div className="bg-surface rounded-2xl border border-border p-6 shadow-xs">
          {currentQuestion.question_type === 'multiple_choice' ? (
            <div className="space-y-4">
              <AnswerOptions
                options={formattedOptions}
                onSelect={handleOptionSelect}
                selectedIndex={selectedOptionIndex}
                correctIndex={isAnswerSubmitted ? getCorrectAnswerIndex() : undefined}
                isSubmitted={isAnswerSubmitted}
                locale="ar"
              />

              {!isAnswerSubmitted && (
                <Button
                  variant="primary"
                  className="w-full mt-4"
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
              locale="ar"
            />
          )}

          {/* Answer Feedback */}
          {isAnswerSubmitted && currentAnswer && (
            <div
              className={`mt-4 p-4 rounded-xl ${
                currentAnswer.is_correct
                  ? 'bg-green-50 border border-green-200/60'
                  : 'bg-red-50 border border-red-200/60'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {currentAnswer.is_correct ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <span
                  className={`font-bold text-sm ${
                    currentAnswer.is_correct ? 'text-green-700' : 'text-red-700'
                  }`}
                >
                  {currentAnswer.is_correct ? t('quiz.correct') : t('quiz.incorrect')}
                </span>
                <span className="text-primary font-bold text-sm mr-auto">
                  +{currentAnswer.score} {t('quiz.points')}
                </span>
              </div>
              {currentAnswer.explanation && (
                <p className="text-text-secondary text-sm leading-relaxed">
                  {currentAnswer.explanation}
                </p>
              )}
            </div>
          )}

          {/* Next Question Button */}
          {isAnswerSubmitted && (
            <Button
              variant="primary"
              className="w-full mt-4 gap-2"
              onClick={handleNextQuestion}
            >
              {progress.current === progress.total
                ? t('quiz.viewResults')
                : t('quiz.nextQuestion')}
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Hint Button */}
        {!isAnswerSubmitted && currentQuestion.hint && (
          <div className="bg-surface rounded-2xl border border-border p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-text-muted" />
                <span className="text-text-secondary text-sm">
                  {t('quiz.hintsRemaining')}: {3 - hintsUsed}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleUseHint}
                disabled={hintsUsed >= 3}
                className="gap-1"
              >
                {t('quiz.useHint')} (-20 {t('quiz.points')})
              </Button>
            </div>
            {hintsUsed > 0 && currentQuestion.hint && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200/60 rounded-xl">
                <span className="text-yellow-800 text-sm">{currentQuestion.hint}</span>
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="text-center p-4 bg-error/5 border border-error/20 rounded-xl">
            <p className="text-error text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-lg border-t border-border" aria-label="Navigation">
        <div className="max-w-5xl mx-auto flex justify-around items-center h-16 px-4">
          <Link href="/ar" className="flex flex-col items-center gap-1 text-text-muted hover:text-primary transition-colors">
            <Home className="w-5 h-5" />
            <span className="text-[11px] font-medium">{t('nav.home')}</span>
          </Link>
          <Link href="/ar/game" className="flex flex-col items-center gap-1 text-text-muted hover:text-primary transition-colors">
            <MapPin className="w-5 h-5" />
            <span className="text-[11px] font-medium">{t('nav.game')}</span>
          </Link>
          <Link href="/ar/quiz" className="flex flex-col items-center gap-1 text-primary">
            <HelpCircle className="w-5 h-5" />
            <span className="text-[11px] font-medium">{t('nav.quiz')}</span>
          </Link>
          <Link href="/ar/stats" className="flex flex-col items-center gap-1 text-text-muted hover:text-primary transition-colors">
            <BarChart3 className="w-5 h-5" />
            <span className="text-[11px] font-medium">{t('nav.stats')}</span>
          </Link>
          <Link href="/ar/profile" className="flex flex-col items-center gap-1 text-text-muted hover:text-primary transition-colors">
            <User className="w-5 h-5" />
            <span className="text-[11px] font-medium">{t('nav.profile')}</span>
          </Link>
        </div>
      </nav>
    </main>
  );
}
