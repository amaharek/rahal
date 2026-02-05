import { Page, expect } from '@playwright/test';

/**
 * Waits for the map component to be fully loaded
 */
export async function waitForMapLoad(page: Page) {
  // Wait for the map container to be visible
  await page.waitForSelector('[class*="aspect-[16/10]"]', { state: 'visible' });

  // Wait for SVG to be rendered (the map uses SVG)
  await page.waitForSelector('svg', { state: 'visible', timeout: 10000 });
}

/**
 * Waits for the page to be fully hydrated (React client-side)
 */
export async function waitForHydration(page: Page) {
  // Wait for the loading spinner to disappear
  await page.waitForFunction(
    () => !document.querySelector('[class*="animate-spin"]'),
    { timeout: 10000 }
  );
}

/**
 * Types into the country autocomplete input with debounce handling
 */
export async function typeCountrySearch(page: Page, text: string) {
  const input = page.locator('input[type="text"]').first();
  await input.fill(text);
  // Wait for debounce (300ms) plus network time
  await page.waitForTimeout(400);
}

/**
 * Selects a country from the autocomplete dropdown
 */
export async function selectCountryFromDropdown(page: Page, countryName: string) {
  const option = page.locator(`[role="option"]:has-text("${countryName}")`);
  await option.click();
}

/**
 * Gets the current guess count from the UI
 */
export async function getGuessCount(page: Page): Promise<number> {
  const guessHeader = page.locator('text=/التخمينات.*\\(\\d+\\)/');
  const text = await guessHeader.textContent();
  const match = text?.match(/\((\d+)\)/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Checks if the game is completed
 */
export async function isGameCompleted(page: Page): Promise<boolean> {
  const completionCard = page.locator('text=/🎉/');
  return await completionCard.isVisible().catch(() => false);
}

/**
 * Gets all guess entries from the history
 */
export async function getGuessHistory(page: Page) {
  const guessItems = page.locator('[class*="bg-gray-50"][class*="rounded-lg"]');
  const count = await guessItems.count();

  const guesses = [];
  for (let i = 0; i < count; i++) {
    const item = guessItems.nth(i);
    const text = await item.textContent();
    guesses.push(text);
  }

  return guesses;
}

/**
 * Clicks the zoom in button on the map
 */
export async function zoomIn(page: Page) {
  const zoomInButton = page.locator('button[aria-label*="zoom"], button:has([class*="Plus"])').first();
  await zoomInButton.click();
}

/**
 * Clicks the zoom out button on the map
 */
export async function zoomOut(page: Page) {
  const zoomOutButton = page.locator('button[aria-label*="zoom"], button:has([class*="Minus"])').first();
  await zoomOutButton.click();
}

/**
 * Clicks the reset view button on the map
 */
export async function resetMapView(page: Page) {
  const resetButton = page.locator('button:has([class*="RotateCcw"]), button[aria-label*="reset"]').first();
  await resetButton.click();
}

/**
 * Toggles map visibility on mobile
 */
export async function toggleMobileMap(page: Page) {
  const toggleButton = page.locator('button:has-text("الخريطة"), button:has-text("إظهار"), button:has-text("إخفاء")');
  await toggleButton.click();
}

/**
 * Checks if an element has RTL direction
 */
export async function hasRtlDirection(page: Page, selector: string): Promise<boolean> {
  const element = page.locator(selector).first();
  const dir = await element.getAttribute('dir');
  const style = await element.evaluate((el) => getComputedStyle(el).direction);
  return dir === 'rtl' || style === 'rtl';
}

/**
 * Asserts that a color matches expected hex value
 */
export async function assertCountryColor(page: Page, countryCode: string, expectedColor: string) {
  // This would require inspecting the SVG path fill
  // Implementation depends on how countries are identified in the SVG
  const countryPath = page.locator(`path[data-country="${countryCode}"]`);
  const fill = await countryPath.getAttribute('fill');
  expect(fill?.toLowerCase()).toBe(expectedColor.toLowerCase());
}
