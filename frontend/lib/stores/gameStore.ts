/**
 * Game state management with Zustand
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { calculateMapView } from '@/lib/geo';
import type { DailyChallenge, GuessEntry, ScoreEmoji } from '@/types/game';

interface GameState {
  // Current challenge
  challenge: DailyChallenge | null;
  isLoading: boolean;
  error: string | null;

  // Game progress
  guesses: GuessEntry[];
  hintsUsed: number;
  isCompleted: boolean;
  score: number | null;

  // Map state
  mapZoom: number;
  mapCenter: [number, number];
  showMap: boolean;

  // Actions
  setChallenge: (challenge: DailyChallenge) => void;
  addGuess: (guess: GuessEntry) => void;
  useHint: () => void;
  completeGame: (score: number) => void;
  resetGame: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setMapZoom: (zoom: number) => void;
  setMapCenter: (center: [number, number]) => void;
  toggleMap: () => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      // Initial state
      challenge: null,
      isLoading: false,
      error: null,
      guesses: [],
      hintsUsed: 0,
      isCompleted: false,
      score: null,
      mapZoom: 1.5,
      mapCenter: [35, 25],
      showMap: true,

      // Actions
      setChallenge: (challenge) => {
        // If same challenge date, keep local progress but update challenge object
        const currentChallenge = get().challenge;
        if (
          currentChallenge &&
          currentChallenge.challenge_date === challenge.challenge_date &&
          currentChallenge.id === challenge.id &&
          currentChallenge.mode === challenge.mode
        ) {
          // Same challenge - keep existing local progress
          set({ challenge }); // Update challenge object in case of any changes
          return;
        }

        // Different challenge or date - reset or restore from server
        const mapView = calculateMapView(
          challenge.start_country.code,
          challenge.end_country.code,
          challenge.path_country_codes || []
        );

        set({
          challenge,
          guesses: challenge.user_progress?.guesses || [],
          hintsUsed: challenge.user_progress?.hints_used || 0,
          isCompleted: challenge.user_progress?.completed || false,
          score: challenge.user_progress?.score || null,
          mapZoom: mapView.zoom,
          mapCenter: mapView.center,
          error: null,
        });
      },

      addGuess: (guess) => {
        set((state) => ({
          guesses: [...state.guesses, guess],
        }));
      },

      useHint: () => {
        set((state) => ({
          hintsUsed: state.hintsUsed + 1,
        }));
      },

      completeGame: (score) => {
        set({
          isCompleted: true,
          score,
        });
      },

      resetGame: () => {
        set({
          guesses: [],
          hintsUsed: 0,
          isCompleted: false,
          score: null,
          error: null,
        });
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      setError: (error) => {
        set({ error });
      },

      setMapZoom: (zoom) => {
        set({ mapZoom: zoom });
      },

      setMapCenter: (center) => {
        set({ mapCenter: center });
      },

      toggleMap: () => {
        set((state) => ({ showMap: !state.showMap }));
      },
    }),
    {
      name: 'rahal-game-storage',
      partialize: (state) => ({
        challenge: state.challenge,
        guesses: state.guesses,
        hintsUsed: state.hintsUsed,
        isCompleted: state.isCompleted,
        score: state.score,
      }),
    }
  )
);
