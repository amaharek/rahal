# Phase 1 — The Core Loop: Map Hero, Reactive Feedback, Viral Share Card

## GitHub Issue
`feat(core-loop): map-hero layout, animated guess feedback, emoji share card`

## Problem Statement (Producer View)

The game's primary differentiator — the interactive map — is the 5th element rendered on screen. The render order in `DailyGamePage.tsx` is: route mode card → HUD card → narrative card → challenge card → **then** map. On a 390px mobile screen, a player must scroll past 4 UI elements before seeing the map. This is the equivalent of hiding the basketball in an NBA 2K game.

The share card (`lib/game/phase3.ts:127-162`) is plain text — five lines of stats. Wordle's emoji grid spread because it was visual, anonymous (didn't spoil answers), and created FOMO. Rahal's share card is a receipt. No one screenshots a receipt.

The completion screen (`DailyGamePage.tsx:346-418`) has the share button buried inside a nested card as `variant="outline"` — a secondary button inside a sub-card inside the completion card. The primary button on completion is **Retry**, not **Share**. This is backwards.

## User Story

> As a player on a 390px screen, I open today's challenge, immediately see the world map with start and end countries marked, make my first guess and watch that country animate onto the map, solve the puzzle, and tap a big Share button that copies a visual emoji path to my clipboard — so that I can post it to friends who immediately want to play.

## Game Designer Notes

**Layout principle**: The map is the game board. It must be visible before the player takes any action. On mobile: map fills 50% of viewport height. The HUD floats over the map as a translucent strip (not a separate Card below). The guess input floats at the bottom as a dock.

**Guess feedback arc**: When a player submits a guess, three things happen in sequence (< 400ms total):
1. The map camera pans/zooms to the guessed country (already have `mapCenter`/`mapZoom` state)
2. The country highlights in its proximity color (already computed in `useMapColors`)
3. An emoji tile animates in on the guess list: 🟢 → exact path, 🟡 → adjacent, 🟠 → same region, 🔴 → different continent, ⚫ → ocean/invalid

**Emoji share card** (replacing `buildShareRecapText` in `lib/game/phase3.ts`):
```
رحال 🌍 #42
🇸🇦 → 🇯🇵
⚫🟠🟡🟢🟢✅
اليوم: 5/3 | النتيجة: 820
rahal.app
```
The middle line is the emoji path — each emoji represents one guess, ordered chronologically. The flag emojis are start/end. This is anonymous (doesn't reveal countries), visual, and tells the story of the attempt. Works identically in all 3 locales.

## Key Technical Changes

**`DailyGamePage.tsx`** — restructure DOM order:
- Map renders first inside `GameLayout`, fills `min-h-[50vh]` on mobile
- New `GameHeaderBar.tsx` (~50 lines): compact strip above map with `startFlag → [mode pill] → endFlag`. Replaces `GameChallengeCard` + route mode Card (lines 251-308)
- `GameHUD` becomes a floating strip over the map bottom edge (`absolute bottom-0 left-0 right-0`), translucent `bg-surface/80 backdrop-blur-sm` — not a separate Card
- Reduce HUD to 3 slots: streak / guesses / combo (remove efficiency + benchmarkDelta from live view)
- Desktop: side panel (map left 60%, controls right 40%) — keep existing `lg:grid-cols-2` but swap order so map is first

**New `GameCompletionSheet.tsx`** (Framer Motion):
- `motion.div` slide-up from bottom on `isCompleted`
- Full-width overlay on mobile, side panel on desktop
- Content: emoji path replay row (scroll) → 3 stat tiles (score / guesses vs shortest / grade) → **Share** as full-width `variant="primary"` → secondary row: Leaderboard | Practice This Route
- efficiency + benchmarkDelta shown here only (post-game reflection)

**New emoji path generator** in `lib/game/phase3.ts`:
- `buildEmojiPath(guesses: Guess[]): string` — maps each guess's `emoji_score` field to emoji character
- New `buildShareCard(input): string` — replaces `buildShareRecapText`, uses flag emoji + emoji path row + score line + domain

**`GameHUD.tsx`** — simplify to 3 props: `streak`, `guessCount`, `combo` + `momentum` (for pulse animation)

**`GameGuessList.tsx`** — add emoji indicator per guess tile (the proximity emoji, pulled from `guess.score_details.emoji_score` or equivalent)

## Files Changed
- `components/game/DailyGamePage.tsx` (443 → target ~160 lines)
- `components/game/GameHUD.tsx` (89 → ~40 lines, 3 slots)
- `lib/game/phase3.ts` (add `buildEmojiPath`, replace `buildShareRecapText`)
- **New**: `components/game/GameHeaderBar.tsx`
- **New**: `components/game/GameCompletionSheet.tsx`

## Backend Changes
Confirm `guess.score_details` or equivalent field in `GuessResponse` contains the proximity category needed for emoji mapping. Likely already present as `emoji_score` or `direction_score`.

## Success Metrics
- Map visible on first render, no scroll required at 390px
- Share card uses emoji path format (no plain text stats)
- Share button = primary action on completion screen
- `DailyGamePage.tsx` < 200 lines

## Dependencies
Existing Phase 1-2 milestones complete (hooks extracted) ✓

<!-- Phase 1 runtime fix note:
If you hit `buildEmojiPath is not a function` in Next.js dev mode, this is typically a stale webpack/runtime cache or mixed Next process version issue.
Recovery: stop dev server, run `rm -rf .next`, then restart from `Rahal/frontend` (`npm install` if needed).
Hardening applied: emoji-path helper extracted to `lib/game/shareEmoji.ts` and reused by `GameCompletionSheet` and `phase3` share-card flow. -->
