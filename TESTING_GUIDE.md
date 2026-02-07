# Quick Testing Guide - Multi-Language Implementation

## 🚀 Start the Development Server
```bash
cd frontend
npm run dev
```

## 🌐 Test URLs

### Arabic (RTL)
- Home: http://localhost:3000/ar
- Game: http://localhost:3000/ar/game
- Quiz: http://localhost:3000/ar/quiz
- Settings: http://localhost:3000/ar/settings

### English (LTR)
- Home: http://localhost:3000/en
- Game: http://localhost:3000/en/game
- Quiz: http://localhost:3000/en/quiz
- Settings: http://localhost:3000/en/settings

### Spanish (LTR)
- Home: http://localhost:3000/es
- Game: http://localhost:3000/es/game
- Quiz: http://localhost:3000/es/quiz
- Settings: http://localhost:3000/es/settings

## ✅ What to Test

### 1. Language Switching
1. Go to any language's settings page
2. Click on a different language button (🇸🇦 العربية, 🇬🇧 English, 🇪🇸 Español)
3. Verify you stay on the same page but in the new language

### 2. RTL vs LTR Layout
**Arabic (RTL):**
- ✓ Text aligns to the right
- ✓ Navigation flows right-to-left
- ✓ Buttons and icons are mirrored

**English/Spanish (LTR):**
- ✓ Text aligns to the left
- ✓ Navigation flows left-to-right
- ✓ Standard LTR layout

### 3. Translations
**Check these are translated correctly:**
- ✓ Page titles and headings
- ✓ Button labels (Start Game, Submit, etc.)
- ✓ Navigation menu items
- ✓ Form placeholders
- ✓ Error messages

### 4. Components
**Test these components work in all languages:**
- ✓ CountryInput - Type country names (check autocomplete works)
- ✓ Quiz questions - Answer multiple choice and text input
- ✓ Settings - Switch themes and languages
- ✓ Navigation - Bottom nav and links work

### 5. Edge Cases
- ✓ Direct URL access to `/en/game` or `/es/quiz`
- ✓ Switching languages mid-game/quiz
- ✓ Browser back/forward buttons
- ✓ Reload page in each language

## 🐛 Common Issues to Check

### If Arabic text doesn't align right:
- Check browser dev tools: `<html dir="rtl">` should be set
- Verify Tailwind RTL plugin is working

### If translations are missing:
- Check browser console for errors
- Verify translation keys exist in messages/*.json
- Ensure namespace matches (e.g., `t('settings.language')`)

### If language switching doesn't work:
- Check browser console for navigation errors
- Verify middleware is running (check Network tab for redirects)
- Ensure LanguageSwitcher component is imported

## 🎯 Success Criteria

✅ All three languages accessible via their routes  
✅ Arabic displays RTL, English/Spanish display LTR  
✅ Language switcher works in settings  
✅ Translations display correctly  
✅ Navigation persists across language switches  
✅ No console errors  
✅ Proper fonts load for each language  

## 📊 Performance Check

Open Chrome DevTools:
1. Network tab → Reload page
2. Verify only one translation file loads (ar.json OR en.json OR es.json)
3. Check bundle size is reasonable
4. Lighthouse score should remain high

---

**Quick Test Command:**
```bash
# Open all three languages in browser tabs
open http://localhost:3000/ar
open http://localhost:3000/en  
open http://localhost:3000/es
```
