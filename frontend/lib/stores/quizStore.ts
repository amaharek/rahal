/**
 * Quiz state management with Zustand
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Question, QuizSession } from '@/types/quiz';

interface AnswerRecord {
  questionId: string;
  answer: string;
  isCorrect: boolean;
  timeMs: number;
  score: number;
}

interface QuizState {
  // Session data
  session: QuizSession | null;
  currentQuestionIndex: number;
  isStarted: boolean;
  isCompleted: boolean;

  // Progress tracking
  answers: AnswerRecord[];
  hintsUsed: number;
  totalScore: number;
  correctCount: number;
  streak: number;

  // Timer state
  timeRemaining: number;
  questionStartTime: number | null;

  // UI state
  isLoading: boolean;
  error: string | null;

  // Actions
  setSession: (session: QuizSession) => void;
  startQuiz: () => void;
  submitAnswer: (
    questionId: string,
    answer: string,
    isCorrect: boolean,
    score: number
  ) => void;
  useHint: () => void;
  nextQuestion: () => void;
  completeQuiz: () => void;
  resetQuiz: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setTimeRemaining: (time: number) => void;
  startQuestionTimer: () => void;

  // Computed helpers
  getCurrentQuestion: () => Question | null;
  getProgress: () => { current: number; total: number; percentage: number };
  getAccuracy: () => number;
}

export const useQuizStore = create<QuizState>()(
  persist(
    (set, get) => ({
      // Initial state
      session: null,
      currentQuestionIndex: 0,
      isStarted: false,
      isCompleted: false,
      answers: [],
      hintsUsed: 0,
      totalScore: 0,
      correctCount: 0,
      streak: 0,
      timeRemaining: 0,
      questionStartTime: null,
      isLoading: false,
      error: null,

      // Actions
      setSession: (session) => {
        set({
          session,
          timeRemaining: session.time_limit_seconds,
          error: null,
        });
      },

      startQuiz: () => {
        set({
          isStarted: true,
          currentQuestionIndex: 0,
          answers: [],
          hintsUsed: 0,
          totalScore: 0,
          correctCount: 0,
          streak: 0,
          isCompleted: false,
          questionStartTime: Date.now(),
          error: null,
        });
      },

      submitAnswer: (questionId, answer, isCorrect, score) => {
        const { questionStartTime, streak, correctCount } = get();
        const timeMs = questionStartTime ? Date.now() - questionStartTime : 0;

        const answerRecord: AnswerRecord = {
          questionId,
          answer,
          isCorrect,
          timeMs,
          score,
        };

        set((state) => ({
          answers: [...state.answers, answerRecord],
          totalScore: state.totalScore + score,
          correctCount: isCorrect ? correctCount + 1 : correctCount,
          streak: isCorrect ? streak + 1 : 0,
        }));
      },

      useHint: () => {
        set((state) => ({
          hintsUsed: state.hintsUsed + 1,
        }));
      },

      nextQuestion: () => {
        const { session, currentQuestionIndex } = get();
        if (!session) return;

        const nextIndex = currentQuestionIndex + 1;
        if (nextIndex >= session.questions.length) {
          get().completeQuiz();
        } else {
          set({
            currentQuestionIndex: nextIndex,
            questionStartTime: Date.now(),
          });
        }
      },

      completeQuiz: () => {
        set({
          isCompleted: true,
          questionStartTime: null,
        });
      },

      resetQuiz: () => {
        set({
          session: null,
          currentQuestionIndex: 0,
          isStarted: false,
          isCompleted: false,
          answers: [],
          hintsUsed: 0,
          totalScore: 0,
          correctCount: 0,
          streak: 0,
          timeRemaining: 0,
          questionStartTime: null,
          error: null,
        });
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      setError: (error) => {
        set({ error });
      },

      setTimeRemaining: (time) => {
        set({ timeRemaining: time });
      },

      startQuestionTimer: () => {
        set({ questionStartTime: Date.now() });
      },

      // Computed helpers
      getCurrentQuestion: () => {
        const { session, currentQuestionIndex } = get();
        if (!session || currentQuestionIndex >= session.questions.length) {
          return null;
        }
        return session.questions[currentQuestionIndex];
      },

      getProgress: () => {
        const { session, currentQuestionIndex } = get();
        const total = session?.questions.length || 0;
        const current = Math.min(currentQuestionIndex + 1, total);
        const percentage = total > 0 ? (current / total) * 100 : 0;
        return { current, total, percentage };
      },

      getAccuracy: () => {
        const { answers } = get();
        if (answers.length === 0) return 0;
        const correct = answers.filter((a) => a.isCorrect).length;
        return Math.round((correct / answers.length) * 100);
      },
    }),
    {
      name: 'rahal-quiz-storage',
      partialize: (state) => ({
        // Only persist session-related data
        session: state.session,
        currentQuestionIndex: state.currentQuestionIndex,
        isStarted: state.isStarted,
        isCompleted: state.isCompleted,
        answers: state.answers,
        hintsUsed: state.hintsUsed,
        totalScore: state.totalScore,
        correctCount: state.correctCount,
        timeRemaining: state.timeRemaining,
      }),
    }
  )
);
