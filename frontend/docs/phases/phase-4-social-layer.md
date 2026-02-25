# Phase 4 — The Social Layer: Quiz Bridge, Leaderboard, Cross-Mode Continuity

## GitHub Issue
`feat(social): quiz overhaul, post-quiz game bridge, leaderboard live ranking`

## Problem Statement (Producer View)

Three social/engagement surfaces are currently broken or dormant:

1. **Quiz** (`app/[locale]/quiz/page.tsx`, 473 lines): Three separate `<main>` trees in one file. On mobile, 4 stacked cards require scrolling during a 30-second countdown — unplayable. `QuestionCard.tsx` renders `question.question_ar` regardless of user locale (bug). No bridge to the path game after quiz completion.

2. **Leaderboard** (`components/leaderboard/LeaderboardPage.tsx`, 122 lines): Simple static table. No daily ranking context, no player position highlight, no social call-to-action.

3. **Achievement profile** (`components/profile/ProfilePage.tsx`): Achievements render as a `<li>` text list with no icons, no locked/unlocked state, no "what to work toward" preview.

The missing link is cross-mode continuity. After a quiz session there is no funnel to today's path game.

## User Story

> As a player who just completed a 10-question geography quiz, I see a "Continue Your Journey" section showing today's challenge countries with a "Play Daily Challenge" primary CTA — so that the quiz acts as a warm-up and naturally leads me into the main game.

## Game Designer Notes

**Quiz as warm-up**: Quiz should serve as geography trivia that warms up the brain for the path-finding challenge, then funnels players into it.

**Leaderboard as social motivation**: Show the player's own rank prominently (highlighted row). Add "Today's Top 10" as the default view (not all-time). Include the daily challenge context ("Day 42 — Saudi Arabia → Japan") in the header.

**Achievement as a progress map**: Show locked achievements greyed out. The player should know exactly what to do to unlock the next one.

## Key Technical Changes

### Decompose `quiz/page.tsx` (473 → ~50 line state router)
- `QuizStartView.tsx` (~100 lines): category selector, difficulty picker, start button
- `QuizSessionView.tsx` (~120 lines): fullscreen no-scroll layout
  - Fixed header: thin progress bar + score chip
  - Full-height question zone: question text + optional flag
  - Fixed bottom: 2×2 answer grid (multiple choice) or autocomplete input
  - Timer as a thin progress bar in the header (not a clock component)
- `QuizResultView.tsx` (~80 lines): results breakdown + `QuizBridgeCard`
- `QuizBridgeCard.tsx` (~60 lines): today's challenge countries + "Play Daily Challenge" primary CTA

### Fix Locale Bug in `QuestionCard.tsx`
Replace `question.question_ar` hardcode:
```ts
// Before
question.question_ar

// After
locale === 'ar' ? question.question_ar : (question.question_en ?? question.question_ar)
```

### New `lib/hooks/useQuiz.ts`
Move inline state into hook:
- `selectedOptionIndex`, `isAnswerSubmitted`, `currentAnswer`, `questionTimerKey` → into `useQuiz`
- `handleTimerExpire`, `handleOptionSelect`, `handleSubmit` → into `useQuiz`

### Leaderboard Redesign (`LeaderboardPage.tsx`)
- "Today's Challenge" header card with challenge date + route
- Highlight current user's row (`bg-primary/10 ring-1 ring-primary`)
- "Your rank: #47 of 1,203 players today" if authenticated
- Tab toggle: "Today" / "All Time"

### Profile Achievements Grid (`ProfilePage.tsx`)
- Replace `<li>` text list with 2-column badge grid
- Each badge: icon (from `achievement.icon`) + name + locked/unlocked state
- Locked = greyed out, lock icon + "X games to unlock" hint

### Backend
- Verify `QuestionResponse` schema includes `question_en`
- Add today's players filter to leaderboard endpoint if not present

## Files
| File | Change |
|------|--------|
| `app/[locale]/quiz/page.tsx` | 473 → ~50 lines (state router only) |
| `lib/hooks/useQuiz.ts` | **New** state + handlers extracted from page |
| `components/quiz/QuestionCard.tsx` | Fix locale bug |
| `components/leaderboard/LeaderboardPage.tsx` | Redesign with rank highlight + tabs |
| `components/profile/ProfilePage.tsx` | Achievement badge grid |
| `components/quiz/QuizStartView.tsx` | **New** ~100 lines |
| `components/quiz/QuizSessionView.tsx` | **New** ~120 lines |
| `components/quiz/QuizResultView.tsx` | **New** ~80 lines |
| `components/quiz/QuizBridgeCard.tsx` | **New** ~60 lines |
| `backend/app/schemas/quiz.py` | Confirm `question_en` field |
| `backend/app/routers/leaderboard.py` | Today filter |

## Success Metrics
- [ ] No vertical scrolling during any quiz question at 390px
- [ ] English/Spanish users see question in their locale (locale bug fixed)
- [ ] Quiz → daily game conversion trackable via existing telemetry
- [ ] `quiz/page.tsx` under 60 lines

## Dependencies
- Phase 2 complete (home hub live stats needed for quiz bridge to show streak context)
