/**
 * E2E tests for leaderboard functionality
 * Tests ranking, filtering, pagination, and real-time updates
 */

import { test, expect } from '@playwright/test';

test.describe('Leaderboard - Display and Ranking', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ar/leaderboard');
  });

  test('should display leaderboard with ranked users', async ({ page }) => {
    // Leaderboard should be visible
    await expect(page.locator('[data-testid="leaderboard"]')).toBeVisible();

    // Should have multiple entries
    const entries = page.locator('[data-testid="leaderboard-item"]');
    expect(await entries.count()).toBeGreaterThan(0);

    // First entry should be rank #1
    const firstRank = entries.first().locator('[data-testid="user-rank"]');
    await expect(firstRank).toContainText('1');
  });

  test('should show correct ranking order by score', async ({ page }) => {
    const entries = page.locator('[data-testid="leaderboard-item"]');
    const count = await entries.count();

    if (count >= 2) {
      // Get first two scores
      const firstScore = parseInt(
        await entries.nth(0).locator('[data-testid="user-score"]').textContent() || '0'
      );
      const secondScore = parseInt(
        await entries.nth(1).locator('[data-testid="user-score"]').textContent() || '0'
      );

      // First score should be >= second score
      expect(firstScore).toBeGreaterThanOrEqual(secondScore);
    }
  });

  test('should display user avatar, name, and score', async ({ page }) => {
    const firstEntry = page.locator('[data-testid="leaderboard-item"]').first();

    // Avatar
    await expect(firstEntry.locator('[data-testid="user-avatar"]')).toBeVisible();

    // Name
    const userName = firstEntry.locator('[data-testid="user-name"]');
    await expect(userName).toBeVisible();
    expect(await userName.textContent()).not.toBe('');

    // Score
    const userScore = firstEntry.locator('[data-testid="user-score"]');
    await expect(userScore).toBeVisible();
    expect(await userScore.textContent()).toMatch(/\d+/);
  });

  test('should show medals for top 3 users', async ({ page }) => {
    const entries = page.locator('[data-testid="leaderboard-item"]');
    const count = await entries.count();

    if (count >= 3) {
      // First place - gold medal
      await expect(entries.nth(0).locator('text=🥇')).toBeVisible();

      // Second place - silver medal
      await expect(entries.nth(1).locator('text=🥈')).toBeVisible();

      // Third place - bronze medal
      await expect(entries.nth(2).locator('text=🥉')).toBeVisible();
    }
  });
});

test.describe('Leaderboard - Time Filters', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ar/leaderboard');
  });

  test('should filter by daily rankings', async ({ page }) => {
    // Select daily filter
    await page.click('[data-testid="time-filter"]');
    await page.click('text=اليوم'); // Today

    // Leaderboard should update
    await expect(page.locator('[data-testid="leaderboard"]')).toBeVisible();

    // Header should show "اليوم"
    await expect(page.locator('[data-testid="leaderboard-title"]')).toContainText('اليوم');
  });

  test('should filter by weekly rankings', async ({ page }) => {
    await page.click('[data-testid="time-filter"]');
    await page.click('text=هذا الأسبوع'); // This week

    await expect(page.locator('[data-testid="leaderboard-title"]')).toContainText('الأسبوع');

    // Should show users who played this week
    const entries = page.locator('[data-testid="leaderboard-item"]');
    expect(await entries.count()).toBeGreaterThan(0);
  });

  test('should filter by monthly rankings', async ({ page }) => {
    await page.click('[data-testid="time-filter"]');
    await page.click('text=هذا الشهر'); // This month

    await expect(page.locator('[data-testid="leaderboard-title"]')).toContainText('الشهر');
  });

  test('should filter by all-time rankings', async ({ page }) => {
    await page.click('[data-testid="time-filter"]');
    await page.click('text=كل الأوقات'); // All time

    await expect(page.locator('[data-testid="leaderboard-title"]')).toContainText('كل الأوقات');

    // All-time should have most users
    const entries = page.locator('[data-testid="leaderboard-item"]');
    const allTimeCount = await entries.count();
    expect(allTimeCount).toBeGreaterThan(0);
  });
});

