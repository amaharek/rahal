import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  trackCompletionPanelViewed,
  trackComboStateChanged,
  trackEfficiencyBenchmarkShown,
  resetChallengeTelemetryState,
  trackInputFocusStart,
  trackGuessSubmission,
  trackHudRenderState,
  trackDockAction,
  trackNarrativeMilestoneShown,
  trackPostgameRecapShared,
  trackPresentationVariantAssigned,
  trackRetryCtaClicked,
} from '@/lib/telemetry/gameTelemetry';

describe('gameTelemetry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-19T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('emits focus_to_submit_ms and guess_to_guess_ms once per stable boundary', () => {
    const listener = vi.fn();
    window.addEventListener('rahal:telemetry', listener as EventListener);

    const challengeId = 'challenge-1';
    resetChallengeTelemetryState(challengeId);

    trackInputFocusStart(challengeId);
    vi.setSystemTime(new Date('2026-02-19T12:00:02Z'));
    trackGuessSubmission(challengeId, 'shortest', 'EGY');

    vi.setSystemTime(new Date('2026-02-19T12:00:08Z'));
    trackGuessSubmission(challengeId, 'shortest', 'JOR');

    const events = listener.mock.calls.map((args: any[]) => (args[0] as CustomEvent).detail.eventName);

    expect(events).toContain('focus_to_submit_ms');
    expect(events).toContain('guess_to_guess_ms');

    window.removeEventListener('rahal:telemetry', listener as EventListener);
  });

  it('deduplicates identical hud_render_state payloads', () => {
    const listener = vi.fn();
    window.addEventListener('rahal:telemetry', listener as EventListener);

    const payload = {
      challengeId: 'challenge-2',
      mode: 'shortest' as const,
      streak: 4,
      hintsRemaining: 2,
      efficiency: 'medium' as const,
      guessesCount: 3,
      isCompleted: false,
    };

    trackHudRenderState(payload);
    trackHudRenderState(payload);
    trackDockAction('challenge-2', 'shortest', 'use_hint');

    const eventNames = listener.mock.calls.map((args: any[]) => (args[0] as CustomEvent).detail.eventName);
    const hudEvents = eventNames.filter((name: string) => name === 'hud_render_state');

    expect(hudEvents).toHaveLength(1);
    expect(eventNames).toContain('dock_action_triggered');

    window.removeEventListener('rahal:telemetry', listener as EventListener);
  });

  it('emits and deduplicates phase 2 telemetry events correctly', () => {
    const listener = vi.fn();
    window.addEventListener('rahal:telemetry', listener as EventListener);

    trackEfficiencyBenchmarkShown({
      challengeId: 'challenge-3',
      mode: 'shortest',
      shortestPath: 4,
      guessesCount: 2,
      deltaFromShortestPath: -2,
      efficiency: 'high',
    });
    trackEfficiencyBenchmarkShown({
      challengeId: 'challenge-3',
      mode: 'shortest',
      shortestPath: 4,
      guessesCount: 2,
      deltaFromShortestPath: -2,
      efficiency: 'high',
    });
    trackComboStateChanged({
      challengeId: 'challenge-3',
      mode: 'shortest',
      previousCombo: 1,
      nextCombo: 2,
      momentum: 'up',
      transition: 'increase',
      scoreEmoji: '🟢',
    });
    trackCompletionPanelViewed({
      challengeId: 'challenge-3',
      mode: 'shortest',
      score: 100,
      totalGuesses: 4,
      qualityTier: 'perfect',
    });
    trackCompletionPanelViewed({
      challengeId: 'challenge-3',
      mode: 'shortest',
      score: 100,
      totalGuesses: 4,
      qualityTier: 'perfect',
    });
    trackRetryCtaClicked({
      challengeId: 'challenge-3',
      mode: 'shortest',
      destination: 'practice',
    });

    const eventNames = listener.mock.calls.map((args: any[]) => (args[0] as CustomEvent).detail.eventName);

    expect(eventNames.filter((name: string) => name === 'efficiency_benchmark_shown')).toHaveLength(1);
    expect(eventNames.filter((name: string) => name === 'completion_panel_viewed')).toHaveLength(1);
    expect(eventNames).toContain('combo_state_changed');
    expect(eventNames).toContain('retry_cta_clicked');

    window.removeEventListener('rahal:telemetry', listener as EventListener);
  });

  it('emits phase 3 telemetry and deduplicates milestone + variant assignment', () => {
    const listener = vi.fn();
    window.addEventListener('rahal:telemetry', listener as EventListener);

    trackNarrativeMilestoneShown({
      challengeId: 'challenge-4',
      mode: 'shortest',
      milestone: 'start',
    });
    trackNarrativeMilestoneShown({
      challengeId: 'challenge-4',
      mode: 'shortest',
      milestone: 'start',
    });
    trackPresentationVariantAssigned({
      challengeId: 'challenge-4',
      mode: 'shortest',
      variant: 'hybrid',
    });
    trackPresentationVariantAssigned({
      challengeId: 'challenge-4',
      mode: 'shortest',
      variant: 'baseline',
    });
    trackPostgameRecapShared({
      challengeId: 'challenge-4',
      mode: 'shortest',
      shareMethod: 'clipboard',
    });

    const eventNames = listener.mock.calls.map((args: any[]) => (args[0] as CustomEvent).detail.eventName);

    expect(eventNames.filter((name: string) => name === 'narrative_milestone_shown')).toHaveLength(1);
    expect(eventNames.filter((name: string) => name === 'presentation_variant_assigned')).toHaveLength(1);
    expect(eventNames).toContain('postgame_recap_shared');

    window.removeEventListener('rahal:telemetry', listener as EventListener);
  });
});
