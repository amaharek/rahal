# Phase 3 — The Practice Arena: Unified Game UX + Mastery Mode

## GitHub Issue
`refactor(practice): unified game experience, usePracticeSession hook, mastery framing`

## Problem Statement (Producer View)

`PracticePage.tsx` (462 lines) is a second game implementation that lives in the shadows. It duplicates `formatHintDisplay`, has its own state machine, uses `alert()` for error handling, doesn't use `GameLayout`, doesn't use the Phase 1 `GameHeaderBar` or `GameCompletionSheet`, and has a different mobile UX (show/hide map toggle instead of map-hero). This means every improvement to the daily game must be manually replicated to practice — a maintenance tax that compounds over time.

From a game design perspective: Practice mode is currently framed as "play the same game without a score" — a leftover, not a feature. 2K's career mode exists because players want to improve. Rahal's practice mode should be framed as **The Practice Arena**: a place where you drill specific routes, build geographic intuition, and prepare for daily challenges.

## User Story

> As a player who just finished today's daily challenge in 8 guesses (shortest path was 4), I tap "Practice This Route" on the completion sheet and am instantly taken to the same game layout I just played — same map, same challenge card, same feel — but now I'm practicing to solve it optimally. After I solve it in 4 guesses, I feel the satisfaction of mastery.

## Game Designer Notes

**Mastery framing**: The practice setup screen should have "Today's Route" pre-populated as an option (one-tap to drill the daily). The completion screen in practice should compare your attempt to optimal (same as daily) but also show "Best Attempt: X guesses" if you've practiced this route before.

**No friction**: The "Practice This Route" CTA on the daily completion sheet (Phase 1's `GameCompletionSheet`) should deep-link directly to practice with `from`, `to`, and `mode` pre-filled. Zero extra steps.

## Key Technical Changes

### New `lib/hooks/usePracticeSession.ts`
Mirrors `useGameSession` interface exactly:
- Accepts `{ from: string, to: string, mode: RouteMode }` from URL params
- Wraps 3 mutations: `setupMutation`, `guessMutation`, `hintMutation` + auto-trigger
- Exposes identical shape to `useGameSession`: `challenge`, `guesses`, `hintsUsed`, `isCompleted`, `score`, `handleCountrySelect`, `handleHintRequest`, `guessedCountryCodes`, `streakValue` (null for practice), etc.
- This means `GameLayout`, `GameHeaderBar`, `GameCompletionSheet`, `GameHUD`, `GameHintsPanel`, `GameGuessList` all work with zero changes

### Rewrite `PracticePage.tsx` (~130 lines)
- Uses `GameLayout` wrapper (replaces custom layout)
- Uses `GameHeaderBar` (replaces custom challenge display)
- Uses `GameCompletionSheet` (replaces custom completion card) — `streakValue=null` so streak slot shows "Practice" badge
- Uses `GameHintsPanel` and `GameGuessList` (already extracted, currently ignored by Practice)
- `PracticeSetupCard.tsx` (~90 lines): clean two-input setup screen with `CountryInput` fields + route mode selector + "Start Practice" button
- No `alert()` calls — inline `errorMessage` state shown inside `PracticeSetupCard`

### Shared Utility Cleanup
- Move `formatHintDisplay` from `DailyGamePage.tsx` (lines 118-150) to `lib/game/formatters.ts`
- Both `DailyGamePage` and `PracticePage` import from `lib/game/formatters.ts`

### Backend
None needed. Practice API (`/game/practice/*`) already exists.

## Files
| File | Change |
|------|--------|
| `components/game/PracticePage.tsx` | 462 → ~130 lines; full rewrite using shared components |
| `components/game/DailyGamePage.tsx` | Remove `formatHintDisplay`; import from `lib/game/formatters.ts` |
| `lib/hooks/usePracticeSession.ts` | **New** mirrors `useGameSession` interface |
| `lib/game/formatters.ts` | **New** shared utility (extracted from daily page) |
| `components/game/PracticeSetupCard.tsx` | **New** ~90 lines |

## Success Metrics
- [ ] `PracticePage.tsx` under 140 lines
- [ ] "Practice This Route" from completion sheet works in < 1 tap
- [ ] Zero duplicated utility functions between daily and practice
- [ ] `usePracticeSession.test.ts` mirrors existing `useGameSession.test.ts` patterns

## Dependencies
- Phase 1 complete (requires `GameHeaderBar`, `GameCompletionSheet`, simplified `GameHUD`)
