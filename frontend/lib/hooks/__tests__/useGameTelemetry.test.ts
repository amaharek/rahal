import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useGameTelemetry } from '../useGameTelemetry';

// Mock all telemetry functions
vi.mock('@/lib/telemetry/gameTelemetry', () => ({
  trackCompletionPanelViewed: vi.fn(),
  trackABOutcomeCompletion: vi.fn(),
  trackComboStateChanged: vi.fn(),
  resetChallengeTelemetryState: vi.fn(),
  trackDockAction: vi.fn(),
  trackEfficiencyBenchmarkShown: vi.fn(),
  trackGuessSubmission: vi.fn(),
  trackHudRenderState: vi.fn(),
  trackInputFocusStart: vi.fn(),
  trackNarrativeMilestoneShown: vi.fn(),
  trackPostgameRecapShared: vi.fn(),
  trackPresentationVariantAssigned: vi.fn(),
  trackRecapCardViewed: vi.fn(),
  trackRetryCtaClicked: vi.fn(),
}));

import {
  trackCompletionPanelViewed,
  trackABOutcomeCompletion,
  trackComboStateChanged,
  resetChallengeTelemetryState,
  trackDockAction,
  trackEfficiencyBenchmarkShown,
  trackGuessSubmission,
  trackHudRenderState,
  trackInputFocusStart,
  trackNarrativeMilestoneShown,
  trackPostgameRecapShared,
  trackPresentationVariantAssigned,
  trackRecapCardViewed,
  trackRetryCtaClicked,
} from '@/lib/telemetry/gameTelemetry';

const BASE_PARAMS = {
  challengeId: 'c-1',
  routeMode: 'shortest' as const,
  guessesCount: 0,
  isCompleted: false,
  score: null,
  qualityTier: null,
  streakValue: null,
  hintsRemaining: 3,
  efficiencyBucket: 'pending' as const,
  shortestPath: 3,
  deltaFromShortestPath: 0,
  presentationVariant: 'hybrid' as const,
  isHybridPresentation: true,
  narrativeMilestone: 'start' as const,
  combo: 0,
  momentum: 'steady' as const,
};

