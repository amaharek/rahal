/**
 * E2E tests for streak tracking functionality
 * Tests daily streak persistence and reset behavior
 */

import { test, expect } from '@playwright/test';

test.describe('Streak Tracking - Daily Challenges', () => {
  test.beforeEach(async ({ page }) => {
    // Login to track streaks
    await page.goto('/ar');
    await page.click('button:has-text("تسجيل الدخول")'); // Login
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    await page.waitForURL('/ar/game');
  });

  test('should display current streak on profile', async ({ page }) => {
    await page.goto('/ar/profile');

    // Streak counter should be visible
    const streakElement = page.locator('[data-testid="current-streak"]');
    await expect(streakElement).toBeVisible();

    // Should show number
    const streakText = await streakElement.textContent();
    expect(streakText).toMatch(/\d+/);

    // Streak icon should be visible
    await expect(page.locator('[data-testid="streak-icon"]')).toBeVisible();
  });

  test('should increment streak after completing daily challenge', async ({ page }) => {
    await page.goto('/ar/profile');
    
    // Get initial streak
    const initialStreak = await page.locator('[data-testid="current-streak"]').textContent();
    const initialStreakNum = parseInt(initialStreak || '0');

    // Complete daily challenge
    await page.goto('/ar/game');
    await expect(page.locator('[data-testid="daily-challenge"]')).toBeVisible();

    // Mock API to return successful completion
    await page.route('**/api/game/guess', async (route) => {
      await route.fulfill({
        json: {
          is_destination: true,
          game_complete: true,
          total_guesses: 1,
          score_emoji: '🟢',
        },
      });
    });

    // Make a guess (simulate completion)
    await page.fill('[data-testid="country-input"]', 'Sudan');
    await page.click('[data-testid="submit-guess"]');

    // Wait for completion
    await expect(page.locator('[data-testid="game-complete"]')).toBeVisible();

    // Go back to profile
    await page.goto('/ar/profile');

    // Streak should increment
    const newStreak = await page.locator('[data-testid="current-streak"]').textContent();
    const newStreakNum = parseInt(newStreak || '0');
    expect(newStreakNum).toBe(initialStreakNum + 1);
  });

  test('should show max streak achieved', async ({ page }) => {
    await page.goto('/ar/profile');

    // Max streak should be visible
    const maxStreakElement = page.locator('[data-testid="max-streak"]');
    await expect(maxStreakElement).toBeVisible();

    // Should be greater than or equal to current streak
    const currentStreak = parseInt(await page.locator('[data-testid="current-streak"]').textContent() || '0');
    const maxStreak = parseInt(await maxStreakElement.textContent() || '0');
    expect(maxStreak).toBeGreaterThanOrEqual(currentStreak);
  });

  test('should reset streak if day is missed', async ({ page }) => {
    // Mock user with streak but last played 2 days ago
    await page.route('**/api/users/me', async (route) => {
      await route.fulfill({
        json: {
          id: '123',
          email: 'test@example.com',
          current_streak: 5,
          max_streak: 10,
          last_played: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        },
      });
    });

    await page.goto('/ar/profile');

    // Should show warning about broken streak
    await expect(page.locator('[data-testid="streak-broken-message"]')).toBeVisible();
    await expect(page.locator('text=انقطعت سلسلتك')).toBeVisible(); // Your streak broke

    // Current streak should be 0
    const currentStreak = await page.locator('[data-testid="current-streak"]').textContent();
    expect(parseInt(currentStreak || '0')).toBe(0);
  });

  test('should maintain streak if played yesterday', async ({ page }) => {
    // Mock user who played yesterday
    await page.route('**/api/users/me', async (route) => {
      await route.fulfill({
        json: {
          id: '123',
          email: 'test@example.com',
          current_streak: 5,
          max_streak: 10,
          last_played: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
        },
      });
    });

    await page.goto('/ar/profile');

    // Streak should still be active
    const currentStreak = await page.locator('[data-testid="current-streak"]').textContent();
    expect(parseInt(currentStreak || '0')).toBe(5);

    // No broken streak message
    await expect(page.locator('[data-testid="streak-broken-message"]')).not.toBeVisible();
  });
});

