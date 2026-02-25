# Phase 5 — Launch Hardening: Error Resilience, PWA, Performance

## GitHub Issue
`feat(launch): error boundaries, PWA manifest, hardcoded-string audit, rate limiting`

## Problem Statement (Producer View)

The app is not ready for production user acquisition:

1. **No error boundaries** except `MapErrorBoundary` — a stats API failure crashes the entire home screen to a white page
2. **Hardcoded Arabic strings** in `GameMap.tsx` (`"جاري تحميل الخريطة..."`, `"تعذر تحميل بيانات الخريطة"`) bypass `next-intl` — English/Spanish users see Arabic error text
3. **No PWA manifest** — can't be installed on iOS/Android home screen (critical for Arabic market where app-icon loyalty matters)
4. **No offline detection** — silent failures on MENA mobile networks
5. **No rate limiting** on guess submission — open to abuse

A game that crashes on a 3G connection in Riyadh is not a game. It's a liability.

## Game Designer Notes

**Offline grace**: If the daily challenge is cached (React Query default), the game should continue to work offline. Show an "Offline" badge on the map header strip. Players who complete a game offline see a "Syncing..." state on the completion sheet that resolves when connectivity returns.

**Error states as game states**: An error in Rahal should feel like the game pausing, not breaking. `AppErrorBoundary` renders the branded compass logo + "Something went wrong" + a Retry button — still on-brand, still in the game world.

## Key Technical Changes

### New `lib/errors/` Module

**`AppErrorBoundary.tsx`**:
- Wraps `app/[locale]/layout.tsx` content
- On error: branded error page (compass icon + message + retry button)

**`SectionErrorBoundary.tsx`**:
- Lightweight boundary for home stats, leaderboard, achievements
- Props: `fallback?: ReactNode`
- On error: renders `fallback` or a small inline `—` placeholder

### Wrap Vulnerable Sections
- `app/[locale]/page.tsx` stats section → `<SectionErrorBoundary fallback={<StatsSkeleton />}>`
- `LeaderboardPage.tsx` → `<SectionErrorBoundary>`
- Profile achievements list → `<SectionErrorBoundary>`

### Fix Hardcoded Strings in `GameMap.tsx`
Add i18n keys to all 3 messages files:
```json
{
  "game": {
    "map": {
      "loading": "...",
      "loadError": "...",
      "retry": "..."
    }
  }
}
```
Replace inline Arabic strings with `t('game.map.loading')` etc.

### PWA Manifest (`public/manifest.json`)
```json
{
  "name": "رحال | Rahal",
  "short_name": "Rahal",
  "description": "اكتشف العالم من خلال اللعب",
  "theme_color": "#0D7377",
  "background_color": "#F8F6F3",
  "display": "standalone",
  "start_url": "/",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```
- Add `<link rel="manifest">` + `<meta name="apple-mobile-web-app-capable">` + `apple-touch-icon` to `app/layout.tsx`
- Generate 192×512 PNGs from existing `app/icon.svg`

### New `lib/hooks/useOnlineStatus.ts`
- `window.online`/`window.offline` event listeners
- Returns `{ isOnline: boolean }`
- When offline: banner toast in user's locale
- Game continues if daily challenge is in React Query cache

### Backend Hardening
- Rate limit guess submission via `slowapi`: 30 requests/min per user IP
- Verify `GET /health` endpoint exists: `{"status": "ok", "db": "connected"}`
- Confirm all achievement `icon` fields populated in seed data

## Files
| File | Change |
|------|--------|
| `app/layout.tsx` | Manifest link, apple meta tags |
| `app/[locale]/layout.tsx` | Wrap with `AppErrorBoundary` |
| `app/[locale]/page.tsx` | Wrap stats with `SectionErrorBoundary` |
| `components/game/GameMap.tsx` | Replace hardcoded Arabic strings with `t()` calls |
| `messages/ar.json` | Add `game.map.*` keys |
| `messages/en.json` | Add `game.map.*` keys |
| `messages/es.json` | Add `game.map.*` keys |
| `public/manifest.json` | **New** PWA manifest |
| `public/icons/` | **New** icon-192.png, icon-512.png |
| `lib/errors/AppErrorBoundary.tsx` | **New** |
| `lib/errors/SectionErrorBoundary.tsx` | **New** |
| `lib/hooks/useOnlineStatus.ts` | **New** |
| `backend/app/main.py` | Rate limiting middleware |
| `backend/app/routers/health.py` | Verify `/health` endpoint |

## Success Metrics
- [ ] Lighthouse PWA score >= 90
- [ ] App installable on iOS Safari and Android Chrome
- [ ] Zero hardcoded language strings in `GameMap.tsx` (i18n audit passes)
- [ ] `AppErrorBoundary` catches and recovers from simulated API failures
- [ ] Rate limiting confirmed active on guess submission endpoint

## Dependencies
- Phases 1-4 complete
- PWA manifest and error boundaries are partially independent and can start in parallel with Phase 4
