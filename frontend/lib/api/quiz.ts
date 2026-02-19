/**
 * Quiz API functions
 */

import { get, post } from './client';
import type {
  Question,
  AnswerRequest,
  AnswerResponse,
  QuizSession,
  QuizStats,
} from '@/types/quiz';

/**
 * Get a random question
 */
export async function getRandomQuestion(params?: {
  category?: string;
  difficulty?: string;
  question_type?: string;
}): Promise<Question> {
  const searchParams = new URLSearchParams();
  if (params?.category) searchParams.set('category', params.category);
  if (params?.difficulty) searchParams.set('difficulty', params.difficulty);
  if (params?.question_type) searchParams.set('question_type', params.question_type);

  const query = searchParams.toString();
  return get<Question>(`/api/quiz/question${query ? `?${query}` : ''}`);
}

/**
 * Submit an answer
 */
export async function submitAnswer(
  data: AnswerRequest,
  token?: string
): Promise<AnswerResponse> {
  return post<AnswerResponse>('/api/quiz/answer', data, token);
}

/**
 * Start a quiz session
 */
export async function startQuizSession(params?: {
  category?: string;
  difficulty?: string;
  question_type?: string;
  num_questions?: number;
}): Promise<QuizSession> {
  return post<QuizSession>('/api/quiz/session', params || {});
}

/**
 * Get daily quiz
 */
export async function getDailyQuiz(): Promise<QuizSession> {
  return get<QuizSession>('/api/quiz/daily');
}

/**
 * Get quiz statistics
 */
export async function getQuizStats(token: string): Promise<QuizStats> {
  return get<QuizStats>('/api/quiz/stats', token);
}

/**
 * Get available categories
 */
export async function getCategories(): Promise<{
  categories: Array<{
    value: string;
    label_ar: string;
    label_en: string;
  }>;
}> {
  return get('/api/quiz/categories');
}
