import { test, expect } from '@playwright/test';
import { GamePage } from '../pages/game.page';
import {
  setupGameMocks,
  setupGuessMock,
  setupDynamicGuessMock,
  setupApiErrorMock,
} from '../utils/api-mocks';
import mockChallenge from '../fixtures/mock-challenge.json';

test.describe('Game Flow', () => {
  let gamePage: GamePage;

  test.beforeEach(async ({ page }) => {
    gamePage = new GamePage(page);
    await setupGameMocks(page);
    await setupDynamicGuessMock(page);
  });

  test('should display daily challenge with start and end countries', async ({ page }) => {
    await gamePage.goto();
    await gamePage.waitForLoad();

    // Verify start country is displayed
    await expect(gamePage.startCountryFlag).toBeVisible();
    const startFlagText = await gamePage.startCountryFlag.textContent();
    expect(startFlagText).toContain(mockChallenge.start_country.flag_emoji);

    // Verify end country is displayed
    await expect(gamePage.endCountryFlag).toBeVisible();
    const endFlagText = await gamePage.endCountryFlag.textContent();
    expect(endFlagText).toContain(mockChallenge.end_country.flag_emoji);
  });

  test('should show shortest path count', async ({ page }) => {
    await gamePage.goto();
    await gamePage.waitForLoad();

    // Verify shortest path info is displayed
    const pageContent = await page.content();
    expect(pageContent).toContain(String(mockChallenge.shortest_path));
  });

  test('should submit a valid country guess', async ({ page }) => {
    await gamePage.goto();
    await gamePage.waitForLoad();

    // Initial guess count should be 0
    const initialCount = await gamePage.getGuessCount();
    expect(initialCount).toBe(0);

    // Submit a guess
    await gamePage.searchCountry('الأردن');

    // Wait for autocomplete suggestions
    await page.waitForTimeout(400);

    // Check for suggestions and select
    const suggestions = page.locator('[role="option"], [class*="suggestion"]');
    const count = await suggestions.count();

    if (count > 0) {
      await suggestions.first().click();

      // Wait for guess to be processed
      await page.waitForTimeout(500);

      // Verify guess was added
      const newCount = await gamePage.getGuessCount();
      expect(newCount).toBe(1);
    }
  });

  test('should update competitive HUD on combo increase then reset', async ({ page }) => {
    await gamePage.goto();
    await gamePage.waitForLoad();

    await expect(gamePage.hud).toBeVisible();

    // Positive guess (on optimal path) should increase combo.
    await gamePage.searchCountry('الأردن');
    await page.waitForTimeout(400);
    const firstSuggestions = page.locator('[role="option"], [class*="suggestion"]');
    if (await firstSuggestions.count() > 0) {
      await firstSuggestions.first().click();
    }

    await expect(gamePage.hudCombo).toContainText('x1');
    await expect(gamePage.hudMomentum).toBeVisible();

    // Off-path guess should reset combo.
    await gamePage.searchCountry('الولايات المتحدة');
    await page.waitForTimeout(400);
    const secondSuggestions = page.locator('[role="option"], [class*="suggestion"]');
    if (await secondSuggestions.count() > 0) {
      await secondSuggestions.first().click();
    }

    await expect(gamePage.hudCombo).toContainText('x0');
    await expect(gamePage.hudBenchmark).toBeVisible();
  });

  test('should complete game when reaching destination', async ({ page }) => {
    // Override to complete game immediately
    await setupGuessMock(page, { scoreEmoji: '🟢', gameComplete: true });

    await gamePage.goto();
    await gamePage.waitForLoad();

    // Submit the destination country
    await gamePage.searchCountry('مصر');
    await page.waitForTimeout(400);

    const suggestions = page.locator('[role="option"], [class*="suggestion"]');
    if (await suggestions.count() > 0) {
      await suggestions.first().click();

      // Wait for completion
      await page.waitForTimeout(1000);

      // Check for completion indicators
      const completionText = await page.textContent('body');
      // Game should show completion state
      expect(completionText).toMatch(/🎉|تهانينا|أحسنت|مشاركة/);
    }
  });

  test('should display completion screen with score', async ({ page }) => {
    await setupGuessMock(page, { scoreEmoji: '🟢', gameComplete: true });

    await gamePage.goto();
    await gamePage.waitForLoad();

    // Submit winning guess
    await gamePage.searchCountry('مصر');
    await page.waitForTimeout(400);

    const suggestions = page.locator('[role="option"], [class*="suggestion"]');
    if (await suggestions.count() > 0) {
      await suggestions.first().click();
      await expect(gamePage.completionCard).toBeVisible();
      await expect(gamePage.scoreDisplay).toBeVisible();
    }
  });

  test('should show completion grade and retry CTA to practice route', async ({ page }) => {
    await setupGuessMock(page, { scoreEmoji: '🟢', gameComplete: true });

    await gamePage.goto();
    await gamePage.waitForLoad();

    await gamePage.searchCountry('مصر');
    await page.waitForTimeout(400);

    const suggestions = page.locator('[role="option"], [class*="suggestion"]');
    if (await suggestions.count() > 0) {
      await suggestions.first().click();
      await expect(gamePage.completionCard).toBeVisible();
      await expect(gamePage.completionGrade).toBeVisible();
      await expect(gamePage.retryCta).toBeVisible();
      await gamePage.retryCta.click();
      await expect(page).toHaveURL(/\/ar\/game\/practice\?/);
    }
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Setup error mock
    await setupApiErrorMock(page, '/api/game/daily', 500);

    await gamePage.goto();

    // Wait for error state
    await page.waitForTimeout(2000);

    // Should show error message or retry option
    const hasError = await gamePage.errorMessage.isVisible().catch(() => false);
    const hasRetry = await gamePage.retryButton.isVisible().catch(() => false);

    expect(hasError || hasRetry).toBe(true);
  });

  test('should show loading state initially', async ({ page }) => {
    // Delay the API response
    await page.route('**/api/game/daily**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...mockChallenge,
          challenge_date: mockChallenge.date,
          mode: 'shortest',
          path_country_codes: mockChallenge.optimal_path,
          user_progress: null,
        }),
      });
    });

    await gamePage.goto();

    // Should show loading spinner
    await expect(gamePage.loadingSpinner).toBeVisible();

    // Wait for load to complete
    await gamePage.waitForLoad();

    // Loading should be hidden
    await expect(gamePage.loadingSpinner).toBeHidden();
  });
});
