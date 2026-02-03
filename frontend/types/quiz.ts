/**
 * Quiz-related TypeScript types
 */

export type QuestionCategory =
  | 'capitals'
  | 'flags'
  | 'landmarks'
  | 'attractions'
  | 'geography'
  | 'borders'
  | 'population'
  | 'arab_world';

export type QuestionDifficulty = 'easy' | 'medium' | 'hard';

export type QuestionType = 'multiple_choice' | 'autocomplete';

export interface Question {
  id: string;
  category: QuestionCategory;
  difficulty: QuestionDifficulty;
  question_type: QuestionType;
  question_ar: string;
  options: string[] | null;
  hint: string | null;
  image_url: string | null;
}

export interface AnswerRequest {
  question_id: string;
  answer: string;
  hints_used: number;
  time_taken_ms?: number;
}

export interface AnswerResponse {
  is_correct: boolean;
  correct_answer: string;
  score: number;
  explanation: string | null;
}

export interface QuizSession {
  session_id: string;
  questions: Question[];
  total_questions: number;
  time_limit_seconds: number;
}

export interface CategoryStats {
  answered: number;
  correct: number;
  accuracy: number;
}

export interface QuizStats {
  total_answered: number;
  total_correct: number;
  accuracy: number;
  by_category: Record<string, CategoryStats>;
  by_difficulty: Record<string, CategoryStats>;
}

// Category labels in Arabic
export const CATEGORY_LABELS: Record<QuestionCategory, string> = {
  capitals: 'العواصم',
  flags: 'الأعلام',
  landmarks: 'المعالم',
  attractions: 'معالم الجذب',
  geography: 'الجغرافيا',
  borders: 'الحدود',
  population: 'السكان',
  arab_world: 'العالم العربي',
};

// Difficulty labels in Arabic
export const DIFFICULTY_LABELS: Record<QuestionDifficulty, string> = {
  easy: 'سهل',
  medium: 'متوسط',
  hard: 'صعب',
};

// Difficulty colors
export const DIFFICULTY_COLORS: Record<QuestionDifficulty, string> = {
  easy: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  hard: 'bg-red-100 text-red-800',
};
