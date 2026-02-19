/**
 * Game API functions
 */

import { get, post } from './client';
import type {
  DailyChallenge,
  GuessRequest,
  GuessResponse,
  HintRequest,
  HintResponse,
  GameStats,
  PracticeSession,
  PracticeSessionRequest,
  PracticeGuessRequest,
  PracticeHintRequest,
  RouteMode,
} from '@/types/game';

/**
 * Get today's daily challenge
 */
export async function getDailyChallenge(mode: RouteMode, token?: string): Promise<DailyChallenge> {
  return get<DailyChallenge>(`/api/game/daily?mode=${mode}`, token);
}

/**
 * Get challenge for a specific date
 */
export async function getChallengeByDate(
  date: string,
  mode: RouteMode,
  token?: string
): Promise<DailyChallenge> {
  return get<DailyChallenge>(`/api/game/daily?challenge_date=${date}&mode=${mode}`, token);
}

/**
 * Submit a guess for the daily challenge
 */
export async function submitGuess(
  data: GuessRequest,
  token?: string
): Promise<GuessResponse> {
  return post<GuessResponse>('/api/game/guess', data, token);
}

/**
 * Use a hint
 */
export async function useHint(
  data: HintRequest,
  token?: string
): Promise<HintResponse> {
  return post<HintResponse>('/api/game/hint', data, token);
}

/**
 * Get user's game statistics
 */
export async function getGameStats(token: string): Promise<GameStats> {
  return get<GameStats>('/api/game/stats', token);
}

/**
 * Create a practice session
 */
export async function createPracticeSession(
  data: PracticeSessionRequest,
  token?: string
): Promise<PracticeSession> {
  return post<PracticeSession>('/api/game/practice/session', data, token);
}

/**
 * Submit a guess in practice mode
 */
export async function submitPracticeGuess(
  data: PracticeGuessRequest,
  token?: string
): Promise<GuessResponse> {
  return post<GuessResponse>('/api/game/practice/guess', data, token);
}

/**
 * Use a hint in practice mode
 */
export async function usePracticeHint(
  data: PracticeHintRequest,
  token?: string
): Promise<HintResponse> {
  return post<HintResponse>('/api/game/practice/hint', data, token);
}

/**
 * Search countries for autocomplete
 */
export async function searchCountries(
  query: string,
  limit = 10
): Promise<{
  query: string;
  suggestions: Array<{
    id: string;
    code: string;
    name_ar: string;
    name_en: string;
    flag_emoji: string | null;
    similarity: number;
  }>;
  total: number;
}> {
  return get(`/api/autocomplete/countries?q=${encodeURIComponent(query)}&limit=${limit}`);
}
