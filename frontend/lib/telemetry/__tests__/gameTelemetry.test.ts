import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  resetChallengeTelemetryState,
  trackInputFocusStart,
  trackGuessSubmission,
  trackHudRenderState,
  trackDockAction,
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
});
