# Phase 2 — The Return Trigger: Home Hub, Streak, Daily Urgency

## GitHub Issue
`feat(retention): personalized home hub with live streak, daily urgency, and achievement seeds`

## Problem Statement (Producer View)

Wordle's most powerful mechanic isn't the word puzzle — it's the streak. Opening Wordle every morning to protect your 47-day streak is a dopamine obligation. Rahal has streak data in the DB and displays it in the game HUD, but the home screen shows **hardcoded `0` for every stat** (`app/[locale]/page.tsx:175,184,193`). A player who has maintained a 30-day streak opens the app and sees `0`. This is not a mistake — it's a trust-breaking bug that signals "this app doesn't know who I am."

Additionally: the Daily Challenge card on the home screen looks identical whether you've already played today or not. There is zero urgency, zero personalization, zero "come back" hook.

## User Story

> As a player with a 14-day streak, I open Rahal at 9am and immediately see my streak count (🔥 14) in the top of the home screen with a pulse animation. Today's challenge card has a "Unplayed" badge and a green ring. After I complete today's game, the streak updates to 15 and a subtle "Streak Extended!" toast appears — so that coming back tomorrow feels like protecting something I've built.

## Game Designer Notes

**The streak as identity**: The streak number should be the first thing a logged-in user sees on the home screen. Larger than the app logo. Position: top of the hero section, centered. For new/logged-out users: show the global "players today" count instead (social proof).

**Daily urgency states** (for the Daily Challenge card):
- `unplayed-today`: green ring (`ring-2 ring-success`), badge "Play Now", slight pulse animation
- `played-today`: checkmark badge, muted border, "Play Again" as secondary action
- `not-logged-in`: standard card with sign-in nudge

**Streak extended moment**: On the first home screen visit after completing today's game, show a 3-second Framer Motion celebration: streak number scales up 1x → 1.3x → 1x, confetti burst, "🔥 Streak extended!" text.

## Key Technical Changes

### New `lib/hooks/useHomeStats.ts`
- React Query: `getGameStats()` if authenticated, `staleTime: 60_000`, `gcTime: 5 * 60_000`
- Returns: `{ streak, gamesPlayed, accuracy, lastPlayedDate, isLoading, isAuthenticated }`
- Derive `playedToday: boolean = lastPlayedDate === today`

### `app/[locale]/page.tsx` — Stats Section (lines 159-198)
- Replace hardcoded `0` values with `useHomeStats()` results
- Show `<Skeleton>` (animated grey pill) while loading — not a number `0`
- Daily Challenge card: conditional `ring-2 ring-success animate-pulse` + "Play Now" badge when `!playedToday && isAuthenticated`
- Add `<StreakHero>` component above the hero title: large streak number + flame icon + "day streak" label
- Unauthenticated: replace 3 stat tiles with "Sign in to see your progress" card (link to `/${locale}/auth/sign-in`)

### New `components/home/StreakHero.tsx` (~60 lines)
- Props: `streak: number | null`, `isLoading: boolean`, `justExtended: boolean`
- Framer Motion scale animation when `justExtended`
- Skeleton state when loading

### New `components/ui/Skeleton.tsx` (~20 lines)
- Animated grey pill: `animate-pulse bg-border rounded`
- Used by home stats + any loading state across the app

### Achievement Seeding — `backend/app/routers/game.py`
- Add `award_achievements(db, user_id, profile)` after profile update in guess submission endpoint
- Initial 5 achievements:
  - 🗺️ **First Steps** (`games_won == 1`) — onboarding hook
  - 🔥 **Streak Starter** (`current_streak == 3`) — early retention
  - 🏆 **Week Warrior** (`current_streak == 7`) — mid-retention
  - ⚡ **Pathfinder** (`games_won == 10`) — long-term engagement
  - 💎 **Perfect Route** (solved in exactly `shortest_path` guesses, 0 hints) — skill ceiling
- Check `UserAchievement` for existing unlock before awarding

### Backend Schema — `GameStatsResponse`
- Add `last_played_date: date | None`
- Query: `SELECT MAX(played_at)::date FROM game_results WHERE user_id = $1`

## Files
| File | Change |
|------|--------|
| `app/[locale]/page.tsx` | Stats section rewrite; daily challenge card urgency states |
| `lib/hooks/useHomeStats.ts` | **New** React Query hook |
| `components/home/StreakHero.tsx` | **New** ~60 lines |
| `components/ui/Skeleton.tsx` | **New** ~20 lines |
| `backend/app/routers/game.py` | Achievement award logic |
| `backend/app/schemas/users.py` | Add `last_played_date` to `GameStatsResponse` |
| `backend/app/crud/users.py` | Query for `last_played_date` |

## Success Metrics
- [ ] Authenticated users see real streak/stats (zero hardcoded `0` values remaining)
- [ ] Daily challenge card shows urgency state based on whether user has played today
- [ ] D7 retention baseline established (measure before and after deploy)
- [ ] 3 achievement types awarded in first week of production

## Dependencies
- Phase 1 complete (Framer Motion patterns established for StreakHero animation)
