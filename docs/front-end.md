# Frontend Design Document
# رحال (Rahal) - Frontend Architecture & AI Tool Prompts

---

## Document Control

| Field | Value |
|-------|-------|
| **Version** | 1.0 |
| **Status** | Draft |
| **Last Updated** | January 30, 2026 |
| **Reference** | [PRD-Rahal.md](../PRD-Rahal.md) |
| **Backend Design** | [backend-design.md](./backend-design.md) |
| **Database Design** | [database-design.md](./database-design.md) |

---

## 1. Overview & Design System

### 1.1 Design Philosophy

Rahal's frontend is built with an **Arabic-First** approach:

1. **RTL Native**: Every component is designed for right-to-left layout
2. **Cultural Relevance**: Design elements reflect Arab aesthetics
3. **Mobile-First**: Optimized for mobile devices common in MENA region
4. **Performance**: Fast loading, minimal bundle size
5. **Accessibility**: WCAG 2.1 AA compliant with Arabic screen reader support

### 1.2 Color Palette

```css
:root {
  /* Primary Colors */
  --color-primary: #0D7377;        /* Deep Teal - Main brand color */
  --color-primary-light: #14919B;  /* Lighter teal for hover states */
  --color-primary-dark: #0A5A5E;   /* Darker teal for active states */

  /* Secondary Colors */
  --color-secondary: #D4A574;      /* Sand Gold - Accent color */
  --color-secondary-light: #E5C49A;
  --color-secondary-dark: #B8885A;

  /* Semantic Colors */
  --color-success: #2ECC71;        /* Emerald - Correct answers, wins */
  --color-warning: #F39C12;        /* Amber - Hints, warnings */
  --color-error: #E74C3C;          /* Coral - Errors, wrong answers */
  --color-info: #3498DB;           /* Blue - Information */

  /* Game Score Colors (Emoji feedback) */
  --color-score-excellent: #2ECC71; /* 🟢 */
  --color-score-good: #F1C40F;      /* 🟡 */
  --color-score-okay: #E67E22;      /* 🟠 */
  --color-score-far: #E74C3C;       /* 🔴 */
  --color-score-wrong: #2C3E50;     /* ⚫ */

  /* Neutral Colors */
  --color-background: #FAFAFA;     /* Off-white background */
  --color-surface: #FFFFFF;        /* Card/component background */
  --color-border: #E0E0E0;         /* Subtle borders */
  --color-text-primary: #1A1A1A;   /* Main text */
  --color-text-secondary: #666666; /* Secondary text */
  --color-text-muted: #999999;     /* Disabled/placeholder text */

  /* Dark Mode (optional) */
  --color-dark-background: #121212;
  --color-dark-surface: #1E1E1E;
  --color-dark-text-primary: #FFFFFF;
  --color-dark-text-secondary: #B0B0B0;
}
```

### 1.3 Typography

```css
:root {
  /* Font Family */
  --font-family-arabic: 'IBM Plex Sans Arabic', 'Noto Sans Arabic', sans-serif;
  --font-family-mono: 'IBM Plex Mono', monospace;

  /* Font Sizes */
  --font-size-xs: 0.75rem;    /* 12px */
  --font-size-sm: 0.875rem;   /* 14px */
  --font-size-base: 1rem;     /* 16px */
  --font-size-lg: 1.125rem;   /* 18px */
  --font-size-xl: 1.25rem;    /* 20px */
  --font-size-2xl: 1.5rem;    /* 24px */
  --font-size-3xl: 1.875rem;  /* 30px */
  --font-size-4xl: 2.25rem;   /* 36px */

  /* Font Weights */
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  /* Line Heights */
  --line-height-tight: 1.25;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.75;
}
```

### 1.4 Spacing System

```css
:root {
  /* Spacing Scale (8px base) */
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */

  /* Border Radius */
  --radius-sm: 0.25rem;  /* 4px */
  --radius-md: 0.5rem;   /* 8px */
  --radius-lg: 0.75rem;  /* 12px */
  --radius-xl: 1rem;     /* 16px */
  --radius-full: 9999px; /* Fully rounded */

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
}
```

---

## 2. Technology Stack

| Category | Technology | Purpose |
|----------|------------|---------|
| Framework | Next.js 15 | SSR, App Router, RSC |
| UI Library | React 19 | Component-based UI |
| Language | TypeScript | Type safety |
| Styling | Tailwind CSS | Utility-first CSS |
| RTL Plugin | tailwindcss-rtl | RTL utilities |
| State | Zustand | Global state management |
| Data Fetching | TanStack Query | Server state, caching |
| Forms | React Hook Form | Form handling |
| Validation | Zod | Schema validation |
| Icons | Lucide React | Icon library |
| Animation | Framer Motion | Animations |
| PWA | next-pwa | PWA support |
| i18n | next-intl | Internationalization |

---

## 3. Project Structure

