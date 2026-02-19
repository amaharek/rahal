/**
 * React Query hooks for Quiz API integration
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  startQuizSession,
  getDailyQuiz,
  submitAnswer,
  getQuizStats,
  getRandomQuestion,
} from '@/lib/api/quiz';
import { useQuizStore } from '@/lib/stores/quizStore';
import type { AnswerRequest, QuizSession, Question } from '@/types/quiz';

/**
 * Hook for starting a quiz session
 */
export function useStartQuizSession() {
  const { setSession, setLoading, setError, startQuiz } = useQuizStore();

  return useMutation({
    mutationFn: (params?: {
      category?: string;
      difficulty?: string;
      question_type?: string;
      num_questions?: number;
    }) => startQuizSession(params),
    onMutate: () => {
      setLoading(true);
      setError(null);
    },
    onSuccess: (session: QuizSession) => {
      setSession(session);
      startQuiz();
      setLoading(false);
    },
    onError: (error: Error) => {
      setError(error.message);
      setLoading(false);
    },
  });
}

/**
 * Hook for fetching daily quiz
 */
export function useDailyQuiz(enabled = false) {
  const { setSession, setError, startQuiz } = useQuizStore();

  return useQuery({
    queryKey: ['daily-quiz'],
    queryFn: getDailyQuiz,
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    select: (session: QuizSession) => {
      setSession(session);
      startQuiz();
      return session;
    },
  });
}

/**
 * Hook for submitting an answer
 */
export function useSubmitAnswer(token?: string) {
  const { submitAnswer: storeSubmitAnswer, nextQuestion, setError } = useQuizStore();

  return useMutation({
    mutationFn: (data: AnswerRequest) => submitAnswer(data, token),
    onSuccess: (response, variables) => {
      storeSubmitAnswer(
        variables.question_id,
        variables.answer,
        response.is_correct,
        response.score
      );
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });
}

/**
 * Hook for fetching quiz statistics
 */
export function useQuizStats(token: string, enabled = true) {
  return useQuery({
    queryKey: ['quiz-stats', token],
    queryFn: () => getQuizStats(token),
    enabled: Boolean(token) && enabled,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook for fetching a random question (for practice mode)
 */
export function useRandomQuestion(params?: {
  category?: string;
  difficulty?: string;
  question_type?: string;
}) {
  return useQuery({
    queryKey: ['random-question', params],
    queryFn: () => getRandomQuestion(params),
    enabled: false, // Manual trigger only
    staleTime: 0, // Always fresh
  });
}

/**
 * Combined hook for full quiz flow
 */
export function useQuiz(token?: string) {
  const queryClient = useQueryClient();
  const store = useQuizStore();

  const startSession = useStartQuizSession();
  const submitAnswerMutation = useSubmitAnswer(token);

  const handleStartQuiz = async (params?: {
    category?: string;
    difficulty?: string;
    num_questions?: number;
  }) => {
    return startSession.mutateAsync(params);
  };

  const handleSubmitAnswer = async (
    questionId: string,
    answer: string,
    hintsUsed: number,
    timeTakenMs?: number
  ) => {
    const result = await submitAnswerMutation.mutateAsync({
      question_id: questionId,
      answer,
      hints_used: hintsUsed,
      time_taken_ms: timeTakenMs,
    });

    return result;
  };

  const handleNextQuestion = () => {
    store.nextQuestion();
  };

  const handleUseHint = () => {
    store.useHint();
  };

  const handleResetQuiz = () => {
    store.resetQuiz();
    queryClient.invalidateQueries({ queryKey: ['quiz-session'] });
  };

  return {
    // State from store
    session: store.session,
    currentQuestionIndex: store.currentQuestionIndex,
    isStarted: store.isStarted,
    isCompleted: store.isCompleted,
    answers: store.answers,
    hintsUsed: store.hintsUsed,
    totalScore: store.totalScore,
    correctCount: store.correctCount,
    streak: store.streak,
    timeRemaining: store.timeRemaining,
    isLoading: store.isLoading || startSession.isPending || submitAnswerMutation.isPending,
    error: store.error,

    // Computed
    currentQuestion: store.getCurrentQuestion(),
    progress: store.getProgress(),
    accuracy: store.getAccuracy(),

    // Actions
    startQuiz: handleStartQuiz,
    submitAnswer: handleSubmitAnswer,
    nextQuestion: handleNextQuestion,
    useHint: handleUseHint,
    resetQuiz: handleResetQuiz,
    setTimeRemaining: store.setTimeRemaining,

    // Mutation states
    isSubmitting: submitAnswerMutation.isPending,
    submitError: submitAnswerMutation.error,
    lastAnswer: submitAnswerMutation.data,
  };
}