describe('useGameTelemetry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fires resetChallengeTelemetryState when challengeId changes', () => {
    renderHook(() => useGameTelemetry(BASE_PARAMS));
    expect(resetChallengeTelemetryState).toHaveBeenCalledWith('c-1');
  });

  it('fires trackHudRenderState on mount', () => {
    renderHook(() => useGameTelemetry(BASE_PARAMS));
    expect(trackHudRenderState).toHaveBeenCalledWith(
      expect.objectContaining({ challengeId: 'c-1' })
    );
  });

  it('fires trackPresentationVariantAssigned on mount', () => {
    renderHook(() => useGameTelemetry(BASE_PARAMS));
    expect(trackPresentationVariantAssigned).toHaveBeenCalledWith(
      expect.objectContaining({ challengeId: 'c-1', variant: 'hybrid' })
    );
  });

  it('fires trackNarrativeMilestoneShown when isHybridPresentation is true', () => {
    renderHook(() => useGameTelemetry({ ...BASE_PARAMS, isHybridPresentation: true }));
    expect(trackNarrativeMilestoneShown).toHaveBeenCalledWith(
      expect.objectContaining({ challengeId: 'c-1', milestone: 'start' })
    );
  });

  it('does NOT fire trackNarrativeMilestoneShown when isHybridPresentation is false', () => {
    renderHook(() =>
      useGameTelemetry({ ...BASE_PARAMS, isHybridPresentation: false, presentationVariant: 'baseline' })
    );
    expect(trackNarrativeMilestoneShown).not.toHaveBeenCalled();
  });

  it('fires trackEfficiencyBenchmarkShown when guessesCount > 0', () => {
    renderHook(() =>
      useGameTelemetry({ ...BASE_PARAMS, guessesCount: 2 })
    );
    expect(trackEfficiencyBenchmarkShown).toHaveBeenCalledWith(
      expect.objectContaining({ challengeId: 'c-1', guessesCount: 2 })
    );
  });

  it('does NOT fire trackEfficiencyBenchmarkShown when guessesCount is 0', () => {
    renderHook(() => useGameTelemetry(BASE_PARAMS));
    expect(trackEfficiencyBenchmarkShown).not.toHaveBeenCalled();
  });

  it('fires completion events when isCompleted is true', () => {
    renderHook(() =>
      useGameTelemetry({ ...BASE_PARAMS, isCompleted: true, score: 900, guessesCount: 4 })
    );
    expect(trackCompletionPanelViewed).toHaveBeenCalledWith(
      expect.objectContaining({ challengeId: 'c-1', score: 900 })
    );
    expect(trackABOutcomeCompletion).toHaveBeenCalled();
    expect(trackRecapCardViewed).toHaveBeenCalled();
  });

  it('does NOT fire completion events when isCompleted is false', () => {
    renderHook(() => useGameTelemetry(BASE_PARAMS));
    expect(trackCompletionPanelViewed).not.toHaveBeenCalled();
    expect(trackABOutcomeCompletion).not.toHaveBeenCalled();
  });

  it('trackGuess fires trackGuessSubmission with correct args', () => {
    const { result } = renderHook(() => useGameTelemetry(BASE_PARAMS));
    result.current.trackGuess('EGY');
    expect(trackGuessSubmission).toHaveBeenCalledWith('c-1', 'shortest', 'EGY', 'hybrid');
  });

  it('trackHint fires trackDockAction with use_hint', () => {
    const { result } = renderHook(() => useGameTelemetry(BASE_PARAMS));
    result.current.trackHint();
    expect(trackDockAction).toHaveBeenCalledWith('c-1', 'shortest', 'use_hint');
  });

  it('trackDock fires trackDockAction with submit_guess', () => {
    const { result } = renderHook(() => useGameTelemetry(BASE_PARAMS));
    result.current.trackDock('submit_guess');
    expect(trackDockAction).toHaveBeenCalledWith('c-1', 'shortest', 'submit_guess');
  });

  it('trackFocusStart fires trackInputFocusStart', () => {
    const { result } = renderHook(() => useGameTelemetry(BASE_PARAMS));
    result.current.trackFocusStart();
    expect(trackInputFocusStart).toHaveBeenCalledWith('c-1');
  });

  it('trackCombo fires trackComboStateChanged when transition is not no_change', () => {
    const { result } = renderHook(() => useGameTelemetry(BASE_PARAMS));
    result.current.trackCombo({
      previousCombo: 0,
      nextCombo: 1,
      momentum: 'up',
      transition: 'increment',
      scoreEmoji: '🟢',
    });
    expect(trackComboStateChanged).toHaveBeenCalledWith(
      expect.objectContaining({ challengeId: 'c-1', momentum: 'up' })
    );
  });

  it('trackCombo does NOT fire when transition is no_change', () => {
    const { result } = renderHook(() => useGameTelemetry(BASE_PARAMS));
    result.current.trackCombo({
      previousCombo: 0,
      nextCombo: 0,
      momentum: 'steady',
      transition: 'no_change',
      scoreEmoji: '🔴',
    });
    expect(trackComboStateChanged).not.toHaveBeenCalled();
  });

  it('trackShare fires trackPostgameRecapShared', () => {
    const { result } = renderHook(() => useGameTelemetry(BASE_PARAMS));
    result.current.trackShare('clipboard');
    expect(trackPostgameRecapShared).toHaveBeenCalledWith(
      expect.objectContaining({ challengeId: 'c-1', shareMethod: 'clipboard' })
    );
  });

  it('trackRetry fires trackRetryCtaClicked', () => {
    const { result } = renderHook(() => useGameTelemetry(BASE_PARAMS));
    result.current.trackRetry('practice');
    expect(trackRetryCtaClicked).toHaveBeenCalledWith(
      expect.objectContaining({ challengeId: 'c-1', destination: 'practice' })
    );
  });

  it('does nothing when challengeId is undefined', () => {
    const { result } = renderHook(() =>
      useGameTelemetry({ ...BASE_PARAMS, challengeId: undefined })
    );
    // Action trackers should be no-ops
    result.current.trackGuess('EGY');
    result.current.trackHint();
    result.current.trackFocusStart();
    expect(trackGuessSubmission).not.toHaveBeenCalled();
    expect(trackDockAction).not.toHaveBeenCalled();
    expect(trackInputFocusStart).not.toHaveBeenCalled();
  });
});
