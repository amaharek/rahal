# Frontend Test Suite Documentation

## 🌍 Important: Locale-Agnostic Testing

**All tests in this suite use locale-agnostic approaches** to prevent breaking when translations change. Tests use `data-testid`, semantic queries (roles, labels), and translation keys instead of hardcoded Arabic or English text.

**📖 Read the full guide**: [Locale-Agnostic Testing Guide](../../docs/testing/LOCALE_AGNOSTIC_TESTING.md)

**Key Principles**:
- ✅ Use `data-testid` for element selection
- ✅ Use semantic queries (roles, ARIA labels)
- ✅ Test structure and behavior, not translated content
- ✅ Mock data uses translation keys, not translated text
- ❌ Don't hardcode Arabic/English text in tests

---

## Table of Contents
1. [Overview](#overview)
2. [Test Structure](#test-structure)
3. [Quick Start](#quick-start)
4. [Unit Tests (TDD)](#unit-tests-tdd)
5. [E2E Tests](#e2e-tests)
6. [Test Case Index](#test-case-index)
7. [Writing Tests](#writing-tests)
8. [Troubleshooting](#troubleshooting)

---

## Overview

This directory contains the complete test suite for the Rahal frontend application, including unit tests for React components and end-to-end tests using Playwright.

**Test Statistics:**
- **Total Test Files**: 9
- **Unit Tests**: 79 (TDD - components not yet implemented)
- **E2E Tests**: 101+ scenarios
- **Coverage Target**: 50% → 65% → 75%
- **Frameworks**: Vitest 4.0.18, React Testing Library 16.3.2, Playwright 1.58.1

---

## Test Structure

```
frontend/
├── components/
│   └── quiz/
│       ├── QuestionCard.test.tsx        # 8 TDD tests
│       ├── AnswerOptions.test.tsx       # 12 TDD tests
│       ├── AutocompleteAnswer.test.tsx  # 20 TDD tests
│       ├── Timer.test.tsx               # 23 TDD tests
│       └── QuizProgress.test.tsx        # 16 TDD tests
├── e2e/
│   └── specs/
│       ├── quiz-flow.spec.ts            # 26 E2E tests
│       ├── streak-tracking.spec.ts      # 20 E2E tests
│       ├── leaderboard.spec.ts          # 30 E2E tests
│       └── guest-vs-auth.spec.ts        # 25 E2E tests
├── vitest.config.ts                      # Vitest configuration
├── vitest.setup.ts                       # Test setup and mocks
└── playwright.config.ts                  # Playwright configuration
```

---

## Quick Start

### Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Ensure backend is running (for E2E tests)
cd ../backend && docker-compose up -d
```

### Run Unit Tests

```bash
# Run all unit tests
npm run test

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch

# Run specific test file
npm run test QuestionCard.test.tsx
```

### Run E2E Tests

```bash
# Run required E2E gate (Chromium, matches CI)
npm run test:e2e

# Run all configured browser projects (optional local check)
npm run test:e2e:all

# Run with UI
npm run test:e2e:ui

# Run in debug mode
npm run test:e2e:debug

# Run specific test file
npx playwright test quiz-flow.spec.ts

# Run specific test
npx playwright test -g "should complete a full quiz session"
```

---

## Unit Tests (TDD)

### Overview

Unit tests are written using **Test-Driven Development (TDD)** approach. Tests define component contracts **before** implementation. All tests will **fail** until components are implemented to match specifications.

### Test Files

#### 1. QuestionCard.test.tsx (8 tests)

**Component**: `<QuestionCard />`  
**Purpose**: Display quiz question with category, difficulty, and metadata

**Test Cases**:
- ✅ Renders question text in Arabic
- ✅ Shows category badge
- ✅ Shows difficulty indicator
- ✅ Displays question number
- ✅ Shows image when provided
- ✅ Hides image when not provided
- ✅ Shows hint button when available
- ✅ Accessibility: proper ARIA labels

**Props Interface**:
```typescript
interface QuestionCardProps {
  question: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionNumber: number;
  totalQuestions: number;
  imageUrl?: string;
  hasHint: boolean;
  onHintClick?: () => void;
}
```

**Run**: `npm run test QuestionCard.test.tsx`

---

#### 2. AnswerOptions.test.tsx (12 tests)

**Component**: `<AnswerOptions />`  
**Purpose**: Display multiple choice answer options

**Test Cases**:
- ✅ Renders all options
- ✅ Handles option selection
- ✅ Shows selected state
- ✅ Disables options after submission
- ✅ Shows correct answer after submission
- ✅ Shows incorrect answer highlighting
- ✅ Shuffles options on mount
- ✅ Keyboard navigation (arrow keys)
- ✅ Keyboard selection (Enter/Space)
- ✅ Maintains selection after re-render
- ✅ ARIA roles and labels
- ✅ RTL support for Arabic

**Props Interface**:
```typescript
interface AnswerOptionsProps {
  options: string[];
  selectedOption: string | null;
  correctAnswer?: string;
  isSubmitted: boolean;
  onSelect: (option: string) => void;
  disabled?: boolean;
}
```

**Run**: `npm run test AnswerOptions.test.tsx`

---

#### 3. AutocompleteAnswer.test.tsx (20 tests)

**Component**: `<AutocompleteAnswer />`  
**Purpose**: Autocomplete input for text-based answers

**Test Cases**:
- ✅ Renders input field
- ✅ Shows placeholder text
- ✅ Handles text input
- ✅ Shows suggestions on typing
- ✅ Filters suggestions based on input
- ✅ Selects suggestion on click
- ✅ Selects suggestion with keyboard
- ✅ Clears input on clear button
- ✅ Disables input when submitted
- ✅ Shows loading state while fetching
- ✅ Handles API errors gracefully
- ✅ Debounces API calls (300ms)
- ✅ Shows "No results" message
- ✅ Highlights matching text
- ✅ Supports Arabic input
- ✅ Normalizes Arabic text
- ✅ Keyboard navigation (Up/Down)
- ✅ Closes suggestions on Escape
- ✅ Accessibility: proper ARIA
- ✅ RTL layout for Arabic

**Props Interface**:
```typescript
interface AutocompleteAnswerProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (value: string) => void;
  suggestions: string[];
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  error?: string;
}
```

**Run**: `npm run test AutocompleteAnswer.test.tsx`

---

#### 4. Timer.test.tsx (23 tests)

**Component**: `<Timer />`  
**Purpose**: Countdown timer for quiz sessions

**Test Cases**:
- ✅ Displays initial time
- ✅ Counts down every second
- ✅ Shows time in MM:SS format
- ✅ Changes color when time running out
- ✅ Shows warning at 30 seconds
- ✅ Shows critical state at 10 seconds
- ✅ Calls onComplete when time expires
- ✅ Pauses when paused prop is true
- ✅ Resumes when paused is false
- ✅ Resets when reset prop changes
- ✅ Stops at 0 (doesn't go negative)
- ✅ Shows hours for long durations
- ✅ Handles very short durations (< 10s)
- ✅ Cleans up interval on unmount
- ✅ Updates when duration prop changes
- ✅ Shows progress bar
- ✅ Animates progress bar
- ✅ Plays warning sound (if enabled)
- ✅ Vibrates device (if supported)
- ✅ Shows elapsed time (alternative mode)
- ✅ Accessibility: screen reader announces time
- ✅ Visibility: pauses when tab not visible
- ✅ Performance: uses requestAnimationFrame

**Props Interface**:
```typescript
interface TimerProps {
  duration: number; // seconds
  onComplete?: () => void;
  onWarning?: (seconds: number) => void;
  paused?: boolean;
  showProgressBar?: boolean;
  warningThreshold?: number;
  criticalThreshold?: number;
  playSound?: boolean;
}
```

**Run**: `npm run test Timer.test.tsx`

---

#### 5. QuizProgress.test.tsx (16 tests)

**Component**: `<QuizProgress />`  
**Purpose**: Display quiz progress and score

**Test Cases**:
- ✅ Shows current question number
- ✅ Shows total questions
- ✅ Shows progress bar
- ✅ Updates progress bar width
- ✅ Shows correct count
- ✅ Shows incorrect count
- ✅ Shows skipped count
- ✅ Shows current score
- ✅ Shows score animation on update
- ✅ Shows correct/incorrect indicators
- ✅ Shows question status (answered/skipped)
- ✅ Highlights current question
- ✅ Shows completion percentage
- ✅ Shows estimated time remaining
- ✅ Accessibility: progress bar ARIA
- ✅ Responsive layout

**Props Interface**:
```typescript
interface QuizProgressProps {
  currentQuestion: number;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  skippedCount: number;
  currentScore: number;
  questionStatuses: ('correct' | 'incorrect' | 'skipped' | null)[];
}
```

**Run**: `npm run test QuizProgress.test.tsx`

---

## E2E Tests

### Overview

End-to-end tests use Playwright to test complete user journeys through the application. Tests verify integration between frontend, backend, and database.

### Test Files

#### 1. quiz-flow.spec.ts (26 tests)

**Purpose**: Test complete quiz session flow

**Test Suites**:

**Quiz Flow - Complete Session**
- ✅ Complete full 10-question quiz
- ✅ Display timer and countdown
- ✅ Calculate and display score correctly
- ✅ Allow skipping questions
- ✅ Handle quiz timeout
- ✅ Show progress bar updating
- ✅ Display question categories
- ✅ Display difficulty indicator
- ✅ Show correct/incorrect feedback with explanations
- ✅ Allow reviewing answers at end

**Quiz Flow - Question Types**
- ✅ Handle multiple choice questions (4 options)
- ✅ Handle autocomplete questions with suggestions

**Quiz Flow - Score Calculation**
- ✅ Reduce score for hints used (-3 points)
- ✅ Show final score breakdown

**Quiz Flow - Accessibility**
- ✅ Keyboard navigable (Tab, Space, Enter)
- ✅ Proper ARIA labels on all interactive elements

**Run**: `npx playwright test quiz-flow.spec.ts`

---

#### 2. streak-tracking.spec.ts (20 tests)

**Purpose**: Test daily streak persistence and tracking

**Test Suites**:

**Streak Tracking - Daily Challenges**
- ✅ Display current streak on profile
- ✅ Increment streak after completing daily challenge
- ✅ Show max streak achieved
- ✅ Reset streak if day is missed
- ✅ Maintain streak if played yesterday

**Streak Tracking - Calendar View**
- ✅ Display calendar with completed days highlighted
- ✅ Show streak fire emoji for consecutive days 🔥
- ✅ Show tooltip with stats on day hover
- ✅ Navigate between months

**Streak Tracking - Notifications**
- ✅ Show celebration for streak milestones (7, 30, 100 days)
- ✅ Warn user if streak is at risk

**Streak Tracking - Persistence**
- ✅ Persist streak across sessions
- ✅ Sync streak across multiple devices
- ✅ Recover streak data after network failure

**Streak Tracking - Leaderboard Integration**
- ✅ Show streak leaderboard
- ✅ Highlight current user in streak leaderboard

**Streak Tracking - Guest Users**
- ✅ Don't track streaks for guest users
- ✅ Prompt guest to login to track streaks

**Run**: `npx playwright test streak-tracking.spec.ts`

---

#### 3. leaderboard.spec.ts (30 tests)

**Purpose**: Test ranking, filtering, and leaderboard features

**Test Suites**:

**Leaderboard - Display and Ranking**
- ✅ Display leaderboard with ranked users
- ✅ Show correct ranking order by score
- ✅ Display user avatar, name, and score
- ✅ Show medals for top 3 users (🥇🥈🥉)

**Leaderboard - Time Filters**
- ✅ Filter by daily rankings
- ✅ Filter by weekly rankings
- ✅ Filter by monthly rankings
- ✅ Filter by all-time rankings

**Leaderboard - Category Filters**
- ✅ Show overall score leaderboard by default
- ✅ Switch to streak leaderboard
- ✅ Switch to accuracy leaderboard
- ✅ Switch to speed leaderboard

**Leaderboard - Pagination**
- ✅ Show 20 users per page
- ✅ Navigate to next page
- ✅ Navigate to previous page
- ✅ Show page number and total pages

**Leaderboard - Current User**
- ✅ Highlight current user in leaderboard
- ✅ Show current user rank card
- ✅ Scroll to current user position
- ✅ Show rank change indicator (↑↓)

**Leaderboard - Search and Filter**
- ✅ Search for specific user
- ✅ Filter by country
- ✅ Show friends leaderboard (auth required)

**Leaderboard - Real-time Updates**
- ✅ Update when new scores are posted
- ✅ Show live indicator when updating

**Leaderboard - Guest Users**
- ✅ Allow guests to view leaderboard
- ✅ Prompt guest to login for personalized features
- ✅ Don't show rank change indicators for guests

**Leaderboard - Mobile Responsiveness**
- ✅ Display correctly on mobile (375x667)
- ✅ Collapse detailed stats on mobile

**Leaderboard - Accessibility**
- ✅ Keyboard navigable
- ✅ Proper ARIA labels (role="list", role="listitem")
- ✅ Announce rank changes to screen readers

**Run**: `npx playwright test leaderboard.spec.ts`

---

#### 4. guest-vs-auth.spec.ts (25 tests)

**Purpose**: Compare guest and authenticated user experiences

**Test Suites**:

**Guest vs Auth - Game Access**
- ✅ Guest can play daily challenge without login
- ✅ Authenticated user has full game access
- ✅ Guest cannot access previous challenges
- ✅ Authenticated user can access challenge history

**Guest vs Auth - Data Persistence**
- ✅ Guest progress is not saved after page reload
- ✅ Guest progress stored in localStorage is temporary
- ✅ Authenticated user progress persists after reload
- ✅ Authenticated user progress syncs across devices

**Guest vs Auth - Statistics**
- ✅ Guest cannot view statistics
- ✅ Authenticated user can view detailed statistics
- ✅ Guest sees limited stats after completing game
- ✅ Authenticated user sees comprehensive stats after game

**Guest vs Auth - Leaderboard**
- ✅ Guest can view leaderboard but not compete
- ✅ Authenticated user appears in leaderboard

**Guest vs Auth - Quiz Features**
- ✅ Guest can take quiz but results not saved
- ✅ Authenticated user has quiz history saved
- ✅ Guest prompted to login for personalized quiz
- ✅ Authenticated user gets personalized quiz recommendations

**Guest vs Auth - Profile Features**
- ✅ Guest cannot access profile page
- ✅ Authenticated user has full profile access
- ✅ Guest sees call-to-action banner
- ✅ Authenticated user sees no CTA banners

**Guest vs Auth - Sharing Features**
- ✅ Guest can share game results
- ✅ Authenticated user share includes profile link

**Guest vs Auth - Feature Discovery**
- ✅ Guest sees limited feature set on homepage
- ✅ Authenticated user sees all available features
- ✅ Guest can easily transition to authenticated state

**Run**: `npx playwright test guest-vs-auth.spec.ts`

---

## Test Case Index

### By Priority

#### P0 (Critical - Must Pass for Production)
- `quiz-flow.spec.ts` - Complete quiz session
- `guest-vs-auth.spec.ts` - Guest can play games
- Unit tests: QuestionCard, AnswerOptions rendering

#### P1 (High Priority - Core Features)
- `quiz-flow.spec.ts` - Timer and scoring
- `streak-tracking.spec.ts` - Streak persistence
- `leaderboard.spec.ts` - Ranking display
- Unit tests: Timer, QuizProgress

#### P2 (Medium Priority - Enhanced Features)
- `streak-tracking.spec.ts` - Calendar view
- `leaderboard.spec.ts` - Filtering and pagination
- `guest-vs-auth.spec.ts` - Feature limitations
- Unit tests: AutocompleteAnswer

#### P3 (Low Priority - Edge Cases & Polish)
- Accessibility tests
- Mobile responsiveness
- Real-time updates
- Animation tests

---

### By User Journey

#### New User (Guest)
1. `guest-vs-auth.spec.ts::test_guest_can_play_daily_challenge_without_login`
2. `quiz-flow.spec.ts::test_should_complete_a_full_quiz_session`
3. `leaderboard.spec.ts::test_guest_can_view_leaderboard_but_not_compete`
4. `guest-vs-auth.spec.ts::test_guest_sees_call_to_action_banner`

#### Registered User
1. `guest-vs-auth.spec.ts::test_authenticated_user_has_full_game_access`
2. `streak-tracking.spec.ts::test_should_increment_streak_after_completing_daily_challenge`
3. `leaderboard.spec.ts::test_authenticated_user_appears_in_leaderboard`
4. `guest-vs-auth.spec.ts::test_authenticated_user_progress_persists_after_reload`

#### Quiz Taker
1. `quiz-flow.spec.ts::test_should_complete_a_full_quiz_session_with_10_questions`
2. `quiz-flow.spec.ts::test_should_display_timer_and_countdown_during_quiz`
3. `quiz-flow.spec.ts::test_should_calculate_and_display_score_correctly`
4. `quiz-flow.spec.ts::test_should_allow_reviewing_answers_at_end`

#### Competitive Player
1. `leaderboard.spec.ts::test_should_display_leaderboard_with_ranked_users`
2. `leaderboard.spec.ts::test_should_highlight_current_user_in_leaderboard`
3. `streak-tracking.spec.ts::test_should_show_streak_leaderboard`
4. `leaderboard.spec.ts::test_should_filter_by_weekly_rankings`

---

## Writing Tests

### Unit Test Pattern (Vitest + React Testing Library)

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('renders with correct text', () => {
    // Arrange
    const props = { text: 'Hello World' };
    
    // Act
    render(<MyComponent {...props} />);
    
    // Assert
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });
  
  it('handles click events', async () => {
    // Arrange
    const handleClick = vi.fn();
    render(<MyComponent onClick={handleClick} />);
    
    // Act
    fireEvent.click(screen.getByRole('button'));
    
    // Assert
    await waitFor(() => {
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });
});
```

### E2E Test Pattern (Playwright)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to starting page
    await page.goto('/ar/feature');
  });
  
  test('should perform user action', async ({ page }) => {
    // Act
    await page.click('[data-testid="button"]');
    await page.fill('[data-testid="input"]', 'test value');
    await page.click('[data-testid="submit"]');
    
    // Assert
    await expect(page.locator('[data-testid="result"]')).toBeVisible();
    await expect(page.locator('[data-testid="result"]')).toContainText('Success');
  });
});
```

### Testing Async Operations

```typescript
it('loads data asynchronously', async () => {
  render(<AsyncComponent />);
  
  // Wait for loading to disappear
  await waitFor(() => {
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });
  
  // Check data appeared
  expect(screen.getByText('Data loaded')).toBeInTheDocument();
});
```

### Testing User Interactions

```typescript
it('handles user input', async () => {
  const user = userEvent.setup();
  render(<Form />);
  
  // Type in input
  await user.type(screen.getByLabelText('Name'), 'John');
  
  // Select option
  await user.selectOptions(screen.getByLabelText('Country'), 'Egypt');
  
  // Click button
  await user.click(screen.getByRole('button', { name: 'Submit' }));
  
  // Verify result
  expect(screen.getByText('Form submitted')).toBeInTheDocument();
});
```

### Mocking API Calls

```typescript
it('fetches and displays data', async () => {
  // Mock fetch
  global.fetch = vi.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve({ name: 'Test User' }),
    })
  ) as any;
  
  render(<UserProfile userId="123" />);
  
  await waitFor(() => {
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });
  
  expect(fetch).toHaveBeenCalledWith('/api/users/123');
});
```

---

## Troubleshooting

### Common Issues

#### 1. Test Fails: Component Not Found
```
TestingLibraryElementError: Unable to find an element
```

**Solution**:
- Component doesn't exist yet (TDD - this is expected!)
- Check data-testid spelling
- Use `screen.debug()` to see current DOM
- Wait for async operations with `waitFor()`

---

#### 2. Playwright Browser Won't Start
```
Error: browserType.launch: Executable doesn't exist
```

**Solution**:
```bash
# Install required browser for CI-equivalent local validation
npx playwright install chromium