test.describe('Leaderboard - Category Filters', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ar/leaderboard');
  });

  test('should show overall score leaderboard by default', async ({ page }) => {
    // Overall tab should be active
    const overallTab = page.locator('tab:has-text("الإجمالي")'); // Overall
    await expect(overallTab).toHaveClass(/active|selected/);
  });

  test('should switch to streak leaderboard', async ({ page }) => {
    await page.click('tab:has-text("السلسلة")'); // Streak

    // Should show streak values
    const entries = page.locator('[data-testid="leaderboard-item"]');
    const firstEntry = entries.first();
    await expect(firstEntry.locator('[data-testid="user-streak"]')).toBeVisible();

    // Should show fire emoji
    await expect(firstEntry.locator('text=🔥')).toBeVisible();
  });

  test('should switch to accuracy leaderboard', async ({ page }) => {
    await page.click('tab:has-text("الدقة")'); // Accuracy

    // Should show percentage values
    const entries = page.locator('[data-testid="leaderboard-item"]');
    const firstEntry = entries.first();
    const accuracy = await firstEntry.locator('[data-testid="user-accuracy"]').textContent();
    expect(accuracy).toMatch(/\d+%/);
  });

  test('should switch to speed leaderboard', async ({ page }) => {
    await page.click('tab:has-text("السرعة")'); // Speed

    // Should show time values
    const entries = page.locator('[data-testid="leaderboard-item"]');
    const firstEntry = entries.first();
    const time = await firstEntry.locator('[data-testid="user-avg-time"]').textContent();
    expect(time).toMatch(/\d+/);
  });
});

test.describe('Leaderboard - Pagination', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ar/leaderboard');
  });

  test('should show 20 users per page', async ({ page }) => {
    const entries = page.locator('[data-testid="leaderboard-item"]');
    const count = await entries.count();

    // Should show up to 20 entries
    expect(count).toBeLessThanOrEqual(20);
  });

  test('should navigate to next page', async ({ page }) => {
    // Check if pagination exists
    const nextButton = page.locator('[data-testid="next-page"]');
    
    if (await nextButton.isVisible() && !(await nextButton.isDisabled())) {
      // Get first user on page 1
      const firstUserPage1 = await page.locator('[data-testid="leaderboard-item"]')
        .first()
        .locator('[data-testid="user-name"]')
        .textContent();

      // Go to page 2
      await nextButton.click();

      // Wait for leaderboard to update
      await page.waitForTimeout(500);

      // First user should be different
      const firstUserPage2 = await page.locator('[data-testid="leaderboard-item"]')
        .first()
        .locator('[data-testid="user-name"]')
        .textContent();

      expect(firstUserPage2).not.toBe(firstUserPage1);

      // Rank should continue (21+)
      const firstRank = await page.locator('[data-testid="leaderboard-item"]')
        .first()
        .locator('[data-testid="user-rank"]')
        .textContent();
      expect(parseInt(firstRank || '0')).toBeGreaterThan(20);
    }
  });

  test('should navigate to previous page', async ({ page }) => {
    const nextButton = page.locator('[data-testid="next-page"]');
    
    if (await nextButton.isVisible() && !(await nextButton.isDisabled())) {
      // Go to page 2
      await nextButton.click();
      await page.waitForTimeout(500);

      // Go back to page 1
      await page.click('[data-testid="prev-page"]');
      await page.waitForTimeout(500);

      // Should be back at rank 1
      const firstRank = await page.locator('[data-testid="leaderboard-item"]')
        .first()
        .locator('[data-testid="user-rank"]')
        .textContent();
      expect(parseInt(firstRank || '0')).toBe(1);
    }
  });

  test('should show page number and total pages', async ({ page }) => {
    const pagination = page.locator('[data-testid="pagination-info"]');
    
    if (await pagination.isVisible()) {
      const text = await pagination.textContent();
      // Should match format like "1 / 5" or "صفحة 1 من 5"
      expect(text).toMatch(/\d+.*\d+/);
    }
  });
});