```
frontend/
├── app/                          # Next.js App Router
│   ├── [locale]/                 # i18n routes (ar, en)
│   │   ├── layout.tsx           # Root layout with RTL
│   │   ├── page.tsx             # Home page (الرئيسية)
│   │   ├── game/
│   │   │   ├── page.tsx         # Path game (لعبة المسار)
│   │   │   └── loading.tsx
│   │   ├── quiz/
│   │   │   ├── page.tsx         # Quiz selection
│   │   │   ├── [category]/
│   │   │   │   └── page.tsx     # Quiz by category
│   │   │   └── daily/
│   │   │       └── page.tsx     # Daily quiz
│   │   ├── stats/
│   │   │   └── page.tsx         # Statistics (الإحصائيات)
│   │   ├── profile/
│   │   │   └── page.tsx         # User profile
│   │   ├── settings/
│   │   │   └── page.tsx         # Settings (الإعدادات)
│   │   └── leaderboard/
│   │       └── page.tsx         # Leaderboard
│   ├── api/                      # API routes (if needed)
│   ├── globals.css              # Global styles
│   └── manifest.json            # PWA manifest
│
├── components/                   # React components
│   ├── ui/                       # Base UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── Toast.tsx
│   │   ├── Skeleton.tsx
│   │   └── index.ts
│   │
│   ├── game/                     # Game-specific components
│   │   ├── CountryInput.tsx     # Autocomplete country input
│   │   ├── PathDisplay.tsx      # Visual path representation
│   │   ├── EmojiScore.tsx       # Score emoji display
│   │   ├── GuessHistory.tsx     # List of guesses
│   │   ├── HintButton.tsx       # Hint controls
│   │   ├── GameComplete.tsx     # Win screen
│   │   └── ShareResult.tsx      # Share functionality
│   │
│   ├── quiz/                     # Quiz components
│   │   ├── QuestionCard.tsx     # Question display
│   │   ├── AnswerOptions.tsx    # Multiple choice options
│   │   ├── AutocompleteAnswer.tsx
│   │   ├── QuizProgress.tsx     # Progress indicator
│   │   ├── QuizResult.tsx       # Result screen
│   │   └── Timer.tsx            # Countdown timer
│   │
│   ├── stats/                    # Statistics components
│   │   ├── StatCard.tsx
│   │   ├── StreakDisplay.tsx
│   │   ├── CategoryStats.tsx
│   │   └── ProgressChart.tsx
│   │
│   ├── layout/                   # Layout components
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Navigation.tsx
│   │   ├── MobileNav.tsx
│   │   └── PageContainer.tsx
│   │
│   └── shared/                   # Shared components
│       ├── CountryFlag.tsx
│       ├── AchievementBadge.tsx
│       ├── LoadingSpinner.tsx
│       └── ErrorBoundary.tsx
│
├── lib/                          # Utilities and hooks
│   ├── api/                      # API client
│   │   ├── client.ts            # Fetch wrapper
│   │   ├── game.ts              # Game API functions
│   │   ├── quiz.ts              # Quiz API functions
│   │   └── user.ts              # User API functions
│   │
│   ├── hooks/                    # Custom hooks
│   │   ├── useGame.ts           # Game state hook
│   │   ├── useQuiz.ts           # Quiz state hook
│   │   ├── useAuth.ts           # Auth hook
│   │   ├── useLocalStorage.ts   # Local storage hook
│   │   └── useMediaQuery.ts     # Responsive hook
│   │
│   ├── stores/                   # Zustand stores
│   │   ├── gameStore.ts         # Game state
│   │   ├── quizStore.ts         # Quiz state
│   │   ├── userStore.ts         # User state
│   │   └── uiStore.ts           # UI state (theme, etc.)
│   │
│   └── utils/                    # Utility functions
│       ├── arabic.ts            # Arabic text utils
│       ├── formatters.ts        # Date, number formatters
│       └── validators.ts        # Validation utils
│
├── public/                       # Static assets
│   ├── fonts/                    # Custom fonts
│   ├── icons/                    # App icons
│   └── images/                   # Static images
│
├── messages/                     # i18n translations
│   ├── ar.json                  # Arabic translations
│   └── en.json                  # English translations
│
├── types/                        # TypeScript types
│   ├── api.ts                   # API response types
│   ├── game.ts                  # Game types
│   ├── quiz.ts                  # Quiz types
│   └── user.ts                  # User types
│
├── next.config.js               # Next.js config
├── tailwind.config.js           # Tailwind config
├── tsconfig.json                # TypeScript config
└── package.json                 # Dependencies
```

---

## 4. RTL Implementation Guide

### 4.1 Tailwind RTL Configuration (`tailwind.config.js`)

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        arabic: ['IBM Plex Sans Arabic', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#0D7377',
          light: '#14919B',
          dark: '#0A5A5E',
        },
        secondary: {
          DEFAULT: '#D4A574',
          light: '#E5C49A',
          dark: '#B8885A',
        },
        score: {
          excellent: '#2ECC71',
          good: '#F1C40F',
          okay: '#E67E22',
          far: '#E74C3C',
          wrong: '#2C3E50',
        },
      },
    },
  },
  plugins: [
    require('tailwindcss-rtl'),
  ],
}
```

### 4.2 Root Layout with RTL (`app/[locale]/layout.tsx`)

```tsx
import { IBM_Plex_Sans_Arabic } from 'next/font/google';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-arabic',
});

const locales = ['ar', 'en'];

