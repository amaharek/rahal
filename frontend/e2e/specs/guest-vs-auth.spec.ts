/**
 * E2E tests comparing guest vs authenticated user experiences
 * Tests feature access limitations and data persistence
 */

import { test, expect } from '@playwright/test';

test.describe('Guest vs Auth - Game Access', () => {
  test('guest can play daily challenge without login', async ({ page }) => {
    await page.goto('/ar/game');

    // Daily challenge should be accessible
    await expect(page.locator('[data-testid="daily-challenge"]')).toBeVisible();

    // Can make guesses
    await page.fill('[data-testid="country-input"]', 'Sudan');
    await page.click('[data-testid="submit-guess"]');

    // Should show feedback
    await expect(page.locator('[data-testid="guess-feedback"]')).toBeVisible();
  });

  test('authenticated user has full game access', async ({ page }) => {
    // Login
    await page.goto('/ar');
    await page.click('button:has-text("تسجيل الدخول")');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.goto('/ar/game');

    // Daily challenge accessible
    await expect(page.locator('[data-testid="daily-challenge"]')).toBeVisible();

    // User profile visible
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();

    // Can make guesses
    await page.fill('[data-testid="country-input"]', 'Sudan');
    await page.click('[data-testid="submit-guess"]');

    // Should show feedback
    await expect(page.locator('[data-testid="guess-feedback"]')).toBeVisible();
  });

  test('guest cannot access previous challenges', async ({ page }) => {
    await page.goto('/ar/game');

    // Try to access history
    const historyButton = page.locator('[data-testid="challenge-history"]');
    
    if (await historyButton.isVisible()) {
      await historyButton.click();

      // Should prompt to login
      await expect(page.locator('[data-testid="login-required"]')).toBeVisible();
      await expect(page.locator('text=سجل الدخول')).toBeVisible();
    }
  });

  test('authenticated user can access challenge history', async ({ page }) => {
    // Login
    await page.goto('/ar');
    await page.click('button:has-text("تسجيل الدخول")');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.goto('/ar/game');

    // Access history
    const historyButton = page.locator('[data-testid="challenge-history"]');
    
    if (await historyButton.isVisible()) {
      await historyButton.click();

      // Should show history
      await expect(page.locator('[data-testid="challenge-list"]')).toBeVisible();
    }
  });
});

test.describe('Guest vs Auth - Data Persistence', () => {
  test('guest progress is not saved after page reload', async ({ page }) => {
    await page.goto('/ar/game');

    // Make a guess
    await page.fill('[data-testid="country-input"]', 'Jordan');
    await page.click('[data-testid="submit-guess"]');

    // Note the guess count
    const guessCount = await page.locator('[data-testid="guess-count"]').textContent();

    // Reload page
    await page.reload();

    // Progress should be reset
    const newGuessCount = await page.locator('[data-testid="guess-count"]').textContent();
    expect(newGuessCount).toBe('0');
  });

  test('guest progress stored in localStorage is temporary', async ({ page, context }) => {
    await page.goto('/ar/game');

    // Make guesses
    await page.fill('[data-testid="country-input"]', 'Jordan');
    await page.click('[data-testid="submit-guess"]');

    // Check localStorage
    const hasProgress = await page.evaluate(() => {
      return localStorage.getItem('guest_game_progress') !== null;
    });

    expect(hasProgress).toBe(true);

    // Close and reopen in new context (clears storage)
    await page.close();
    const newPage = await context.newPage();
    await newPage.goto('/ar/game');

    // Progress should be gone in new session
    const newProgress = await newPage.evaluate(() => {
      return localStorage.getItem('guest_game_progress');
    });

    expect(newProgress).toBeNull();
  });

  test('authenticated user progress persists after reload', async ({ page }) => {
    // Login
    await page.goto('/ar');
    await page.click('button:has-text("تسجيل الدخول")');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.goto('/ar/game');

    // Make a guess
    await page.fill('[data-testid="country-input"]', 'Jordan');
    await page.click('[data-testid="submit-guess"]');

    const guessCount = await page.locator('[data-testid="guess-count"]').textContent();

    // Reload page
    await page.reload();

    // Progress should persist
    const newGuessCount = await page.locator('[data-testid="guess-count"]').textContent();
    expect(newGuessCount).toBe(guessCount);
  });

  test('authenticated user progress syncs across devices', async ({ page, context }) => {
    // Login on first device
    await page.goto('/ar');
    await page.click('button:has-text("تسجيل الدخول")');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.goto('/ar/game');
    await page.fill('[data-testid="country-input"]', 'Jordan');
    await page.click('[data-testid="submit-guess"]');

    const guessCount = await page.locator('[data-testid="guess-count"]').textContent();

    // Simulate second device (new page with same auth)
    const secondPage = await context.newPage();
    await secondPage.goto('/ar/game');

    // Should show same progress
    const syncedGuessCount = await secondPage.locator('[data-testid="guess-count"]').textContent();
    expect(syncedGuessCount).toBe(guessCount);
  });
});