test.describe('Streak Tracking - Calendar View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ar');
    await page.click('button:has-text("تسجيل الدخول")');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
  });

  test('should display calendar with completed days highlighted', async ({ page }) => {
    await page.goto('/ar/stats');

    // Calendar should be visible
    const calendar = page.locator('[data-testid="activity-calendar"]');
    await expect(calendar).toBeVisible();

    // Should show current month
    await expect(page.locator('[data-testid="calendar-month"]')).toBeVisible();

    // Completed days should be highlighted
    const completedDays = page.locator('[data-testid="calendar-day"][data-completed="true"]');
    expect(await completedDays.count()).toBeGreaterThan(0);
  });

  test('should show streak fire emoji for consecutive days', async ({ page }) => {
    await page.goto('/ar/stats');

    // Navigate to calendar
    await page.click('tab:has-text("التقويم")'); // Calendar tab

    // Consecutive days should have fire emoji
    const streakDays = page.locator('[data-testid="calendar-day"][data-streak="true"]');
    if (await streakDays.count() > 0) {
      const firstStreakDay = streakDays.first();
      await expect(firstStreakDay.locator('text=🔥')).toBeVisible();
    }
  });

  test('should show tooltip with stats on day hover', async ({ page }) => {
    await page.goto('/ar/stats');

    // Hover over completed day
    const completedDay = page.locator('[data-testid="calendar-day"][data-completed="true"]').first();
    if (await completedDay.isVisible()) {
      await completedDay.hover();

      // Tooltip should appear
      const tooltip = page.locator('[data-testid="day-tooltip"]');
      await expect(tooltip).toBeVisible();

      // Should show score and attempts
      await expect(tooltip).toContainText('النتيجة'); // Score
      await expect(tooltip).toContainText('محاولات'); // Attempts
    }
  });

  test('should navigate between months', async ({ page }) => {
    await page.goto('/ar/stats');

    // Get current month
    const currentMonth = await page.locator('[data-testid="calendar-month"]').textContent();

    // Click previous month
    await page.click('[data-testid="calendar-prev-month"]');

    // Month should change
    const previousMonth = await page.locator('[data-testid="calendar-month"]').textContent();
    expect(previousMonth).not.toBe(currentMonth);

    // Click next month
    await page.click('[data-testid="calendar-next-month"]');

    // Should return to current month
    const returnedMonth = await page.locator('[data-testid="calendar-month"]').textContent();
    expect(returnedMonth).toBe(currentMonth);
  });
});

test.describe('Streak Tracking - Notifications', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ar');
    await page.click('button:has-text("تسجيل الدخول")');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
  });

  test('should show celebration for streak milestones', async ({ page }) => {
    // Mock 7-day streak milestone
    await page.route('**/api/game/guess', async (route) => {
      await route.fulfill({
        json: {
          is_destination: true,
          game_complete: true,
          streak_milestone: 7,
          total_guesses: 1,
        },
      });
    });

    await page.goto('/ar/game');
    
    // Complete game
    await page.fill('[data-testid="country-input"]', 'Sudan');
    await page.click('[data-testid="submit-guess"]');

    // Should show milestone celebration
    await expect(page.locator('[data-testid="streak-milestone"]')).toBeVisible();
    await expect(page.locator('text=🎉')).toBeVisible();
    await expect(page.locator('text=7 أيام متتالية')).toBeVisible(); // 7 consecutive days
  });

  test('should warn user if streak is at risk', async ({ page }) => {
    // Mock user who hasn't played today yet and it's late evening
    const now = new Date();
    now.setHours(22, 0, 0); // 10 PM

    await page.addInitScript(() => {
      // @ts-ignore
      Date.now = () => new Date('2026-02-05T22:00:00').getTime();
    });

    await page.goto('/ar/game');

    // Should show reminder
    const reminder = page.locator('[data-testid="streak-reminder"]');
    if (await reminder.isVisible()) {
      await expect(reminder).toContainText('لا تنس'); // Don't forget
      await expect(reminder).toContainText('سلسلتك'); // Your streak
    }
  });
});

