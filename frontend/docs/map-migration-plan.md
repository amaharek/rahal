# React-Leaflet Migration Plan With Beta Access and Progressive Rollout

## Status Snapshot (Updated: 2026-02-24)
- **Overall:** Partially completed.
- **Completed:** dual-map architecture, Leaflet implementation, URL beta gate (`?map=leaflet`), dependency installation, global Leaflet CSS, integration test fix for new map export.
- **In progress:** parity validation (especially E2E map behavior and Leaflet-mode-specific test coverage).
- **Not started:** telemetry `map_variant` instrumentation, KPI-based beta gate monitoring, phased rollout steps beyond URL beta.
- **Blocked:** full `npm run type-check` remains red due to pre-existing unrelated repo errors in non-map files/tests.

## Summary
Refactor `GameMap` to a React-Leaflet implementation behind an explicit beta gate (`?map=leaflet`), keep `GameMapProps` fully stable, ship parity-first with subtle game-feel upgrades, then promote to cohort rollout if KPIs are healthy.

## Decisions Locked
- **Beta access mode:** URL param only (`map=leaflet`), with default remaining current map.
- **Visual scope:** parity + subtle polish (no bold redesign in beta).
- **Primary success criteria:** zero functional regressions in gameplay map interactions, no increase in map error rate, neutral/positive completion funnel metrics.

## 1) Architecture and Interface Plan

### 1.1 Keep public contract stable
- **Status:** Completed.
- `types/geo.ts` `GameMapProps` remains unchanged.
- Daily/Practice consumers keep passing the same props.

### 1.2 Introduce map implementation switch (internal only)
- **Status:** Completed.
- Add internal map implementation enum:
  - `legacy` (current `@vnedyalk0v/react19-simple-maps`)
  - `leaflet` (new)
- Add map implementation resolver:
  - Reads `searchParams.get('map')`
  - Accepts `leaflet` only, otherwise `legacy`
- Keep this resolver in game-layer code (not global app config) to avoid cross-app side effects.

### 1.3 File-level structure
- **Status:** Completed.
- Keep entrypoint: `components/game/GameMap/index.ts`
- Split implementations:
  - `components/game/GameMap/GameMapLegacy.tsx` (move existing logic as-is)
  - `components/game/GameMap/GameMapLeaflet.tsx` (new)
  - `components/game/GameMap/GameMap.tsx` (thin switcher)
- Keep existing `MapControls`, `MapLegend`, `MapErrorBoundary`, `MapSkeleton`.

## 2) Next.js + Leaflet Integration Plan

### 2.1 Dependencies
- **Status:** Completed.
- Add:
  - `leaflet`
  - `react-leaflet`
  - `topojson-client` already present; reuse for TopoJSON -> GeoJSON conversion.
- Remove current map fork only after full rollout completion. **Status:** Not started.

### 2.2 Client-only loading
- **Status:** Completed.
- Keep map dynamic import with `ssr: false` in `DailyGamePage.tsx` and `PracticePage.tsx`.
- In Leaflet implementation, guard all `window`/Leaflet object usage for client runtime only.

### 2.3 CSS strategy
- **Status:** Completed.
- Import Leaflet CSS once from app root stylesheet path (existing `app/layout.tsx` + `app/globals.css` setup).
- Add minimal CSS overrides scoped to map container class to preserve current visual language.

## 3) Functional Parity Implementation (Leaflet)

### 3.1 Data pipeline
- **Status:** Completed.
- Reuse fetch from `/geo/world-110m.json`.
- Convert TopoJSON to GeoJSON features client-side.
- Map each feature’s numeric ISO id to alpha-3 via existing `numericToAlpha3`.

### 3.2 State coloring parity
- **Status:** Completed (implementation), Pending (full parity verification in E2E).
- Reuse `getCountryState` and `useMapColors` exactly.
- Apply fill/stroke style per polygon by country state:
  - `start`, `end`, `guessed-on-path`, `guessed-off-path`, `hint`, `path-country`, `default`.

### 3.3 Tooltip parity
- **Status:** Completed (implementation), Pending (Leaflet-mode E2E verification).
- Keep existing tooltip source logic (`start/end/guessed name only`).
- Keep `data-testid="map-country-tooltip"` and pointer-positioned absolute tooltip behavior.

### 3.4 Zoom/pan/reset parity
- **Status:** Completed (implementation), Pending (Leaflet-mode E2E verification).
- Keep controlled/uncontrolled behavior identical:
  - Input props: `zoom`, `center`
  - Output callbacks: `onZoomChange`, `onCenterChange`
  - Reset uses `calculateMapView(start, end, pathCountryCodes)`
- Enforce min/max zoom parity (`1..8`) and same step for button controls (`0.5`).

### 3.5 Error/loading parity
- **Status:** Completed.
- Preserve loading and retry UX from current `GameMap`.
- Keep `MapErrorBoundary` wrapping unchanged in consumers.

## 4) Beta Gate and Telemetry Plan

