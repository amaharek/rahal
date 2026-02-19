/**
 * Game-related TypeScript types
 */

export type RouteMode = 'shortest' | 'explorer';

export interface Country {
  id: string;
  code: string;
  name_ar: string;
  name_en: string;
  flag_emoji: string | null;
}

export interface CountryFull extends Country {
  continent: string | null;
  region: string | null;
  population: number | null;
  area_km2: number | null;
  capital_ar: string | null;
  capital_en: string | null;
}

export interface UserProgress {
  guesses: GuessEntry[];
  hints_used: number;
  completed: boolean;
  score: number | null;
}

export interface DailyChallenge {
  id: string;
  challenge_date: string;
  start_country: Country;
  end_country: Country;
  shortest_path: number;
  mode: RouteMode;
  path_country_codes: string[];
  user_progress: UserProgress | null;
}

export interface GuessEntry {
  country_id: string;
  country_code: string;
  name_ar: string;
  name_en?: string;
  flag_emoji: string | null;
  emoji: ScoreEmoji;
  order: number;
}

export type ScoreEmoji = '🟢' | '🟡' | '🟠' | '🔴' | '⚫';

export interface GuessRequest {
  challenge_id: string;
  country_id: string;
  mode: RouteMode;
}

export interface GuessResponse {
  country: Country;
  score_emoji: ScoreEmoji;
  score_description: string;
  is_on_shortest_path: boolean;
  is_destination: boolean;
  game_complete: boolean;
  total_guesses: number;
  score: number | null;
  route_mode: RouteMode;
  gap_from_optimal: number | null;
  quality_tier: 'perfect' | 'near_optimal' | 'good_discovery' | 'scenic' | null;
  quality_explanation_ar: string | null;
}

export interface HintRequest {
  challenge_id: string;
  mode: RouteMode;
}

export interface HintResponse {
  hint_type: 'progressive_1' | 'progressive_2' | 'progressive_3';
  hint_data: Record<string, unknown>;
  hints_remaining: number;
}

export interface GameStats {
  games_played: number;
  games_won: number;
  win_rate: number;
  current_streak: number;
  max_streak: number;
  average_guesses: number;
  hints_used_total: number;
  last_played: string | null;
}

export interface PracticeSessionRequest {
  start_country_id: string;
  end_country_id: string;
  mode: RouteMode;
}

export interface PracticeSession {
  session_id: string;
  mode: 'practice';
  route_mode: RouteMode;
  start_country: Country;
  end_country: Country;
  shortest_path: number;
  path_country_codes: string[];
  user_progress: UserProgress | null;
}

export interface PracticeGuessRequest {
  session_id: string;
  country_id: string;
  mode: RouteMode;
}

export interface PracticeHintRequest {
  session_id: string;
  mode: RouteMode;
}

export interface GameCompleteData {
  completed: boolean;
  score: number;
  total_guesses: number;
  hints_used: number;
  shortest_path: number;
  is_optimal: boolean;
}

// Score emoji descriptions in Arabic
export const EMOJI_DESCRIPTIONS: Record<ScoreEmoji, string> = {
  '🟢': 'ممتاز',
  '🟡': 'جيد',
  '🟠': 'مقبول',
  '🔴': 'بعيد',
  '⚫': 'قارة مختلفة',
};