export default async function RootLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!locales.includes(locale)) {
    notFound();
  }

  const isRTL = locale === 'ar';

  let messages;
  try {
    messages = (await import(`@/messages/${locale}.json`)).default;
  } catch {
    notFound();
  }

  return (
    <html
      lang={locale}
      dir={isRTL ? 'rtl' : 'ltr'}
      className={ibmPlexArabic.variable}
    >
      <body className="font-arabic bg-background text-text-primary">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

### 4.3 RTL-Aware Components

```tsx
// Using Tailwind RTL utilities
// These automatically flip in RTL mode

// Margins and Paddings
<div className="ms-4">  {/* margin-start: 1rem (right in RTL) */}
<div className="me-4">  {/* margin-end: 1rem (left in RTL) */}
<div className="ps-4">  {/* padding-start */}
<div className="pe-4">  {/* padding-end */}

// Positioning
<div className="start-0">  {/* right: 0 in RTL */}
<div className="end-0">    {/* left: 0 in RTL */}

// Text Alignment
<p className="text-start">  {/* text-right in RTL */}
<p className="text-end">    {/* text-left in RTL */}

// Flexbox Direction
<div className="flex-row-reverse rtl:flex-row">
  {/* Normal LTR order, reversed in RTL */}
</div>

// Border Radius
<div className="rounded-s-lg">  {/* right side in RTL */}
<div className="rounded-e-lg">  {/* left side in RTL */}
```

---

## 5. Component Library

### 5.1 Core Components

#### Button Component

```tsx
// components/ui/Button.tsx
import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-white hover:bg-primary-light',
        secondary: 'bg-secondary text-white hover:bg-secondary-light',
        outline: 'border-2 border-primary text-primary hover:bg-primary/10',
        ghost: 'hover:bg-primary/10 text-primary',
        destructive: 'bg-error text-white hover:bg-error/90',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-11 px-6 text-base',
        lg: 'h-14 px-8 text-lg',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading ? (
          <span className="animate-spin me-2">⏳</span>
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export { Button, buttonVariants };
```

#### Input Component

```tsx
// components/ui/Input.tsx
import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, type = 'text', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-text-primary mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          type={type}
          className={cn(
            'w-full h-12 px-4 rounded-lg border bg-surface text-text-primary',
            'placeholder:text-text-muted',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error ? 'border-error' : 'border-border',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-2 text-sm text-error">{error}</p>
        )}
        {hint && !error && (
          <p className="mt-2 text-sm text-text-secondary">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export { Input };
```

#### Card Component

```tsx
// components/ui/Card.tsx
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className, hover, onClick }: CardProps) {
  return (
    <div
      className={cn(
        'bg-surface rounded-xl border border-border p-6 shadow-sm',
        hover && 'hover:shadow-md hover:border-primary/30 transition-all cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('mb-4', className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h3 className={cn('text-xl font-bold text-text-primary', className)}>
      {children}
    </h3>
  );
}

export function CardContent({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('text-text-secondary', className)}>
      {children}
    </div>
  );
}
```

### 5.2 Game Components

#### CountryInput (Autocomplete)

```tsx
// components/game/CountryInput.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchCountries } from '@/lib/api/game';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

interface Country {
  id: string;
  name_ar: string;
  name_en: string;
  flag_emoji: string;
}

interface CountryInputProps {
  onSelect: (country: Country) => void;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function CountryInput({
  onSelect,
  placeholder = 'اكتب اسم الدولة...',
  disabled,
  autoFocus,
}: CountryInputProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Fetch suggestions
  const { data: suggestions = [], isLoading } = useQuery({
    queryKey: ['countries', query],
    queryFn: () => searchCountries(query),
    enabled: query.length >= 1,
    staleTime: 60000,
  });

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (suggestions[selectedIndex]) {
          handleSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  const handleSelect = (country: Country) => {
    onSelect(country);
    setQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  // Show dropdown when typing
  useEffect(() => {
    setIsOpen(query.length >= 1 && suggestions.length > 0);
    setSelectedIndex(0);
  }, [query, suggestions.length]);

  return (
    <div className="relative w-full">
      <Input
        ref={inputRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => query.length >= 1 && setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        className="text-lg"
        autoComplete="off"
        dir="rtl"
      />

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute start-4 top-1/2 -translate-y-1/2">
          <span className="animate-spin">⏳</span>
        </div>
      )}

      {/* Suggestions dropdown */}
      {isOpen && suggestions.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-50 w-full mt-2 bg-surface border border-border rounded-lg shadow-lg max-h-60 overflow-auto"
          role="listbox"
        >
          {suggestions.map((country, index) => (
            <li
              key={country.id}
              role="option"
              aria-selected={index === selectedIndex}
              className={cn(
                'flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors',
                index === selectedIndex
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-gray-50'
              )}
              onClick={() => handleSelect(country)}
            >
              <span className="text-2xl">{country.flag_emoji}</span>
              <span className="font-medium">{country.name_ar}</span>
              <span className="text-text-secondary text-sm">
                ({country.name_en})
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

#### EmojiScore Component

```tsx
// components/game/EmojiScore.tsx
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface EmojiScoreProps {
  emoji: '🟢' | '🟡' | '🟠' | '🔴' | '⚫';
  description?: string;
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
}

const emojiColors = {
  '🟢': 'bg-score-excellent/20 border-score-excellent',
  '🟡': 'bg-score-good/20 border-score-good',
  '🟠': 'bg-score-okay/20 border-score-okay',
  '🔴': 'bg-score-far/20 border-score-far',
  '⚫': 'bg-score-wrong/20 border-score-wrong',
};

const emojiDescriptions = {
  '🟢': 'ممتاز',
  '🟡': 'جيد',
  '🟠': 'مقبول',
  '🔴': 'بعيد',
  '⚫': 'قارة مختلفة',
};

const sizes = {
  sm: 'w-8 h-8 text-lg',
  md: 'w-12 h-12 text-2xl',
  lg: 'w-16 h-16 text-4xl',
};

export function EmojiScore({
  emoji,
  description,
  size = 'md',
  animate = true,
}: EmojiScoreProps) {
  const Component = animate ? motion.div : 'div';
  const animationProps = animate
    ? {
        initial: { scale: 0, rotate: -180 },
        animate: { scale: 1, rotate: 0 },
        transition: { type: 'spring', stiffness: 260, damping: 20 },
      }
    : {};

  return (
    <div className="flex flex-col items-center gap-2">
      <Component
        className={cn(
          'flex items-center justify-center rounded-full border-2',
          emojiColors[emoji],
          sizes[size]
        )}
        {...animationProps}
      >
        {emoji}
      </Component>
      {description !== undefined && (
        <span className="text-sm text-text-secondary">
          {description || emojiDescriptions[emoji]}
        </span>
      )}
    </div>
  );
}
```

#### GuessHistory Component

```tsx
// components/game/GuessHistory.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { EmojiScore } from './EmojiScore';

interface Guess {
  country_id: string;
  name_ar: string;
  flag_emoji: string;
  emoji: '🟢' | '🟡' | '🟠' | '🔴' | '⚫';
}

interface GuessHistoryProps {
  guesses: Guess[];
}

export function GuessHistory({ guesses }: GuessHistoryProps) {
  if (guesses.length === 0) {
    return (
      <div className="text-center text-text-secondary py-8">
        <p>لم تقم بأي تخمين بعد</p>
        <p className="text-sm mt-2">ابدأ بكتابة اسم دولة</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-text-primary">
        التخمينات ({guesses.length})
      </h3>
      <AnimatePresence mode="popLayout">
        {guesses.map((guess, index) => (
          <motion.div
            key={guess.country_id}
            layout
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-4 p-4 bg-surface rounded-lg border border-border"
          >
            <span className="text-lg font-bold text-text-secondary w-8">
              {index + 1}.
            </span>
            <span className="text-2xl">{guess.flag_emoji}</span>
            <span className="flex-1 font-medium">{guess.name_ar}</span>
            <EmojiScore emoji={guess.emoji} size="sm" animate={false} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
```

#### ShareResult Component

```tsx
// components/game/ShareResult.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

interface ShareResultProps {
  challengeNumber: number;
  guesses: Array<{ emoji: string }>;
  score: number;
  hintsUsed: number;
}

export function ShareResult({
  challengeNumber,
  guesses,
  score,
  hintsUsed,
}: ShareResultProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const generateShareText = () => {
    const emojiLine = guesses.map((g) => g.emoji).join('');
    const hintText = hintsUsed > 0 ? ` (${hintsUsed} تلميحات)` : '';

    return `
رحال #${challengeNumber} 🌍

${emojiLine}

${guesses.length} محاولات${hintText}
النتيجة: ${score} نقطة

العب الآن: https://rahal.app
    `.trim();
  };

  const handleShare = async () => {
    const shareText = generateShareText();

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'نتيجتي في رحال',
          text: shareText,
        });
      } catch (err) {
        // User cancelled or error
        await copyToClipboard(shareText);
      }
    } else {
      await copyToClipboard(shareText);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({
        title: 'تم النسخ!',
        description: 'تم نسخ النتيجة إلى الحافظة',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: 'خطأ',
        description: 'فشل نسخ النتيجة',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Preview */}
      <div className="bg-gray-50 rounded-lg p-4 text-center font-mono text-sm whitespace-pre-line">
        {generateShareText()}
      </div>

      {/* Share buttons */}
      <div className="flex gap-3">
        <Button onClick={handleShare} className="flex-1">
          {copied ? '✓ تم النسخ' : 'مشاركة النتيجة'}
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            window.open(
              `https://twitter.com/intent/tweet?text=${encodeURIComponent(generateShareText())}`,
              '_blank'
            )
          }
        >
          𝕏
        </Button>
      </div>
    </div>
  );
}
```

### 5.3 Quiz Components

#### QuestionCard Component

```tsx
// components/quiz/QuestionCard.tsx
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/Card';

interface QuestionCardProps {
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  imageUrl?: string;
  questionNumber: number;
  totalQuestions: number;
}

const difficultyLabels = {
  easy: { label: 'سهل', color: 'bg-green-100 text-green-800' },
  medium: { label: 'متوسط', color: 'bg-yellow-100 text-yellow-800' },
  hard: { label: 'صعب', color: 'bg-red-100 text-red-800' },
};

const categoryLabels: Record<string, string> = {
  capitals: 'العواصم',
  flags: 'الأعلام',
  landmarks: 'المعالم',
  attractions: 'معالم الجذب',
  geography: 'الجغرافيا',
  borders: 'الحدود',
  population: 'السكان',
  arab_world: 'العالم العربي',
};

export function QuestionCard({
  category,
  difficulty,
  question,
  imageUrl,
  questionNumber,
  totalQuestions,
}: QuestionCardProps) {
  const { label, color } = difficultyLabels[difficulty];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
              {label}
            </span>
            <span className="text-sm text-text-secondary">
              {categoryLabels[category] || category}
            </span>
          </div>
          <span className="text-sm text-text-secondary">
            {questionNumber} / {totalQuestions}
          </span>
        </div>

        <CardContent className="p-6">
          {/* Image (if present) */}
          {imageUrl && (
            <div className="mb-6 rounded-lg overflow-hidden">
              <img
                src={imageUrl}
                alt="Question image"
                className="w-full h-48 object-cover"
              />
            </div>
          )}

          {/* Question text */}
          <p className="text-xl font-semibold text-text-primary leading-relaxed">
            {question}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
```

#### AnswerOptions Component

```tsx
// components/quiz/AnswerOptions.tsx
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnswerOptionsProps {
  options: string[];
  onSelect: (answer: string) => void;
  disabled?: boolean;
  correctAnswer?: string;
  selectedAnswer?: string;
}

export function AnswerOptions({
  options,
  onSelect,
  disabled,
  correctAnswer,
  selectedAnswer,
}: AnswerOptionsProps) {
  const [selected, setSelected] = useState<string | null>(selectedAnswer || null);
  const showResult = correctAnswer !== undefined;

  const handleSelect = (option: string) => {
    if (disabled || showResult) return;
    setSelected(option);
    onSelect(option);
  };

  const getOptionStyle = (option: string) => {
    if (!showResult) {
      return selected === option
        ? 'border-primary bg-primary/10'
        : 'border-border hover:border-primary/50';
    }

    if (option === correctAnswer) {
      return 'border-success bg-success/10';
    }

    if (option === selected && option !== correctAnswer) {
      return 'border-error bg-error/10';
    }

    return 'border-border opacity-50';
  };

  return (
    <div className="grid grid-cols-1 gap-3">
      {options.map((option, index) => (
        <motion.button
          key={option}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          onClick={() => handleSelect(option)}
          disabled={disabled || showResult}
          className={cn(
            'w-full p-4 text-start rounded-lg border-2 transition-all',
            'font-medium text-text-primary',
            getOptionStyle(option),
            !disabled && !showResult && 'cursor-pointer'
          )}
        >
          <span className="flex items-center gap-3">
            <span className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-sm font-bold">
              {['أ', 'ب', 'ج', 'د'][index]}
            </span>
            {option}
            {showResult && option === correctAnswer && (
              <span className="ms-auto text-success">✓</span>
            )}
            {showResult && option === selected && option !== correctAnswer && (
              <span className="ms-auto text-error">✗</span>
            )}
          </span>
        </motion.button>
      ))}
    </div>
  );
}
```

---

## 6. State Management (Zustand)

### 6.1 Game Store

```typescript
// lib/stores/gameStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Guess {
  country_id: string;
  name_ar: string;
  flag_emoji: string;
  emoji: '🟢' | '🟡' | '🟠' | '🔴' | '⚫';
}

interface Challenge {
  id: string;
  challenge_date: string;
  start_country: {
    id: string;
    name_ar: string;
    flag_emoji: string;
  };
  end_country: {
    id: string;
    name_ar: string;
    flag_emoji: string;
  };
  shortest_path: number;
}

interface GameState {
  // Current game
  currentChallenge: Challenge | null;
  guesses: Guess[];
  hintsUsed: number;
  completed: boolean;
  score: number | null;

  // Stats
  currentStreak: number;
  maxStreak: number;
  gamesPlayed: number;
  gamesWon: number;
  lastPlayedDate: string | null;

  // Actions
  setChallenge: (challenge: Challenge) => void;
  addGuess: (guess: Guess) => void;
  useHint: () => void;
  completeGame: (score: number) => void;
  resetGame: () => void;
  updateStats: (won: boolean) => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentChallenge: null,
      guesses: [],
      hintsUsed: 0,
      completed: false,
      score: null,
      currentStreak: 0,
      maxStreak: 0,
      gamesPlayed: 0,
      gamesWon: 0,
      lastPlayedDate: null,

      // Actions
      setChallenge: (challenge) => {
        const state = get();
        // Check if it's a new day
        if (challenge.challenge_date !== state.lastPlayedDate) {
          set({
            currentChallenge: challenge,
            guesses: [],
            hintsUsed: 0,
            completed: false,
            score: null,
          });
        }
      },

      addGuess: (guess) => {
        set((state) => ({
          guesses: [...state.guesses, guess],
        }));
      },

      useHint: () => {
        set((state) => ({
          hintsUsed: Math.min(state.hintsUsed + 1, 3),
        }));
      },

      completeGame: (score) => {
        set({
          completed: true,
          score,
        });
      },

      resetGame: () => {
        set({
          guesses: [],
          hintsUsed: 0,
          completed: false,
          score: null,
        });
      },

      updateStats: (won) => {
        const state = get();
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        let newStreak = state.currentStreak;
        if (won) {
          if (state.lastPlayedDate === yesterday) {
            newStreak = state.currentStreak + 1;
          } else if (state.lastPlayedDate !== today) {
            newStreak = 1;
          }
        } else {
          newStreak = 0;
        }

        set({
          gamesPlayed: state.gamesPlayed + 1,
          gamesWon: won ? state.gamesWon + 1 : state.gamesWon,
          currentStreak: newStreak,
          maxStreak: Math.max(state.maxStreak, newStreak),
          lastPlayedDate: today,
        });
      },
    }),
    {
      name: 'rahal-game-storage',
      partialize: (state) => ({
        currentStreak: state.currentStreak,
        maxStreak: state.maxStreak,
        gamesPlayed: state.gamesPlayed,
        gamesWon: state.gamesWon,
        lastPlayedDate: state.lastPlayedDate,
        guesses: state.guesses,
        hintsUsed: state.hintsUsed,
        completed: state.completed,
        score: state.score,
      }),
    }
  )
);
```

### 6.2 User Store

```typescript
// lib/stores/userStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
}

interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  accessToken: string | null;

  // Actions
  setUser: (user: User, token: string) => void;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      accessToken: null,

      setUser: (user, token) => {
        set({
          user,
          isAuthenticated: true,
          accessToken: token,
        });
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          accessToken: null,
        });
      },

      updateProfile: (updates) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        }));
      },
    }),
    {
      name: 'rahal-user-storage',
    }
  )
);
```

### 6.3 UI Store

```typescript
// lib/stores/uiStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface UIState {
  theme: Theme;
  sidebarOpen: boolean;
  locale: 'ar' | 'en';

  // Actions
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  setLocale: (locale: 'ar' | 'en') => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'system',
      sidebarOpen: false,
      locale: 'ar',

      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setLocale: (locale) => set({ locale }),
    }),
    {
      name: 'rahal-ui-storage',
    }
  )
);
```

---

## 7. Page Specifications

### 7.1 Home Page (الرئيسية)

**Route:** `/ar` (or `/en`)

**Layout:**
```
┌────────────────────────────────────────┐
│  رحال 🌍                         ☰    │
├────────────────────────────────────────┤
│                                        │
│   مرحباً بك في رحال! 👋               │
│                                        │
│   ┌────────────────────────────────┐  │
│   │    تحدي اليوم                   │  │
│   │    ─────────────────            │  │
│   │    🇧🇷 ──────────► 🇯🇵          │  │
│   │    البرازيل    اليابان           │  │
│   │                                  │  │
│   │    [    ابدأ التحدي    ]        │  │
│   └────────────────────────────────┘  │
│                                        │
│   ┌──────────┐  ┌──────────┐         │
│   │ 🔥 7     │  │ 🎯 42    │         │
│   │ السلسلة  │  │ الألعاب  │         │
│   └──────────┘  └──────────┘         │
│                                        │
│   ┌────────────────────────────────┐  │
│   │  📝 الأسئلة                     │  │
│   │  اختبر معلوماتك الجغرافية      │  │
│   │  [العب الآن]                    │  │
│   └────────────────────────────────┘  │
│                                        │
├────────────────────────────────────────┤
│  🏠    🎯    📊    ⚙️                  │
│ الرئيسية الأسئلة الإحصائيات الإعدادات │
└────────────────────────────────────────┘
```

### 7.2 Path Game Page (لعبة المسار)

**Route:** `/ar/game`

**Layout:**
```
┌────────────────────────────────────────┐
│  ← رجوع              لعبة المسار       │
├────────────────────────────────────────┤
│                                        │
│   من: 🇧🇷 البرازيل                     │
│   إلى: 🇯🇵 اليابان                      │
│                                        │
│   أقصر مسار: 8 دول                     │
│                                        │
│   ┌────────────────────────────────┐  │
│   │  [    اكتب اسم الدولة    ]    │  │
│   │  ▼ الاقتراحات                  │  │
│   │    🇦🇷 الأرجنتين               │  │
│   │    🇨🇱 تشيلي                    │  │
│   │    🇨🇴 كولومبيا                 │  │
│   └────────────────────────────────┘  │
│                                        │
│   التخمينات (3)                        │
│   ┌────────────────────────────────┐  │
│   │ 1. 🇦🇷 الأرجنتين          🟢  │  │
│   │ 2. 🇨🇱 تشيلي              🟡  │  │
│   │ 3. 🇵🇪 بيرو               🟠  │  │
│   └────────────────────────────────┘  │
│                                        │
│   💡 تلميحات: 2/3                      │
│   [استخدم تلميح]                       │
│                                        │
├────────────────────────────────────────┤
│  🏠    🎯    📊    ⚙️                  │
└────────────────────────────────────────┘
```

### 7.3 Quiz Page (الأسئلة)

**Route:** `/ar/quiz`

**Layout:**
```
┌────────────────────────────────────────┐
│  ← رجوع                الأسئلة         │
├────────────────────────────────────────┤
│                                        │
│   اختر نوع الأسئلة                     │
│                                        │
│   ┌────────────────────────────────┐  │
│   │  🌍 العواصم                     │  │
│   │  اختبر معرفتك بعواصم العالم    │  │
│   └────────────────────────────────┘  │
│                                        │
│   ┌────────────────────────────────┐  │
│   │  🏛️ المعالم                     │  │
│   │  تعرف على معالم العالم الشهيرة │  │
│   └────────────────────────────────┘  │
│                                        │
│   ┌────────────────────────────────┐  │
│   │  🚩 الأعلام                     │  │
│   │  هل تستطيع تمييز أعلام الدول؟  │  │
│   └────────────────────────────────┘  │
│                                        │
│   ┌────────────────────────────────┐  │
│   │  🌙 العالم العربي               │  │
│   │  أسئلة خاصة عن الدول العربية   │  │
│   └────────────────────────────────┘  │
│                                        │
├────────────────────────────────────────┤
│  🏠    🎯    📊    ⚙️                  │
└────────────────────────────────────────┘
```

### 7.4 Statistics Page (الإحصائيات)

**Route:** `/ar/stats`

**Layout:**
```
┌────────────────────────────────────────┐
│  ← رجوع             الإحصائيات         │
├────────────────────────────────────────┤
│                                        │
│   ┌──────────┐  ┌──────────┐          │
│   │    42    │  │   90%    │          │
│   │ الألعاب  │  │ نسبة الفوز│          │
│   └──────────┘  └──────────┘          │
│                                        │
│   ┌──────────┐  ┌──────────┐          │
│   │    7     │  │    15    │          │
│   │ السلسلة  │  │ أفضل سلسلة│          │
│   │ الحالية  │  │          │          │
│   └──────────┘  └──────────┘          │
│                                        │
│   توزيع التخمينات                       │
│   ┌────────────────────────────────┐  │
│   │ 1  ███████████████  8         │  │
│   │ 2  ██████████████████  12     │  │
│   │ 3  ████████████  7            │  │
│   │ 4  ████████  5                │  │
│   │ 5+ ████  3                    │  │
│   └────────────────────────────────┘  │
│                                        │
│   الإنجازات (8/20)                     │
│   ┌────────────────────────────────┐  │
│   │ 🏆 🔥 📅 ⭐ 🎯 💎 📚 🌟      │  │
│   └────────────────────────────────┘  │
│                                        │
├────────────────────────────────────────┤
│  🏠    🎯    📊    ⚙️                  │
└────────────────────────────────────────┘
```

### 7.5 Settings Page (الإعدادات)

**Route:** `/ar/settings`

**Layout:**
```
┌────────────────────────────────────────┐
│  ← رجوع              الإعدادات         │
├────────────────────────────────────────┤
│                                        │
│   الحساب                               │
│   ┌────────────────────────────────┐  │
│   │  👤 الملف الشخصي          >   │  │
│   │  🔔 الإشعارات             >   │  │
│   └────────────────────────────────┘  │
│                                        │
│   المظهر                               │
│   ┌────────────────────────────────┐  │
│   │  🎨 المظهر                      │  │
│   │     ○ فاتح  ● داكن  ○ تلقائي  │  │
│   │                                  │  │
│   │  🌐 اللغة                       │  │
│   │     ● العربية  ○ English       │  │
│   └────────────────────────────────┘  │
│                                        │
│   حول التطبيق                          │
│   ┌────────────────────────────────┐  │
│   │  ℹ️ عن رحال              >    │  │
│   │  📜 سياسة الخصوصية       >    │  │
│   │  📋 شروط الاستخدام       >    │  │
│   │  💬 تواصل معنا           >    │  │
│   └────────────────────────────────┘  │
│                                        │
│   الإصدار 1.0.0                        │
│                                        │
├────────────────────────────────────────┤
│  🏠    🎯    📊    ⚙️                  │
└────────────────────────────────────────┘
```

---

## 8. API Integration

### 8.1 API Client

```typescript
// lib/api/client.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface RequestOptions extends RequestInit {
  token?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { token, ...fetchOptions } = options;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...fetchOptions,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'حدث خطأ في الطلب');
    }

    return response.json();
  }

  get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  patch<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const api = new ApiClient(API_BASE_URL);
