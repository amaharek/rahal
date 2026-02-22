# Issue #9 Phase 2 Closure Checklist

Source of truth: GitHub issue #9 (pasted scope and acceptance criteria).

## Scope Confirmation
- [x] Efficiency benchmark module vs shortest path added.
- [x] Combo/momentum feedback added with restrained motion.
- [x] Completion panel upgraded with performance grade and retry CTA.
- [x] E2E coverage expanded for combo, HUD updates, dock interactions, completion retry.
- [x] Backend API contracts unchanged.

## Acceptance Criteria Mapping

### 1) Efficiency benchmark calculated and displayed
- Implementation:
  - `frontend/lib/game/progression.ts`
  - `frontend/components/game/GameHUD.tsx`
  - `frontend/components/game/DailyGamePage.tsx`
- Tests:
  - `frontend/lib/game/__tests__/progression.test.ts`
  - `frontend/components/game/__tests__/GameHUD.test.tsx`

### 2) Combo/momentum transitions update correctly
- Implementation:
  - `frontend/lib/game/progression.ts`
  - `frontend/components/game/DailyGamePage.tsx`
  - `frontend/components/game/GameHUD.tsx`
- Tests:
  - `frontend/lib/game/__tests__/progression.test.ts`
  - `frontend/components/game/__tests__/DailyGamePage.integration.test.tsx`
  - `frontend/e2e/specs/game-flow.spec.ts`

### 3) Completion panel shows grade and retry action
- Implementation:
  - `frontend/components/game/DailyGamePage.tsx`
  - `frontend/components/game/PracticePage.tsx`
  - `frontend/messages/ar.json`
  - `frontend/messages/en.json`
  - `frontend/messages/es.json`
- Tests:
  - `frontend/components/game/__tests__/DailyGamePage.integration.test.tsx`
  - `frontend/e2e/specs/game-flow.spec.ts`

### 4) E2E covers competitive-system states and interactions
- Implementation/tests:
  - `frontend/e2e/specs/game-flow.spec.ts`
  - `frontend/e2e/pages/game.page.ts`
  - `frontend/e2e/utils/api-mocks.ts`

## Telemetry/KPI Mapping
- `efficiency_benchmark_shown`
- `combo_state_changed`
- `completion_panel_viewed`
- `retry_cta_clicked`

Implementation:
- `frontend/lib/telemetry/gameTelemetry.ts`
- `frontend/lib/telemetry/__tests__/gameTelemetry.test.ts`

## Test Gate Policy
- Required local gate (matches CI): Chromium only.
  - Command: `npm run test:e2e`
- Optional local cross-browser validation:
  - Command: `npm run test:e2e:all`
  - Note: Requires local Firefox/WebKit install.

## Final Verification Commands
Run from `frontend/`:
1. `npm run type-check`
2. `npm run test -- lib/game/__tests__/progression.test.ts components/game/__tests__/GameHUD.test.tsx components/game/__tests__/DailyGamePage.integration.test.tsx lib/telemetry/__tests__/gameTelemetry.test.ts`
3. `npm run test:e2e -- e2e/specs/game-flow.spec.ts`

## Assumptions
- Success criteria for local E2E are aligned with CI browser scope (Chromium).
- Firefox/WebKit local failures are environment setup issues unless CI/browser matrix is expanded.
