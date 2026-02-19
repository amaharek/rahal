import type { RouteMode } from '@/types/game';

export type GameTelemetryEventName =
  | 'guess_to_guess_ms'
  | 'focus_to_submit_ms'
  | 'hud_render_state'
  | 'dock_action_triggered';

export interface GuessToGuessPayload {
  challengeId: string;
  mode: RouteMode;
  metricMs: number;
  countryCode: string;
}

export interface FocusToSubmitPayload {
  challengeId: string;
  mode: RouteMode;
  metricMs: number;
  countryCode: string;
}

export interface HudRenderStatePayload {
  challengeId: string;
  mode: RouteMode;
  streak: number | null;
  hintsRemaining: number;
  efficiency: EfficiencyBucket;
  guessesCount: number;
  isCompleted: boolean;
}

export interface DockActionTriggeredPayload {
  challengeId: string;
  mode: RouteMode;
  action: 'submit_guess' | 'use_hint';
}

export type GameTelemetryPayloadMap = {
  guess_to_guess_ms: GuessToGuessPayload;
  focus_to_submit_ms: FocusToSubmitPayload;
  hud_render_state: HudRenderStatePayload;
  dock_action_triggered: DockActionTriggeredPayload;
};

export type EfficiencyBucket = 'pending' | 'high' | 'medium' | 'low';

interface ChallengeTelemetryState {
  pendingFocusTs: number | null;
  lastSubmitTs: number | null;
  lastHudHash: string | null;
}

const telemetryStateByChallenge = new Map<string, ChallengeTelemetryState>();

function getChallengeState(challengeId: string): ChallengeTelemetryState {
  const existing = telemetryStateByChallenge.get(challengeId);
  if (existing) {
    return existing;
  }

  const initial: ChallengeTelemetryState = {
    pendingFocusTs: null,
    lastSubmitTs: null,
    lastHudHash: null,
  };

  telemetryStateByChallenge.set(challengeId, initial);
  return initial;
}

export function resetChallengeTelemetryState(challengeId: string): void {
  telemetryStateByChallenge.delete(challengeId);
}

export function emitGameTelemetry<EventName extends GameTelemetryEventName>(
  eventName: EventName,
  payload: GameTelemetryPayloadMap[EventName]
): void {
  if (typeof window === 'undefined') {
    return;
  }

  const detail = {
    eventName,
    payload,
    timestamp: Date.now(),
  };

  window.dispatchEvent(new CustomEvent('rahal:telemetry', { detail }));

  if (process.env.NODE_ENV !== 'production') {
    console.debug('[telemetry]', detail);
  }
}

export function trackInputFocusStart(challengeId: string): void {
  const state = getChallengeState(challengeId);
  state.pendingFocusTs = Date.now();
}

export function trackGuessSubmission(
  challengeId: string,
  mode: RouteMode,
  countryCode: string
): void {
  const state = getChallengeState(challengeId);
  const now = Date.now();

  if (state.lastSubmitTs !== null) {
    emitGameTelemetry('guess_to_guess_ms', {
      challengeId,
      mode,
      metricMs: now - state.lastSubmitTs,
      countryCode,
    });
  }

  if (state.pendingFocusTs !== null) {
    emitGameTelemetry('focus_to_submit_ms', {
      challengeId,
      mode,
      metricMs: now - state.pendingFocusTs,
      countryCode,
    });
    state.pendingFocusTs = null;
  }

  state.lastSubmitTs = now;
}

export function trackHudRenderState(payload: HudRenderStatePayload): void {
  const state = getChallengeState(payload.challengeId);
  const nextHash = JSON.stringify(payload);

  if (state.lastHudHash === nextHash) {
    return;
  }

  state.lastHudHash = nextHash;
  emitGameTelemetry('hud_render_state', payload);
}

export function trackDockAction(
  challengeId: string,
  mode: RouteMode,
  action: DockActionTriggeredPayload['action']
): void {
  emitGameTelemetry('dock_action_triggered', {
    challengeId,
    mode,
    action,
  });
}