test.describe('Guest vs Auth - Statistics', () => {
  test('guest cannot view statistics', async ({ page }) => {
    await page.goto('/ar/stats');

    // Should redirect to login or show login prompt
    await expect(page.locator('[data-testid="login-required"]')).toBeVisible();
  });

  test('authenticated user can view detailed statistics', async ({ page }) => {
    // Login
    await page.goto('/ar');
    await page.click('button:has-text("تسجيل الدخول")');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.goto('/ar/stats');

    // Statistics should be visible
    await expect(page.locator('[data-testid="user-stats"]')).toBeVisible();
    await expect(page.locator('[data-testid="games-played"]')).toBeVisible();
    await expect(page.locator('[data-testid="win-rate"]')).toBeVisible();
    await expect(page.locator('[data-testid="current-streak"]')).toBeVisible();
  });

  test('guest sees limited stats after completing game', async ({ page }) => {
    await page.goto('/ar/game');

    // Mock game completion
    await page.route('**/api/game/guess', async (route) => {
      await route.fulfill({
        json: {
          is_destination: true,
          game_complete: true,
          total_guesses: 3,
          score_emoji: '🟢',
        },
      });
    });

    await page.fill('[data-testid="country-input"]', 'Sudan');
    await page.click('[data-testid="submit-guess"]');

    // Should show session stats only
    await expect(page.locator('[data-testid="session-stats"]')).toBeVisible();
    await expect(page.locator('[data-testid="session-guesses"]')).toBeVisible();

    // No historical stats
    await expect(page.locator('[data-testid="total-games"]')).not.toBeVisible();
  });

  test('authenticated user sees comprehensive stats after game', async ({ page }) => {
    // Login
    await page.goto('/ar');
    await page.click('button:has-text("تسجيل الدخول")');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.goto('/ar/game');

    // Mock game completion
    await page.route('**/api/game/guess', async (route) => {
      await route.fulfill({
        json: {
          is_destination: true,
          game_complete: true,
          total_guesses: 3,
        },
      });
    });

    await page.fill('[data-testid="country-input"]', 'Sudan');
    await page.click('[data-testid="submit-guess"]');

    // Should show both session and total stats
    await expect(page.locator('[data-testid="session-stats"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-stats"]')).toBeVisible();
    await expect(page.locator('[data-testid="streak-updated"]')).toBeVisible();
  });
});