```

### 8.2 Game API

```typescript
// lib/api/game.ts
import { api } from './client';

export interface DailyChallenge {
  id: string;
  challenge_date: string;
  start_country: {
    id: string;
    code: string;
    name_ar: string;
    name_en: string;
    flag_emoji: string;
  };
  end_country: {
    id: string;
    code: string;
    name_ar: string;
    name_en: string;
    flag_emoji: string;
  };
  shortest_path: number;
  user_progress?: {
    guesses: Guess[];
    hints_used: number;
    completed: boolean;
  };
}

export interface Guess {
  country_id: string;
  name_ar: string;
  emoji: string;
  is_on_path: boolean;
}

export interface GuessResponse {
  country: {
    id: string;
    name_ar: string;
    flag_emoji: string;
  };
  score_emoji: string;
  score_description: string;
  is_on_shortest_path: boolean;
  is_destination: boolean;
  game_complete: boolean;
  total_guesses: number;
}

export async function getDailyChallenge(token?: string): Promise<DailyChallenge> {
  return api.get('/api/game/daily', { token });
}

export async function submitGuess(
  challengeId: string,
  countryId: string,
  token?: string
): Promise<GuessResponse> {
  return api.post('/api/game/guess', {
    challenge_id: challengeId,
    country_id: countryId,
  }, { token });
}

