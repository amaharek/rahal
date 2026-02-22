import type {
  ComboMomentum,
  EfficiencyBucket,
  GamePresentationVariant,
  NarrativeMilestone,
  QualityTier,
  RouteMode,
  ScoreEmoji,
} from '@/types/game';

export type GameTelemetryEventName =
  | 'guess_to_guess_ms'
  | 'focus_to_submit_ms'
  | 'hud_render_state'
  | 'dock_action_triggered'
  | 'efficiency_benchmark_shown'
  | 'combo_state_changed'
  | 'completion_panel_viewed'
  | 'retry_cta_clicked'
  | 'narrative_milestone_shown'
  | 'postgame_recap_shared'
  | 'presentation_variant_assigned';

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

export interface EfficiencyBenchmarkShownPayload {
  challengeId: string;
  mode: RouteMode;
  shortestPath: number;
  guessesCount: number;
  deltaFromShortestPath: number;
  efficiency: EfficiencyBucket;
}

export interface ComboStateChangedPayload {
  challengeId: string;
  mode: RouteMode;
  previousCombo: number;
  nextCombo: number;
  momentum: ComboMomentum;
  transition: 'increase' | 'reset' | 'no_change';
  scoreEmoji: ScoreEmoji;
}

export interface CompletionPanelViewedPayload {
  challengeId: string;
  mode: RouteMode;
  score: number;
  totalGuesses: number;
  qualityTier: QualityTier | null;
}

export interface RetryCtaClickedPayload {
  challengeId: string;
  mode: RouteMode;
  destination: 'practice';
}

export interface NarrativeMilestoneShownPayload {
  challengeId: string;
  mode: RouteMode;
  milestone: NarrativeMilestone;
}

export interface PostgameRecapSharedPayload {
  challengeId: string;
  mode: RouteMode;
  shareMethod: 'native' | 'clipboard';
}

export interface PresentationVariantAssignedPayload {
  challengeId: string;
  mode: RouteMode;
  variant: GamePresentationVariant;
}

export type GameTelemetryPayloadMap = {
  guess_to_guess_ms: GuessToGuessPayload;
  focus_to_submit_ms: FocusToSubmitPayload;
  hud_render_state: HudRenderStatePayload;
  dock_action_triggered: DockActionTriggeredPayload;
  efficiency_benchmark_shown: EfficiencyBenchmarkShownPayload;
  combo_state_changed: ComboStateChangedPayload;
  completion_panel_viewed: CompletionPanelViewedPayload;
  retry_cta_clicked: RetryCtaClickedPayload;
  narrative_milestone_shown: NarrativeMilestoneShownPayload;
  postgame_recap_shared: PostgameRecapSharedPayload;
  presentation_variant_assigned: PresentationVariantAssignedPayload;
};

interface ChallengeTelemetryState {
  pendingFocusTs: number | null;
  lastSubmitTs: number | null;
  lastHudHash: string | null;
  lastBenchmarkHash: string | null;
  completionViewed: boolean;
  shownMilestones: Set<NarrativeMilestone>;
  variantAssigned: boolean;
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
    lastBenchmarkHash: null,
    completionViewed: false,
    shownMilestones: new Set(),
    variantAssigned: false,
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

export function trackEfficiencyBenchmarkShown(payload: EfficiencyBenchmarkShownPayload): void {
  const state = getChallengeState(payload.challengeId);
  const nextHash = JSON.stringify(payload);

  if (state.lastBenchmarkHash === nextHash) {
    return;
  }

  state.lastBenchmarkHash = nextHash;
  emitGameTelemetry('efficiency_benchmark_shown', payload);
}

export function trackComboStateChanged(payload: ComboStateChangedPayload): void {
  emitGameTelemetry('combo_state_changed', payload);
}

export function trackCompletionPanelViewed(payload: CompletionPanelViewedPayload): void {
  const state = getChallengeState(payload.challengeId);

  if (state.completionViewed) {
    return;
  }

  state.completionViewed = true;
  emitGameTelemetry('completion_panel_viewed', payload);
}

export function trackRetryCtaClicked(payload: RetryCtaClickedPayload): void {
  emitGameTelemetry('retry_cta_clicked', payload);
}

export function trackNarrativeMilestoneShown(payload: NarrativeMilestoneShownPayload): void {
  const state = getChallengeState(payload.challengeId);
  if (state.shownMilestones.has(payload.milestone)) {
    return;
  }

  state.shownMilestones.add(payload.milestone);
  emitGameTelemetry('narrative_milestone_shown', payload);
}

export function trackPostgameRecapShared(payload: PostgameRecapSharedPayload): void {
  emitGameTelemetry('postgame_recap_shared', payload);
}

export function trackPresentationVariantAssigned(payload: PresentationVariantAssignedPayload): void {
  const state = getChallengeState(payload.challengeId);
  if (state.variantAssigned) {
    return;
  }

  state.variantAssigned = true;
  emitGameTelemetry('presentation_variant_assigned', payload);
}