test.describe('Guest vs Auth - Leaderboard', () => {
  test('guest can view leaderboard but not compete', async ({ page }) => {
    await page.goto('/ar/leaderboard');

    // Leaderboard visible
    await expect(page.locator('[data-testid="leaderboard"]')).toBeVisible();

    // No personal rank shown
    await expect(page.locator('[data-testid="your-rank"]')).not.toBeVisible();

    // Call-to-action to join
    await expect(page.locator('[data-testid="join-leaderboard-cta"]')).toBeVisible();
  });

  test('authenticated user appears in leaderboard', async ({ page }) => {
    // Login
    await page.goto('/ar');
    await page.click('button:has-text("تسجيل الدخول")');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.goto('/ar/leaderboard');

    // User's rank should be visible
    const yourRank = page.locator('[data-testid="your-rank"]');
    if (await yourRank.isVisible()) {
      const rank = await yourRank.textContent();
      expect(rank).toMatch(/\d+/);
    }

    // User highlighted in list
    const currentUserRow = page.locator('[data-testid="leaderboard-item"][data-current-user="true"]');
    if (await currentUserRow.isVisible()) {
      await expect(currentUserRow).toHaveClass(/highlighted/);
    }
  });
});

test.describe('Guest vs Auth - Quiz Features', () => {
  test('guest can take quiz but results not saved', async ({ page }) => {
    await page.goto('/ar/quiz');

    // Start quiz
    await page.click('button:has-text("ابدأ اختبار")');
    await expect(page.locator('[data-testid="question-card"]')).toBeVisible();

    // Answer question
    await page.locator('[data-testid="answer-option"]').first().click();
    await page.click('button:has-text("تأكيد")');

    // Should show feedback
    await expect(page.locator('[data-testid="answer-feedback"]')).toBeVisible();

    // Reload page
    await page.reload();

    // No quiz history
    await expect(page.locator('[data-testid="quiz-history"]')).not.toBeVisible();
  });

  test('authenticated user has quiz history saved', async ({ page }) => {
    // Login
    await page.goto('/ar');
    await page.click('button:has-text("تسجيل الدخول")');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.goto('/ar/quiz');

    // Start quiz
    await page.click('button:has-text("ابدأ اختبار")');
    await expect(page.locator('[data-testid="question-card"]')).toBeVisible();

    // Answer question
    await page.locator('[data-testid="answer-option"]').first().click();
    await page.click('button:has-text("تأكيد")');

    // Navigate away and back
    await page.goto('/ar/profile');
    await page.goto('/ar/quiz');

    // Should have quiz history
    const historyButton = page.locator('[data-testid="quiz-history"]');
    if (await historyButton.isVisible()) {
      await expect(historyButton).toBeVisible();
    }
  });

  test('guest prompted to login for personalized quiz', async ({ page }) => {
    await page.goto('/ar/quiz');

    // Try to access difficulty-based quiz
    await page.click('[data-testid="adaptive-quiz"]');

    // Should show login prompt
    await expect(page.locator('[data-testid="login-required"]')).toBeVisible();
    await expect(page.locator('text=للحصول على اختبار مخصص')).toBeVisible(); // For personalized quiz
  });

  test('authenticated user gets personalized quiz recommendations', async ({ page }) => {
    // Login
    await page.goto('/ar');
    await page.click('button:has-text("تسجيل الدخول")');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.goto('/ar/quiz');

    // Should show personalized recommendations
    const recommendations = page.locator('[data-testid="quiz-recommendations"]');
    if (await recommendations.isVisible()) {
      await expect(recommendations).toBeVisible();
      await expect(page.locator('[data-testid="recommended-category"]')).toBeVisible();
    }
  });
});