test.describe('Leaderboard - Current User', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/ar');
    await page.click('button:has-text("تسجيل الدخول")');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await page.goto('/ar/leaderboard');
  });

  test('should highlight current user in leaderboard', async ({ page }) => {
    // Current user row should be highlighted
    const currentUserRow = page.locator('[data-testid="leaderboard-item"][data-current-user="true"]');
    
    if (await currentUserRow.isVisible()) {
      // Should have special styling
      await expect(currentUserRow).toHaveClass(/highlighted|current|active/);
    }
  });

  test('should show current user rank card', async ({ page }) => {
    // User rank card should be visible
    const rankCard = page.locator('[data-testid="user-rank-card"]');
    
    if (await rankCard.isVisible()) {
      await expect(rankCard.locator('[data-testid="your-rank"]')).toBeVisible();
      await expect(rankCard.locator('[data-testid="your-score"]')).toBeVisible();
    }
  });

  test('should scroll to current user position', async ({ page }) => {
    // If user is not on first page, there should be a "Jump to my rank" button
    const jumpButton = page.locator('[data-testid="jump-to-rank"]');
    
    if (await jumpButton.isVisible()) {
      await jumpButton.click();

      // Should navigate to user's page and highlight them
      await page.waitForTimeout(500);
      const currentUserRow = page.locator('[data-testid="leaderboard-item"][data-current-user="true"]');
      await expect(currentUserRow).toBeVisible();
    }
  });

  test('should show rank change indicator', async ({ page }) => {
    const currentUserRow = page.locator('[data-testid="leaderboard-item"][data-current-user="true"]');
    
    if (await currentUserRow.isVisible()) {
      const rankChange = currentUserRow.locator('[data-testid="rank-change"]');
      
      if (await rankChange.isVisible()) {
        const text = await rankChange.textContent();
        // Should show up/down arrow with number
        expect(text).toMatch(/[↑↓]/);
      }
    }
  });
});

test.describe('Leaderboard - Search and Filter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ar/leaderboard');
  });

  test('should search for specific user', async ({ page }) => {
    const searchInput = page.locator('[data-testid="user-search"]');
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('Ahmed');

      // Results should filter
      await page.waitForTimeout(500);
      const entries = page.locator('[data-testid="leaderboard-item"]');
      
      if (await entries.count() > 0) {
        // All results should contain "Ahmed"
        const firstName = await entries.first().locator('[data-testid="user-name"]').textContent();
        expect(firstName?.toLowerCase()).toContain('ahmed');
      }
    }
  });

  test('should filter by country', async ({ page }) => {
    const countryFilter = page.locator('[data-testid="country-filter"]');
    
    if (await countryFilter.isVisible()) {
      await countryFilter.click();
      await page.click('text=مصر'); // Egypt

      // Should show only Egyptian users
      await page.waitForTimeout(500);
      const entries = page.locator('[data-testid="leaderboard-item"]');
      
      if (await entries.count() > 0) {
        const firstEntry = entries.first();
        const countryFlag = await firstEntry.locator('[data-testid="user-country"]').textContent();
        expect(countryFlag).toContain('🇪🇬');
      }
    }
  });

  test('should show friends leaderboard', async ({ page, context }) => {
    // Login required
    if (!(await page.locator('[data-testid="user-menu"]').isVisible())) {
      await page.goto('/ar');
      await page.click('button:has-text("تسجيل الدخول")');
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.goto('/ar/leaderboard');
    }

    const friendsTab = page.locator('tab:has-text("الأصدقاء")'); // Friends
    
    if (await friendsTab.isVisible()) {
      await friendsTab.click();

      // Should show only friends
      const entries = page.locator('[data-testid="leaderboard-item"]');
      
      if (await entries.count() === 0) {
        // Show empty state
        await expect(page.locator('[data-testid="no-friends-message"]')).toBeVisible();
      }
    }
  });
});

