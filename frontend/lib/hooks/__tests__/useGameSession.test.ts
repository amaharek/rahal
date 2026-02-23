import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { useGameSession } from '../useGameSession';

// ── Fixtures ──────────────────────────────────────────────────────────────────
// Defined with vi.hoisted so they're available inside vi.mock factory (hoisted to top)

const { CHALLENGE } = vi.hoisted(() => ({
  CHALLENGE: {
    id: 'ch-1',
    challenge_date: '2026-02-23',
    start_country: { id: 's1', code: 'EGY', name_ar: 'مصر', name_en: 'Egypt', flag_emoji: '🇪🇬' },
    end_country:   { id: 'e1', code: 'JPN', name_ar: 'اليابان', name_en: 'Japan', flag_emoji: '🇯🇵' },
    shortest_path: 3,
    mode: 'shortest',
    path_country_codes: ['EGY', 'IND', 'JPN'],
    user_progress: null,
  },
}));

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('@/lib/api/game', () => ({
  getDailyChallenge: vi.fn().mockResolvedValue(CHALLENGE),
  getGameStats: vi.fn().mockResolvedValue({ current_streak: 5 }),
  submitGuess: vi.fn().mockResolvedValue({
    country: { id: 'g1', code: 'IND', name_ar: 'الهند', name_en: 'India', flag_emoji: '🇮🇳' },
    score_emoji: '🟢',
    game_complete: false,
    score: null,
    quality_tier: null,
    quality_explanation_ar: null,
  }),
  useHint: vi.fn().mockResolvedValue({
    hint_type: 'progressive_1',
    hint_data: { country_name_ar: 'الهند', border_countries: ['باكستان'] },
    hints_remaining: 2,
  }),
}));

vi.mock('@/lib/stores/gameStore', () => {
  let state = {
    challenge: null as typeof CHALLENGE | null,
    guesses: [] as any[],
    hintsUsed: 0,
    isCompleted: false,
    score: null as number | null,
    mapZoom: 1.5,
    mapCenter: [35, 25] as [number, number],
  };

  return {
    useGameStore: vi.fn((selector?: (s: typeof state) => any) => {
      const actions = {
        setChallenge: vi.fn((c: typeof CHALLENGE) => { state.challenge = c; }),
        addGuess: vi.fn((g: any) => { state.guesses = [...state.guesses, g]; }),
        useHint: vi.fn(() => { state.hintsUsed += 1; }),
        completeGame: vi.fn((s: number) => { state.isCompleted = true; state.score = s; }),
        setError: vi.fn(),
        setMapZoom: vi.fn((z: number) => { state.mapZoom = z; }),
        setMapCenter: vi.fn((c: [number, number]) => { state.mapCenter = c; }),
      };
      return selector ? selector({ ...state, ...actions }) : { ...state, ...actions };
    }),
  };
});

vi.mock('@/lib/stores/authStore', () => ({
  useAuthStore: vi.fn((selector?: (s: any) => any) => {
    const state = { accessToken: 'tok', user: { id: 'u-1' } };
    return selector ? selector(state) : state;
  }),
}));

vi.mock('@/lib/game/progression', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return { ...actual };
});

vi.mock('@/lib/game/phase3', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return { ...actual };
});

// ── Test helpers ──────────────────────────────────────────────────────────────

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useGameSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initially shows loading state', () => {
    const { result } = renderHook(() => useGameSession(), { wrapper: makeWrapper() });
    expect(result.current.isLoading).toBe(true);
    expect(result.current.challenge).toBeNull();
  });

  it('loads challenge data after fetch', async () => {
    const { result } = renderHook(() => useGameSession(), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    // Challenge is set in store by the hook; verify store setter was called
    const { getDailyChallenge } = await import('@/lib/api/game');
    expect(getDailyChallenge).toHaveBeenCalledWith('shortest');
  });

  it('exposes hintsRemaining = 3 - hintsUsed', async () => {
    const { result } = renderHook(() => useGameSession(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.hintsRemaining).toBe(3);
  });

  it('starts with combo=0', async () => {
    const { result } = renderHook(() => useGameSession(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.combo).toBe(0);
  });

  it('handleCountrySelect mutates submitGuess when challenge exists', async () => {
    const { getDailyChallenge, submitGuess } = await import('@/lib/api/game');
    const { useGameStore } = await import('@/lib/stores/gameStore');

    // Make store return a challenge
    vi.mocked(useGameStore).mockImplementation((selector?: any) => {
      const state = {
        challenge: CHALLENGE,
        guesses: [],
        hintsUsed: 0,
        isCompleted: false,
        score: null,
        mapZoom: 1.5,
        mapCenter: [35, 25] as [number, number],
        setChallenge: vi.fn(),
        addGuess: vi.fn(),
        useHint: vi.fn(),
        completeGame: vi.fn(),
        setError: vi.fn(),
        setMapZoom: vi.fn(),
        setMapCenter: vi.fn(),
      };
      return selector ? selector(state) : state;
    });

    const { result } = renderHook(() => useGameSession(), { wrapper: makeWrapper() });

    await act(async () => {
      result.current.handleCountrySelect({
        id: 'g1',
        code: 'IND',
        name_ar: 'الهند',
        name_en: 'India',
        flag_emoji: '🇮🇳',
      });
    });

    await waitFor(() => expect(submitGuess).toHaveBeenCalled());
  });

  it('handleHintRequest mutates useHint when hints remain', async () => {
    const { useHint } = await import('@/lib/api/game');
    const { useGameStore } = await import('@/lib/stores/gameStore');

    vi.mocked(useGameStore).mockImplementation((selector?: any) => {
      const state = {
        challenge: CHALLENGE,
        guesses: [],
        hintsUsed: 0,
        isCompleted: false,
        score: null,
        mapZoom: 1.5,
        mapCenter: [35, 25] as [number, number],
        setChallenge: vi.fn(),
        addGuess: vi.fn(),
        useHint: vi.fn(),
        completeGame: vi.fn(),
        setError: vi.fn(),
        setMapZoom: vi.fn(),
        setMapCenter: vi.fn(),
      };
      return selector ? selector(state) : state;
    });

    const { result } = renderHook(() => useGameSession(), { wrapper: makeWrapper() });

    await act(async () => {
      result.current.handleHintRequest();
    });

    await waitFor(() => expect(useHint).toHaveBeenCalled());
  });

  it('getCountryNameByLocale returns Arabic name for ar locale', async () => {
    const { result } = renderHook(() => useGameSession(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const name = result.current.getCountryNameByLocale({ name_ar: 'مصر', name_en: 'Egypt' });
    // vitest.setup.ts mocks useLocale to return 'ar'
    expect(name).toBe('مصر');
  });

  it('routeMode defaults to shortest and can be changed', async () => {
    const { result } = renderHook(() => useGameSession(), { wrapper: makeWrapper() });
    expect(result.current.routeMode).toBe('shortest');

    act(() => { result.current.setRouteMode('explorer'); });
    expect(result.current.routeMode).toBe('explorer');
  });
});