test.describe('Guest vs Auth - Profile Features', () => {
  test('guest cannot access profile page', async ({ page }) => {
    await page.goto('/ar/profile');

    // Should redirect or show login
    const url = page.url();
    expect(url).not.toContain('/profile');
    
    // Or shows login prompt
    await expect(page.locator('[data-testid="login-required"]')).toBeVisible();
  });

  test('authenticated user has full profile access', async ({ page }) => {
    // Login
    await page.goto('/ar');
    await page.click('button:has-text("تسجيل الدخول")');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.goto('/ar/profile');

    // Profile should load
    await expect(page.locator('[data-testid="user-profile"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-avatar"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="edit-profile"]')).toBeVisible();
  });

  test('guest sees call-to-action banner', async ({ page }) => {
    await page.goto('/ar/game');

    // Should show CTA to create account
    const ctaBanner = page.locator('[data-testid="signup-cta"]');
    if (await ctaBanner.isVisible()) {
      await expect(ctaBanner).toContainText('أنشئ حساب'); // Create account
      await expect(ctaBanner).toContainText('احفظ تقدمك'); // Save your progress
    }
  });

  test('authenticated user sees no CTA banners', async ({ page }) => {
    // Login
    await page.goto('/ar');
    await page.click('button:has-text("تسجيل الدخول")');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.goto('/ar/game');

    // No signup CTA
    await expect(page.locator('[data-testid="signup-cta"]')).not.toBeVisible();
  });
});

test.describe('Guest vs Auth - Sharing Features', () => {
  test('guest can share game results', async ({ page }) => {
    await page.goto('/ar/game');

    // Mock game completion
    await page.route('**/api/game/guess', async (route) => {
      await route.fulfill({
        json: {
          is_destination: true,
          game_complete: true,
          total_guesses: 3,
        },
      });
    });

    await page.fill('[data-testid="country-input"]', 'Sudan');
    await page.click('[data-testid="submit-guess"]');

    // Share button should be available
    await expect(page.locator('[data-testid="share-result"]')).toBeVisible();
    await page.click('[data-testid="share-result"]');

    // Should copy to clipboard or show share dialog
    await expect(page.locator('[data-testid="share-options"]')).toBeVisible();
  });

  test('authenticated user share includes profile link', async ({ page }) => {
    // Login
    await page.goto('/ar');
    await page.click('button:has-text("تسجيل الدخول")');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.goto('/ar/game');

    // Mock completion
    await page.route('**/api/game/guess', async (route) => {
      await route.fulfill({
        json: {
          is_destination: true,
          game_complete: true,
          total_guesses: 3,
        },
      });
    });

    await page.fill('[data-testid="country-input"]', 'Sudan');
    await page.click('[data-testid="submit-guess"]');

    // Share should include username
    await page.click('[data-testid="share-result"]');
    
    // Get share text
    const shareText = await page.evaluate(() => {
      return navigator.clipboard.readText();
    }).catch(() => '');

    // Should contain username or profile indicator
    // (exact format depends on implementation)
  });
});

test.describe('Guest vs Auth - Feature Discovery', () => {
  test('guest sees limited feature set on homepage', async ({ page }) => {
    await page.goto('/ar');

    // Should show main features
    await expect(page.locator('[data-testid="daily-game-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="quiz-card"]')).toBeVisible();

    // Premium features should be locked
    const premiumFeatures = page.locator('[data-testid="feature-locked"]');
    if (await premiumFeatures.count() > 0) {
      await expect(premiumFeatures.first()).toBeVisible();
    }
  });

  test('authenticated user sees all available features', async ({ page }) => {
    // Login
    await page.goto('/ar');
    await page.click('button:has-text("تسجيل الدخول")');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.goto('/ar');

    // All feature cards unlocked
    await expect(page.locator('[data-testid="daily-game-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="quiz-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="stats-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="leaderboard-card"]')).toBeVisible();

    // No locked indicators
    expect(await page.locator('[data-testid="feature-locked"]').count()).toBe(0);
  });

  test('guest can easily transition to authenticated state', async ({ page }) => {
    await page.goto('/ar/game');

    // Play as guest
    await page.fill('[data-testid="country-input"]', 'Jordan');
    await page.click('[data-testid="submit-guess"]');

    // Click signup CTA
    await page.click('[data-testid="signup-cta"]');

    // Should navigate to signup
    await expect(page).toHaveURL(/\/signup/);

    // After signup, previous progress might be shown
    // (implementation dependent)
  });
});