### 4.1 URL beta gate
- **Status:** Completed.
- Supported params:
  - `?map=leaflet` -> Leaflet implementation
  - any other/missing value -> legacy implementation
- Parse in both:
  - `components/game/DailyGamePage.tsx`
  - `components/game/PracticePage.tsx`

### 4.2 Telemetry additions
- **Status:** Not started.
- Add map-variant dimension to map-relevant telemetry emission context:
  - `map_variant: 'legacy' | 'leaflet'`
- Emit one assignment event per challenge render (mirroring existing AB dedupe style).
- Track map-specific failures (load error, topology parse error, interaction handler errors).

### 4.3 Beta KPI gates
- **Status:** Not started.
- Go/no-go to cohort rollout requires:
  - No significant increase in map load failures.
  - No increase in completion drop-off in first N guesses.
  - No regression in map-interaction E2E stability.
  - No user-facing RTL/Arabic tooltip/control issues.

## 5) Game-Design Polish (Safe, Subtle, Beta-Scope)

### 5.1 Include in beta
- **Status:** Partially completed.
- Smooth `flyTo`/`fitBounds` transition for reset action.
- Soft glow/outline for start/end countries (CSS class + pane style), not color changes.
- Gentle hover easing on country fill transitions.
- Slight animated reveal on newly guessed country (short pulse ring/opacity tween). **Status:** Not started.

### 5.2 Defer until after rollout
- **Status:** Not started (intentionally deferred).
- Heavy route animation choreography.
- Terrain/tile-heavy visual layers.
- Non-essential cinematic camera movement.

## 6) E2E and Test Refactor Plan

### 6.1 Keep current tests passing during beta
- **Status:** Partially completed.
- Existing SVG-based tests remain for legacy mode.
- Add Leaflet-mode equivalents using robust selectors (not renderer internals). **Status:** Not started.

### 6.2 Update map test strategy
- **Status:** Not started (beyond existing legacy coverage).
- Replace fragile assumptions (`svg path > title`) with:
  - stable test ids
  - tooltip test id assertions
  - behavior assertions (zoom changed, reset restored default view, country highlight changed)
- Run E2E matrix:
  - default (`legacy`)
  - beta (`?map=leaflet`)

### 6.3 Test cases to add
- **Status:** Not started.
- `GameMapProps` contract parity snapshot/unit test across both implementations.
- Color-state mapping parity test for all country states.
- Controlled mode callback correctness (`onZoomChange`, `onCenterChange` call timing/values).
- RTL locale map overlay and tooltip placement sanity test.

## 7) Rollout Plan and Gates

### Phase A: Internal implementation complete (no user exposure)
- **Status:** In progress.
- Build switcher + Leaflet map + parity tests.
- Gate: all unit/integration and existing E2E pass on legacy mode. **Current:** integration test passes; E2E map spec currently blocked by local web server timeout/port conflict in this environment.

### Phase B: URL beta (`?map=leaflet`)
- **Status:** Partially completed.
- Enable manual beta for QA/power users.
- Gate: 7-day telemetry window with no KPI regressions. **Status:** Not started.

### Phase C: Deterministic cohort rollout
- **Status:** Not started.
- Move from URL-only beta to small cohort (10%), then 50%, then 100%.
- Keep emergency fallback to legacy via kill switch param/env.
- Gate at each step: error rate, completion rate, and map interaction quality stable.

### Phase D: Default switch and cleanup
- **Status:** Not started.
- Make Leaflet default.
- Keep legacy implementation for one release as rollback fallback.
- Remove legacy/fork dependency only after stable release window.

## 8) Rollback Strategy
- **Status:** Planned only (not operationalized yet via dedicated kill switch control).
- Instant rollback path: force resolver to `legacy` regardless of URL.
- Secondary rollback: disable Leaflet selection path in switcher while leaving code present.
- Full rollback: keep legacy implementation intact until post-cutover stabilization period ends.

## 9) Not Recommended in This Migration
- Deck.gl/MapLibre/OpenLayers additions during this refactor.
- Broad visual redesign during beta.
- Public API changes to `GameMapProps`.

## 10) Assumptions
- World geometry source remains `/geo/world-110m.json`.
- Map remains decorative/gameplay-supporting (not turn-by-turn GIS navigation).
- Existing telemetry ingestion can accept additional `map_variant` field without backend blockers.

## Current Validation Notes
- `npm install`: completed; Leaflet dependencies are installed and lockfile updated.
- `npm run test -- components/game/__tests__/DailyGamePage.integration.test.tsx`: passing after adding `resolveMapVariant` to the test mock.
- `npm run type-check`: map migration code is clean; failing items are pre-existing unrelated typing issues in:
  - `e2e/specs/map-interaction.spec.ts`
  - `lib/hooks/__tests__/useGameTelemetry.test.ts`
- `npm run test:e2e -- e2e/specs/map-interaction.spec.ts`: not completed in this environment due to dev-server startup timeout/port conflict.
