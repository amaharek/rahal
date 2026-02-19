import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DailyGamePage } from '@/components/game/DailyGamePage';
import { useGameStore } from '@/lib/stores/gameStore';

const { mockChallenge } = vi.hoisted(() => ({
  mockChallenge: {
    id: 'challenge-id',
    challenge_date: '2026-02-19',
    mode: 'shortest' as const,
    shortest_path: 4,
    path_country_codes: ['JOR', 'ISR', 'EGY'],
    start_country: {
      id: '1',
      code: 'JOR',
      name_ar: 'الأردن',
      name_en: 'Jordan',
      flag_emoji: '🇯🇴',
    },
    end_country: {
      id: '2',
      code: 'EGY',
      name_ar: 'مصر',
      name_en: 'Egypt',
      flag_emoji: '🇪🇬',
    },
    user_progress: null,
  },
}));

vi.mock('next/dynamic', () => ({
  default: () => () => <div data-testid="mock-map" />,
}));

vi.mock('@/components/game/GameMap', () => ({
  MapSkeleton: () => <div data-testid="map-skeleton" />,
  MapErrorBoundary: ({ children }: { children: any }) => <>{children}</>,
}));

vi.mock('@/components/game/CountryInput', () => ({
  CountryInput: ({ onFocusStart, onCountryCommitted, onSelect }: any) => (
    <div>
      <button type="button" data-testid="integration-focus" onClick={() => onFocusStart?.()}>
        Focus
      </button>
      <button
        type="button"
        data-testid="integration-commit"
        onClick={() => {
          onCountryCommitted?.('SAU');
          onSelect?.({
            id: '3',
            code: 'SAU',
            name_ar: 'السعودية',
            name_en: 'Saudi Arabia',
            flag_emoji: '🇸🇦',
          });
        }}
      >
        Commit
      </button>
    </div>
  ),
}));

vi.mock('@/lib/api/game', () => ({
  getDailyChallenge: vi.fn().mockResolvedValue(mockChallenge),
  getGameStats: vi.fn().mockResolvedValue({ current_streak: 5 }),
  submitGuess: vi.fn().mockResolvedValue({
    country: {
      id: '3',
      code: 'SAU',
      name_ar: 'السعودية',
      name_en: 'Saudi Arabia',
      flag_emoji: '🇸🇦',
    },
    score_emoji: '🟡',
    score_description: 'good',
    is_on_shortest_path: true,
    is_destination: false,
    game_complete: false,
    total_guesses: 1,
    score: null,
    route_mode: 'shortest',
    gap_from_optimal: null,
    quality_tier: null,
    quality_explanation_ar: null,
  }),
  useHint: vi.fn().mockResolvedValue({
    hint_type: 'progressive_1',
    hint_data: {
      country_name_ar: 'الأردن',
      border_countries: ['فلسطين'],
    },
    hints_remaining: 2,
  }),
  searchCountries: vi.fn().mockResolvedValue({
    query: 'الس',
    suggestions: [
      {
        id: '3',
        code: 'SAU',
        name_ar: 'السعودية',
        name_en: 'Saudi Arabia',
        flag_emoji: '🇸🇦',
        similarity: 0.98,
      },
    ],
    total: 1,
  }),
}));

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <DailyGamePage />
    </QueryClientProvider>
  );
}

describe('DailyGamePage integration', () => {
  beforeEach(() => {
    useGameStore.setState({
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
    });
  });

  it('renders map-first layout and emits required telemetry events on interaction', async () => {
    const user = userEvent.setup();
    const listener = vi.fn();
    window.addEventListener('rahal:telemetry', listener as EventListener);

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('game-hud')).toBeInTheDocument();
      expect(screen.getByTestId('game-map')).toBeInTheDocument();
      expect(screen.getAllByTestId('game-action-dock').length).toBeGreaterThan(0);
    });

    await user.click(screen.getAllByTestId('integration-focus')[0]);
    await user.click(screen.getAllByTestId('integration-commit')[0]);
    await user.click(screen.getAllByTestId('game-hint-button')[0]);

    await waitFor(() => {
      const eventNames = listener.mock.calls.map((args: any[]) => (args[0] as CustomEvent).detail.eventName);
      expect(eventNames).toContain('hud_render_state');
      expect(eventNames).toContain('focus_to_submit_ms');
      expect(eventNames).toContain('dock_action_triggered');
    });

    window.removeEventListener('rahal:telemetry', listener as EventListener);
  });
});
