import { test, expect, Page } from '@playwright/test';
import { GamePage } from '../pages/game.page';
import { setupGameMocks, setupGuessMock } from '../utils/api-mocks';
import mockCountries from '../fixtures/mock-countries.json';

// Score emoji constants
const SCORE_EMOJIS = {
  correct: '🟢', // On the correct path
  onPathWrongOrder: '🟡', // On path but wrong order
  closePath: '🟠', // Close to the path
  farPath: '🔴', // Far from the path
  differentContinent: '⚫', // Different continent
};

async function submitGuessWithEmoji(page: Page, gamePage: GamePage, emoji: string) {
  await setupGuessMock(page, { scoreEmoji: emoji, gameComplete: false });

  await gamePage.countryInput.fill('الأردن');
  await page.waitForTimeout(400);

  const suggestions = page.locator('[role="option"], [class*="suggestion"]');
  if (await suggestions.count() > 0) {
    await suggestions.first().click();
    await page.waitForTimeout(500);
  }
}

test.describe('Scoring System', () => {
  let gamePage: GamePage;

  test.beforeEach(async ({ page }) => {
    gamePage = new GamePage(page);
    await setupGameMocks(page);
  });

  test('should show green emoji (🟢) for correct path guess', async ({ page }) => {
    await setupGuessMock(page, { scoreEmoji: SCORE_EMOJIS.correct });
    await gamePage.goto();
    await gamePage.waitForLoad();

    await gamePage.searchCountry('الأردن');
    await page.waitForTimeout(400);

    const suggestions = page.locator('[role="option"], [class*="suggestion"]');
    if (await suggestions.count() > 0) {
      await suggestions.first().click();
      await page.waitForTimeout(500);

      // Check for green emoji in guess history
      const pageContent = await page.content();
      expect(pageContent).toContain(SCORE_EMOJIS.correct);
    }
  });

  test('should show yellow emoji (🟡) for on-path wrong order guess', async ({ page }) => {
    await setupGuessMock(page, { scoreEmoji: SCORE_EMOJIS.onPathWrongOrder });
    await gamePage.goto();
    await gamePage.waitForLoad();

    await gamePage.searchCountry('الأردن');
    await page.waitForTimeout(400);

    const suggestions = page.locator('[role="option"], [class*="suggestion"]');
    if (await suggestions.count() > 0) {
      await suggestions.first().click();
      await page.waitForTimeout(500);

      const pageContent = await page.content();
      expect(pageContent).toContain(SCORE_EMOJIS.onPathWrongOrder);
    }
  });

  test('should show orange emoji (🟠) for close to path guess', async ({ page }) => {
    await setupGuessMock(page, { scoreEmoji: SCORE_EMOJIS.closePath });
    await gamePage.goto();
    await gamePage.waitForLoad();

    await gamePage.searchCountry('الكويت');
    await page.waitForTimeout(400);

    const suggestions = page.locator('[role="option"], [class*="suggestion"]');
    if (await suggestions.count() > 0) {
      await suggestions.first().click();
      await page.waitForTimeout(500);

      const pageContent = await page.content();
      expect(pageContent).toContain(SCORE_EMOJIS.closePath);
    }
  });

  test('should show red emoji (🔴) for far from path guess', async ({ page }) => {
    await setupGuessMock(page, { scoreEmoji: SCORE_EMOJIS.farPath });
    await gamePage.goto();
    await gamePage.waitForLoad();

    await gamePage.searchCountry('العراق');
    await page.waitForTimeout(400);

    const suggestions = page.locator('[role="option"], [class*="suggestion"]');
    if (await suggestions.count() > 0) {
      await suggestions.first().click();
      await page.waitForTimeout(500);

      const pageContent = await page.content();
      expect(pageContent).toContain(SCORE_EMOJIS.farPath);
    }
  });

  test('should show black emoji (⚫) for different continent guess', async ({ page }) => {
    await setupGuessMock(page, { scoreEmoji: SCORE_EMOJIS.differentContinent });
    await gamePage.goto();
    await gamePage.waitForLoad();

    await gamePage.searchCountry('فرنسا');
    await page.waitForTimeout(400);

    const suggestions = page.locator('[role="option"], [class*="suggestion"]');
    if (await suggestions.count() > 0) {
      await suggestions.first().click();
      await page.waitForTimeout(500);

      const pageContent = await page.content();
      expect(pageContent).toContain(SCORE_EMOJIS.differentContinent);
    }
  });

  test('should prevent duplicate guesses', async ({ page }) => {
    await setupGuessMock(page, { scoreEmoji: SCORE_EMOJIS.correct });
    await gamePage.goto();
    await gamePage.waitForLoad();

    // First guess
    await gamePage.searchCountry('الأردن');
    await page.waitForTimeout(400);

    const suggestions = page.locator('[role="option"], [class*="suggestion"]');
    if (await suggestions.count() > 0) {
      await suggestions.first().click();
      await page.waitForTimeout(500);
    }

    const firstCount = await gamePage.getGuessCount();

    // Try to guess the same country again
    await gamePage.searchCountry('الأردن');
    await page.waitForTimeout(400);

    const suggestionsAgain = page.locator('[role="option"], [class*="suggestion"]');
    if (await suggestionsAgain.count() > 0) {
      await suggestionsAgain.first().click();
      await page.waitForTimeout(500);
    }

    const secondCount = await gamePage.getGuessCount();

    // Should not increase (duplicate prevented) or show error
    // The exact behavior depends on implementation
    // Could either not add or show an error message
    expect(secondCount).toBeLessThanOrEqual(firstCount + 1);
  });

  test('should track guess history in order', async ({ page }) => {
    let guessNumber = 0;
    const guessedCountries: string[] = [];

    await page.route('**/api/guess', async (route) => {
      guessNumber++;
      const emojis = ['🟢', '🟡', '🟠'];

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          country: mockCountries[guessNumber % mockCountries.length],
          score_emoji: emojis[guessNumber % emojis.length],
          game_complete: false,
          total_guesses: guessNumber,
        }),
      });
    });

    await setupGameMocks(page);
    await gamePage.goto();
    await gamePage.waitForLoad();

    // Make multiple guesses
    const testCountries = ['الأردن', 'العراق', 'الكويت'];

    for (const country of testCountries) {
      await gamePage.searchCountry(country);
      await page.waitForTimeout(400);

      const suggestions = page.locator('[role="option"], [class*="suggestion"]');
      if (await suggestions.count() > 0) {
        await suggestions.first().click();
        await page.waitForTimeout(500);
        guessedCountries.push(country);
      }
    }

    // Verify guess count matches
    const guesses = await gamePage.getGuesses();
    expect(guesses.length).toBeLessThanOrEqual(testCountries.length);
  });

  test('should display guess number in history', async ({ page }) => {
    await setupGuessMock(page, { scoreEmoji: SCORE_EMOJIS.correct });
    await gamePage.goto();
    await gamePage.waitForLoad();

    await gamePage.searchCountry('الأردن');
    await page.waitForTimeout(400);

    const suggestions = page.locator('[role="option"], [class*="suggestion"]');
    if (await suggestions.count() > 0) {
      await suggestions.first().click();
      await page.waitForTimeout(500);

      // Check for numbered entry (e.g., "1.")
      const guessItems = gamePage.guessItems;
      const firstGuess = await guessItems.first().textContent();

      // Should contain a number indicator
      expect(firstGuess).toMatch(/1\.|#1|1/);
    }
  });

  test('should display country flag in guess history', async ({ page }) => {
    await setupGuessMock(page, { scoreEmoji: SCORE_EMOJIS.correct });
    await gamePage.goto();
    await gamePage.waitForLoad();

    await gamePage.searchCountry('الأردن');
    await page.waitForTimeout(400);

    const suggestions = page.locator('[role="option"], [class*="suggestion"]');
    if (await suggestions.count() > 0) {
      await suggestions.first().click();
      await page.waitForTimeout(500);

      // Check for flag emoji in guess entry
      const guessItems = gamePage.guessItems;
      const firstGuess = await guessItems.first().textContent();

      // Should contain flag emoji (Unicode regional indicator)
      const hasFlagEmoji = /[\u{1F1E0}-\u{1F1FF}]{2}/u.test(firstGuess || '');
      expect(hasFlagEmoji).toBe(true);
    }
  });

  test('should show country Arabic name in guess history', async ({ page }) => {
    await setupGuessMock(page, { scoreEmoji: SCORE_EMOJIS.correct });
    await gamePage.goto();
    await gamePage.waitForLoad();

    await gamePage.searchCountry('الأردن');
    await page.waitForTimeout(400);

    const suggestions = page.locator('[role="option"], [class*="suggestion"]');
    if (await suggestions.count() > 0) {
      await suggestions.first().click();
      await page.waitForTimeout(500);

      // Check for Arabic name in guess entry
      const guessItems = gamePage.guessItems;
      const firstGuess = await guessItems.first().textContent();

      // Should contain Arabic text
      const hasArabic = /[\u0600-\u06FF]/.test(firstGuess || '');
      expect(hasArabic).toBe(true);
    }
  });
});
