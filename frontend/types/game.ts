/**
 * Game-related TypeScript types
 */

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
  path_country_codes: string[];
  user_progress: UserProgress | null;
}

export interface GuessEntry {
  country_id: string;
  country_code: string;
  name_ar: string;
  flag_emoji: string | null;
  emoji: ScoreEmoji;
  order: number;
}

export type ScoreEmoji = '🟢' | '🟡' | '🟠' | '🔴' | '⚫';

export interface GuessRequest {
  challenge_id: string;
  country_id: string;
}

export interface GuessResponse {
  country: Country;
  score_emoji: ScoreEmoji;
  score_description: string;
  is_on_shortest_path: boolean;
  is_destination: boolean;
  game_complete: boolean;
  total_guesses: number;
}

export type HintType = 'border_hint' | 'all_borders_hint' | 'first_letter_hint';

export interface HintRequest {
  challenge_id: string;
  hint_type: HintType;
}

export interface HintResponse {
  hint_type: string;
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