export async function useHint(
  challengeId: string,
  hintType: 'border_hint' | 'all_borders_hint' | 'first_letter_hint',
  token?: string
): Promise<{ hint_type: string; hint_data: any; hints_remaining: number }> {
  return api.post('/api/game/hint', {
    challenge_id: challengeId,
    hint_type: hintType,
  }, { token });
}

export async function searchCountries(query: string): Promise<Array<{
  id: string;
  name_ar: string;
  name_en: string;
  flag_emoji: string;
  score: number;
}>> {
  if (!query || query.length < 1) return [];
  return api.get(`/api/autocomplete/countries?q=${encodeURIComponent(query)}&limit=10`)
    .then((res: any) => res.suggestions);
}
```

---

## 9. PWA Configuration

### 9.1 Manifest (`app/manifest.json`)

```json
{
  "name": "رحال - لعبة الجغرافيا العربية",
  "short_name": "رحال",
  "description": "اكتشف العالم من خلال اللعب - لعبة جغرافيا عربية",
  "start_url": "/ar",
  "display": "standalone",
  "background_color": "#FAFAFA",
  "theme_color": "#0D7377",
  "orientation": "portrait",
  "dir": "rtl",
  "lang": "ar",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-maskable-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/home.png",
      "sizes": "1170x2532",
      "type": "image/png",
      "form_factor": "narrow"
    }
  ],
  "categories": ["games", "education"],
  "shortcuts": [
    {
      "name": "التحدي اليومي",
      "short_name": "التحدي",
      "description": "ابدأ تحدي اليوم",
      "url": "/ar/game",
      "icons": [{ "src": "/icons/game-96x96.png", "sizes": "96x96" }]
    },
    {
      "name": "الأسئلة",
      "short_name": "أسئلة",
      "description": "اختبر معلوماتك",
      "url": "/ar/quiz",
      "icons": [{ "src": "/icons/quiz-96x96.png", "sizes": "96x96" }]
    }
  ]
}
```

### 9.2 Next.js PWA Config (`next.config.js`)

```javascript
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... other config
};

module.exports = withPWA(nextConfig);
```

---

## 10. Accessibility (WCAG + Arabic Screen Readers)

### 10.1 Accessibility Guidelines

```tsx
// Accessibility best practices for Arabic content

// 1. Always set lang and dir attributes
<html lang="ar" dir="rtl">

// 2. Use semantic HTML
<nav aria-label="التنقل الرئيسي">
  <ul role="menubar">
    <li role="none">
      <a role="menuitem" href="/ar">الرئيسية</a>
    </li>
  </ul>
</nav>

// 3. Provide Arabic labels for screen readers
<button aria-label="مشاركة النتيجة">
  <ShareIcon />
</button>

// 4. Announce dynamic content
<div role="status" aria-live="polite" aria-label="نتيجة التخمين">
  {result && <span>{result.score_description}</span>}
</div>