# Optional: install all configured projects for cross-browser local run
npx playwright install
```

---

#### 3. E2E Test Timeout
```
Test timeout of 30000ms exceeded
```

**Solution**:
- Increase timeout in test:
  ```typescript
  test('slow test', async ({ page }) => {
    test.setTimeout(60000); // 60 seconds
  });
  ```
- Or in config:
  ```typescript
  // playwright.config.ts
  export default defineConfig({
    timeout: 60000,
  });
  ```

---

#### 4. Component Test Fails: Hook Error
```
Error: Invalid hook call
```

**Solution**:
- Wrap component with required providers:
  ```typescript
  import { IntlProvider } from 'next-intl';
  
  render(
    <IntlProvider locale="ar" messages={{}}>
      <MyComponent />
    </IntlProvider>
  );
  ```

---

#### 5. E2E Test: Element Not Visible
```
Error: element is not visible
```

**Solution**:
```typescript
// Wait for element to be visible
await page.waitForSelector('[data-testid="element"]', {
  state: 'visible',
  timeout: 5000
});

// Or use expect with timeout
await expect(page.locator('[data-testid="element"]')).toBeVisible({
  timeout: 5000
});
```

---

#### 6. Mock Not Working
```
Error: fetch is not defined
```

**Solution**:
- Check `vitest.setup.ts` has global mocks
- Mock in test file:
  ```typescript
  import { vi } from 'vitest';
  
  global.fetch = vi.fn();
  ```

---

### Debug Mode

#### Vitest Debug
```bash
# Open browser for debugging
npm run test:ui