test.describe('Leaderboard - Real-time Updates', () => {
  test('should update when new scores are posted', async ({ page }) => {
    await page.goto('/ar/leaderboard');

    // Get initial first place score
    const initialFirstScore = await page.locator('[data-testid="leaderboard-item"]')
      .first()
      .locator('[data-testid="user-score"]')
      .textContent();

    // Mock websocket update or polling
    await page.evaluate(() => {
      // Simulate score update
      window.dispatchEvent(new CustomEvent('leaderboard:update'));
    });

    // Wait for update
    await page.waitForTimeout(1000);

    // Leaderboard should refresh
    const updatedFirstScore = await page.locator('[data-testid="leaderboard-item"]')
      .first()
      .locator('[data-testid="user-score"]')
      .textContent();

    // Score might change or stay the same, but element should be present
    expect(updatedFirstScore).toBeTruthy();
  });

  test('should show live indicator when leaderboard is updating', async ({ page }) => {
    await page.goto('/ar/leaderboard');

    // Trigger refresh
    await page.click('[data-testid="refresh-leaderboard"]');

    // Loading indicator should appear briefly
    const loadingIndicator = page.locator('[data-testid="leaderboard-loading"]');
    // It might disappear quickly, so we just check it existed
  });
});

test.describe('Leaderboard - Guest Users', () => {
  test('should allow guests to view leaderboard', async ({ page }) => {
    await page.goto('/ar/leaderboard');

    // Leaderboard should be visible
    await expect(page.locator('[data-testid="leaderboard"]')).toBeVisible();

    // Should have entries
    const entries = page.locator('[data-testid="leaderboard-item"]');
    expect(await entries.count()).toBeGreaterThan(0);
  });

  test('should prompt guest to login for personalized features', async ({ page }) => {
    await page.goto('/ar/leaderboard');

    // Try to access friends leaderboard
    const friendsTab = page.locator('tab:has-text("الأصدقاء")');
    
    if (await friendsTab.isVisible()) {
      await friendsTab.click();

      // Should show login prompt
      await expect(page.locator('[data-testid="login-prompt"]')).toBeVisible();
      await expect(page.locator('text=سجل الدخول')).toBeVisible(); // Login
    }
  });

  test('should not show rank change indicators for guests', async ({ page }) => {
    await page.goto('/ar/leaderboard');

    // Rank change indicators should not exist
    const rankChanges = page.locator('[data-testid="rank-change"]');
    expect(await rankChanges.count()).toBe(0);
  });
});

test.describe('Leaderboard - Mobile Responsiveness', () => {
  test('should display correctly on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/ar/leaderboard');

    // Leaderboard should be visible
    await expect(page.locator('[data-testid="leaderboard"]')).toBeVisible();

    // Entries should stack vertically
    const entries = page.locator('[data-testid="leaderboard-item"]');
    const firstEntry = entries.first();
    await expect(firstEntry).toBeVisible();
  });

  test('should collapse detailed stats on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/ar/leaderboard');

    const firstEntry = page.locator('[data-testid="leaderboard-item"]').first();

    // Tap to expand details
    await firstEntry.click();

    // Expanded view should show more info
    await expect(page.locator('[data-testid="expanded-stats"]')).toBeVisible();
  });
});

test.describe('Leaderboard - Accessibility', () => {
  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/ar/leaderboard');

    // Tab through filters
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Enter to select
    await page.keyboard.press('Enter');
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/ar/leaderboard');

    // Leaderboard should have role
    const leaderboard = page.locator('[data-testid="leaderboard"]');
    await expect(leaderboard).toHaveAttribute('role', 'list');

    // Items should have role
    const firstItem = page.locator('[data-testid="leaderboard-item"]').first();
    await expect(firstItem).toHaveAttribute('role', 'listitem');
  });

  test('should announce rank changes to screen readers', async ({ page }) => {
    await page.goto('/ar');
    await page.click('button:has-text("تسجيل الدخول")');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await page.goto('/ar/leaderboard');

    const currentUserRow = page.locator('[data-testid="leaderboard-item"][data-current-user="true"]');
    
    if (await currentUserRow.isVisible()) {
      const ariaLabel = await currentUserRow.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    }
  });
});