// 5. Handle focus management for modals
<dialog
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
>
  <h2 id="modal-title">تهانينا!</h2>
</dialog>

// 6. Keyboard navigation
<input
  onKeyDown={(e) => {
    if (e.key === 'Enter') handleSubmit();
    if (e.key === 'Escape') handleCancel();
  }}
/>

// 7. Color contrast (WCAG AA)
// Primary text: #1A1A1A on #FAFAFA = 15.3:1 ✓
// Secondary text: #666666 on #FAFAFA = 5.7:1 ✓
```

### 10.2 Screen Reader Testing

Test with:
- **VoiceOver** (iOS/macOS) - Arabic language pack
- **TalkBack** (Android) - Arabic language
- **NVDA** (Windows) - with Arabic add-on

---

## 11. Responsive Design (Mobile-First)

### 11.1 Breakpoints

```css
/* Tailwind default breakpoints */
sm: 640px   /* Small phones landscape */
md: 768px   /* Tablets */
lg: 1024px  /* Laptops */
xl: 1280px  /* Desktops */
2xl: 1536px /* Large screens */
```

### 11.2 Responsive Component Example

```tsx
// Responsive card grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map((item) => (
    <Card key={item.id}>{/* ... */}</Card>
  ))}
</div>

// Responsive typography
<h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
  رحال
</h1>

// Responsive spacing
<div className="p-4 sm:p-6 lg:p-8">
  {/* Content */}
</div>

// Hide/show based on screen size
<div className="block lg:hidden">  {/* Mobile only */}
  <MobileNav />
</div>
<div className="hidden lg:block">  {/* Desktop only */}
  <DesktopNav />
</div>
```

---

## 12. AI Tool Prompts

### 12.1 v0.dev Prompts

**Prompt 1: Home Page**
```
Create a mobile-first Arabic RTL home page for a geography game app called "رحال" (Rahal).

Requirements:
- RTL layout with Arabic text
- IBM Plex Sans Arabic font
- Primary color: #0D7377 (teal)
- Secondary color: #D4A574 (sand gold)

Components needed:
1. Header with app name "رحال 🌍" and menu icon
2. Welcome message "مرحباً بك في رحال!"
3. Daily challenge card showing:
   - Start country flag and name
   - Arrow pointing to end country
   - "ابدأ التحدي" (Start Challenge) button
4. Stats row with:
   - Current streak (🔥 السلسلة)
   - Games played (🎯 الألعاب)
5. Quiz section card with "الأسئلة" heading
6. Bottom navigation: الرئيسية | الأسئلة | الإحصائيات | الإعدادات

Use Tailwind CSS with RTL utilities (ms-, me-, ps-, pe-, start-, end-).
Include framer-motion animations for cards.
```

**Prompt 2: Country Autocomplete Input**
```
Create an Arabic autocomplete input component for searching countries.

Requirements:
- RTL text input with placeholder "اكتب اسم الدولة..."
- Dropdown shows suggestions with:
  - Flag emoji
  - Arabic country name (bold)
  - English name in parentheses (lighter)
- Keyboard navigation (Arrow keys, Enter, Escape)
- Fuzzy matching for Arabic text
- Loading spinner while fetching
- Max 10 suggestions

Use:
- React + TypeScript
- Tailwind CSS with RTL support
- TanStack Query for data fetching
- Framer Motion for dropdown animation

API endpoint: GET /api/autocomplete/countries?q={query}
Response: { suggestions: [{ id, name_ar, name_en, flag_emoji, score }] }
```

**Prompt 3: Game Result Card with Emoji Scores**
```
Create a game result display component showing guess history with emoji scores.

Each guess shows:
- Order number (1, 2, 3...)
- Country flag emoji
- Country name in Arabic
- Score emoji (🟢 🟡 🟠 🔴 ⚫)

Score meanings:
- 🟢 ممتاز (Excellent) - On shortest path, correct order
- 🟡 جيد (Good) - On shortest path, wrong order
- 🟠 مقبول (Okay) - Close to path
- 🔴 بعيد (Far) - Significant detour
- ⚫ قارة مختلفة (Wrong continent)

Include animations when new guesses are added.
RTL layout, Arabic labels, Tailwind CSS.
```

### 12.2 Lovable Prompts

**Full Project Prompt:**
```
Create a complete Arabic geography game web app called "رحال" (Rahal - meaning "Traveler").

## Overview
A daily geography puzzle game where players navigate from a start country to a destination country by naming intermediate countries (like Wordle meets geography).

## Tech Stack
- Next.js 15 with App Router
- React 19
- TypeScript
- Tailwind CSS with RTL support
- Zustand for state management
- TanStack Query for API calls
- Framer Motion for animations

## Design System
- Primary: #0D7377 (Deep Teal)
- Secondary: #D4A574 (Sand Gold)
- Font: IBM Plex Sans Arabic
- RTL layout throughout
- Mobile-first responsive design

## Pages Needed
1. **Home (/)** - Daily challenge preview, quick stats, quiz link
2. **Game (/game)** - Country autocomplete input, guess history with emoji scores, hints
3. **Quiz (/quiz)** - Category selection, questions, multiple choice
4. **Stats (/stats)** - Win rate, streaks, guess distribution chart, achievements
5. **Settings (/settings)** - Theme, language, profile

## Core Features
1. Arabic country autocomplete with fuzzy matching
2. Emoji scoring system (🟢🟡🟠🔴⚫)
3. 3 hints per game
4. Share results in Arabic
5. Streak tracking with local storage
6. Quiz mode with categories (capitals, flags, landmarks)

## API Integration
Backend: FastAPI at /api
- GET /api/game/daily - Get today's challenge
- POST /api/game/guess - Submit a guess
- POST /api/game/hint - Use a hint
- GET /api/autocomplete/countries?q= - Search countries
- GET /api/quiz/question - Get quiz question
- POST /api/quiz/answer - Submit answer

## Arabic Labels
- الرئيسية (Home)
- لعبة المسار (Path Game)
- الأسئلة (Questions)
- الإحصائيات (Statistics)
- الإعدادات (Settings)
- ابدأ التحدي (Start Challenge)
- اكتب اسم الدولة (Type country name)
- تلميح (Hint)
- مشاركة (Share)

Make sure all UI text is in Arabic and the layout is RTL.
```

### 12.3 Replit Prompts

**Project Setup Prompt:**
```
Create a Next.js 15 project for an Arabic geography game.

Project name: rahal-frontend

Install these dependencies:
- next@15
- react@19
- typescript
- tailwindcss
- tailwindcss-rtl
- zustand
- @tanstack/react-query
- framer-motion
- next-intl
- zod
- react-hook-form
- lucide-react