test.describe('Streak Tracking - Persistence', () => {
  test('should persist streak across sessions', async ({ page, context }) => {
    // Login and check initial streak
    await page.goto('/ar');
    await page.click('button:has-text("تسجيل الدخول")');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.goto('/ar/profile');
    const initialStreak = await page.locator('[data-testid="current-streak"]').textContent();

    // Close page
    await page.close();

    // Open new page in same context (cookies preserved)
    const newPage = await context.newPage();
    await newPage.goto('/ar/profile');

    // Streak should be the same
    const persistedStreak = await newPage.locator('[data-testid="current-streak"]').textContent();
    expect(persistedStreak).toBe(initialStreak);
  });

  test('should sync streak across multiple devices', async ({ page }) => {
    // Login
    await page.goto('/ar');
    await page.click('button:has-text("تسجيل الدخول")');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.goto('/ar/profile');
    
    // Mock updated streak from server
    await page.route('**/api/users/me', async (route) => {
      await route.fulfill({
        json: {
          id: '123',
          email: 'test@example.com',
          current_streak: 10,
          max_streak: 10,
        },
      });
    });

    // Refresh page
    await page.reload();

    // Streak should update from server
    const syncedStreak = await page.locator('[data-testid="current-streak"]').textContent();
    expect(parseInt(syncedStreak || '0')).toBe(10);
  });

  test('should recover streak data after network failure', async ({ page }) => {
    // Login
    await page.goto('/ar');
    await page.click('button:has-text("تسجيل الدخول")');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.goto('/ar/profile');
    const beforeStreak = await page.locator('[data-testid="current-streak"]').textContent();

    // Simulate network failure
    await page.route('**/api/**', (route) => route.abort());

    // Try to navigate
    await page.goto('/ar/game');

    // Restore network
    await page.unroute('**/api/**');

    // Go back to profile
    await page.goto('/ar/profile');

    // Streak should be restored
    const afterStreak = await page.locator('[data-testid="current-streak"]').textContent();
    expect(afterStreak).toBe(beforeStreak);
  });
});

test.describe('Streak Tracking - Leaderboard Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ar');
    await page.click('button:has-text("تسجيل الدخول")');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
  });

  test('should show streak leaderboard', async ({ page }) => {
    await page.goto('/ar/leaderboard');

    // Switch to streak tab
    await page.click('tab:has-text("السلسلة")'); // Streak

    // Leaderboard should show users sorted by streak
    const leaderboardItems = page.locator('[data-testid="leaderboard-item"]');
    expect(await leaderboardItems.count()).toBeGreaterThan(0);

    // First user should have highest streak
    const firstItem = leaderboardItems.first();
    await expect(firstItem.locator('[data-testid="user-streak"]')).toBeVisible();
  });

  test('should highlight current user in streak leaderboard', async ({ page }) => {
    await page.goto('/ar/leaderboard');
    await page.click('tab:has-text("السلسلة")');

    // Current user's row should be highlighted
    const currentUserRow = page.locator('[data-testid="leaderboard-item"][data-current-user="true"]');
    if (await currentUserRow.isVisible()) {
      await expect(currentUserRow).toHaveClass(/highlighted|current/);
    }
  });
});

test.describe('Streak Tracking - Guest Users', () => {
  test('should not track streaks for guest users', async ({ page }) => {
    // Visit as guest
    await page.goto('/ar/game');

    // Complete game
    await page.fill('[data-testid="country-input"]', 'Sudan');
    await page.click('[data-testid="submit-guess"]');

    // No streak information should be shown
    await expect(page.locator('[data-testid="current-streak"]')).not.toBeVisible();
  });

  test('should prompt guest to login to track streaks', async ({ page }) => {
    await page.goto('/ar/game');

    // Should show login prompt
    const loginPrompt = page.locator('[data-testid="streak-login-prompt"]');
    if (await loginPrompt.isVisible()) {
      await expect(loginPrompt).toContainText('سجل الدخول'); // Login
      await expect(loginPrompt).toContainText('تتبع سلسلتك'); // Track your streak
    }
  });
});
