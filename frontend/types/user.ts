export interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  home_country_code: string | null;
  current_streak: number;
  max_streak: number;
  games_played: number;
  games_won: number;
  total_questions_answered: number;
  total_correct_answers: number;
  win_rate: number;
  quiz_accuracy: number;
  created_at: string;
}

export interface Achievement {
  id: string;
  code: string;
  name_ar: string;
  name_en: string;
  description_ar: string | null;
  description_en: string | null;
  icon: string | null;
  category: string | null;
  points: number;
}

export interface UserAchievement {
  id: string;
  achievement: Achievement;
  progress: Record<string, unknown>;
  unlocked_at: string | null;
  is_unlocked: boolean;
}

export interface ProfileUpdatePayload {
  username?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  home_country_code?: string | null;
  preferences?: Record<string, unknown>;
}

export type LeaderboardType = 'max_streak' | 'games_won' | 'current_streak';

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  home_country_code: string | null;
  score: number;
  games_played: number;
}

export interface LeaderboardResponse {
  type: LeaderboardType;
  entries: LeaderboardEntry[];
  total_users: number;
  user_rank: number | null;
}