Configure:
1. Tailwind with RTL plugin
2. IBM Plex Sans Arabic from Google Fonts
3. App Router with [locale] folder for i18n
4. Arabic (ar) as default locale

Create folder structure:
- app/[locale]/ (pages)
- components/ui/ (base components)
- components/game/ (game components)
- components/quiz/ (quiz components)
- lib/api/ (API functions)
- lib/stores/ (Zustand stores)
- lib/hooks/ (custom hooks)
- messages/ (i18n JSON files)
- types/ (TypeScript types)

Add basic layout with:
- RTL support
- Arabic font
- Mobile navigation
- Color scheme variables
```

### 12.4 Bolt Prompts

**Rapid Prototype Prompt:**
```
Build a quick prototype of an Arabic geography game called Rahal.

Core functionality:
1. Display daily challenge: Start country → End country (with flags)
2. Autocomplete input for guessing countries (Arabic)
3. Show guess history with emoji scores
4. Win screen with share button

Data (hardcode for prototype):
- Start: 🇧🇷 البرازيل (Brazil)
- End: 🇯🇵 اليابان (Japan)
- Valid countries: الأرجنتين, تشيلي, بيرو, كولومبيا, etc.

Emoji scoring:
- On correct path: 🟢 (green)
- Wrong order: 🟡 (yellow)
- Close: 🟠 (orange)
- Far: 🔴 (red)

Style:
- Arabic text, RTL layout
- Teal primary (#0D7377)
- Clean, minimal design
- Mobile-friendly

Use React + Tailwind CSS.
Focus on the game loop, not authentication or backend.
```

---

## Appendix A: Translation Keys

### Arabic Translations (`messages/ar.json`)

```json
{
  "common": {
    "loading": "جاري التحميل...",
    "error": "حدث خطأ",
    "retry": "إعادة المحاولة",
    "cancel": "إلغاء",
    "confirm": "تأكيد",
    "save": "حفظ",
    "back": "رجوع",
    "next": "التالي",
    "previous": "السابق",
    "close": "إغلاق"
  },
  "nav": {
    "home": "الرئيسية",
    "game": "لعبة المسار",
    "quiz": "الأسئلة",
    "stats": "الإحصائيات",
    "settings": "الإعدادات",
    "profile": "الملف الشخصي",
    "leaderboard": "المتصدرون"
  },
  "home": {
    "welcome": "مرحباً بك في رحال!",
    "dailyChallenge": "تحدي اليوم",
    "startChallenge": "ابدأ التحدي",
    "quickStats": "إحصائياتك",
    "currentStreak": "السلسلة الحالية",
    "gamesPlayed": "الألعاب",
    "playQuiz": "العب الأسئلة"
  },
  "game": {
    "title": "لعبة المسار",
    "from": "من",
    "to": "إلى",
    "shortestPath": "أقصر مسار",
    "countries": "دول",
    "inputPlaceholder": "اكتب اسم الدولة...",
    "guesses": "التخمينات",
    "hints": "تلميحات",
    "useHint": "استخدم تلميح",
    "noGuessesYet": "لم تقم بأي تخمين بعد",
    "startTyping": "ابدأ بكتابة اسم دولة"
  },
  "score": {
    "excellent": "ممتاز",
    "good": "جيد",
    "okay": "مقبول",
    "far": "بعيد",
    "wrongContinent": "قارة مختلفة"
  },
  "quiz": {
    "title": "الأسئلة",
    "selectCategory": "اختر نوع الأسئلة",
    "categories": {
      "capitals": "العواصم",
      "flags": "الأعلام",
      "landmarks": "المعالم",
      "attractions": "معالم الجذب",
      "geography": "الجغرافيا",
      "borders": "الحدود",
      "population": "السكان",
      "arabWorld": "العالم العربي"
    },
    "difficulty": {
      "easy": "سهل",
      "medium": "متوسط",
      "hard": "صعب"
    },
    "question": "السؤال",
    "of": "من",
    "correct": "إجابة صحيحة!",
    "incorrect": "إجابة خاطئة",
    "correctAnswer": "الإجابة الصحيحة"
  },
  "stats": {
    "title": "الإحصائيات",
    "gamesPlayed": "الألعاب",
    "winRate": "نسبة الفوز",
    "currentStreak": "السلسلة الحالية",
    "maxStreak": "أفضل سلسلة",
    "guessDistribution": "توزيع التخمينات",
    "achievements": "الإنجازات"
  },
  "share": {
    "title": "شارك نتيجتك",
    "copied": "تم النسخ!",
    "copyFailed": "فشل النسخ",
    "shareResult": "مشاركة النتيجة",
    "attempts": "محاولات",
    "hints": "تلميحات",
    "score": "النتيجة",
    "points": "نقطة",
    "playNow": "العب الآن"
  },
  "settings": {
    "title": "الإعدادات",
    "account": "الحساب",
    "profile": "الملف الشخصي",
    "notifications": "الإشعارات",
    "appearance": "المظهر",
    "theme": "المظهر",
    "themeLight": "فاتح",
    "themeDark": "داكن",
    "themeSystem": "تلقائي",
    "language": "اللغة",
    "about": "حول التطبيق",
    "aboutRahal": "عن رحال",
    "privacy": "سياسة الخصوصية",
    "terms": "شروط الاستخدام",
    "contact": "تواصل معنا",
    "version": "الإصدار"
  },
  "auth": {
    "login": "تسجيل الدخول",
    "logout": "تسجيل الخروج",
    "signup": "إنشاء حساب",
    "email": "البريد الإلكتروني",
    "password": "كلمة المرور",
    "forgotPassword": "نسيت كلمة المرور؟",
    "continueAsGuest": "المتابعة كضيف"
  },
  "errors": {
    "generic": "حدث خطأ، يرجى المحاولة مرة أخرى",
    "network": "خطأ في الاتصال بالشبكة",
    "notFound": "غير موجود",
    "unauthorized": "يجب تسجيل الدخول",
    "challengeNotFound": "لا يوجد تحدٍ لهذا اليوم",
    "alreadyCompleted": "لقد أكملت هذا التحدي بالفعل",
    "noHintsLeft": "استخدمت جميع التلميحات المتاحة"
  }
}
```

---

**Document Status:** Complete
**Ready for Implementation**

This frontend design document provides comprehensive specifications for building the Rahal frontend using modern web technologies with full Arabic RTL support. The AI tool prompts can be used directly with v0.dev, Lovable, Replit, and Bolt to accelerate development.