# Debug specific test
npm run test -- --reporter=verbose MyComponent.test.tsx

# Run with Node debugger
node --inspect-brk node_modules/.bin/vitest
```

#### Playwright Debug
```bash
# Open Playwright Inspector
npx playwright test --debug

# Debug specific test
npx playwright test quiz-flow.spec.ts --debug

# Headed mode (see browser)
npx playwright test --headed

# Slow motion
npx playwright test --headed --slow-mo=1000
```

#### Screenshot on Failure
```typescript
test('my test', async ({ page }, testInfo) => {
  await page.goto('/');
  
  // Take screenshot on failure
  if (testInfo.status !== 'passed') {
    await page.screenshot({ path: `failure-${testInfo.title}.png` });
  }
});
```

---

## Best Practices

### ✅ Do's
- **TDD**: Write tests before implementation
- **User-centric**: Test from user's perspective
- **Isolation**: Each test should be independent
- **Descriptive**: Clear test names explaining what's tested
- **Data-testid**: Use data-testid for reliable selectors
- **Async/Await**: Always await async operations
- **Clean up**: Remove event listeners, timers
- **Accessibility**: Test with screen readers in mind
- **Mobile**: Test responsive behavior

### ❌ Don'ts
- Don't test implementation details
- Don't use brittle CSS selectors
- Don't write tests dependent on order
- Don't ignore flaky tests
- Don't mock everything
- Don't test third-party libraries
- Don't skip accessibility
- Don't commit .only() or .skip()

---

## Coverage Reports

### Unit Test Coverage

```bash
# Generate coverage
npm run test:coverage

# View in browser
open coverage/index.html
```

### E2E Coverage

```bash
# Run with coverage
npx playwright test --reporter=html

# View report
npx playwright show-report
```

### Coverage Targets

| Phase | Target | Status |
|-------|--------|--------|
| Phase 1 | 50% | 🔄 In Progress |
| Phase 2 | 65% | 📋 Planned |
| Phase 3 | 75% | 📋 Planned |

---

## CI/CD Integration

Tests run automatically via GitHub Actions:
- **Unit Tests**: On every push/PR
- **E2E Tests**: On PR to main/develop

See [.github/workflows/test.yml](../.github/workflows/test.yml)

---

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

**Last Updated**: February 5, 2026  
**Maintained By**: QA Team  
**Questions?**: Open an issue or contact the development team
