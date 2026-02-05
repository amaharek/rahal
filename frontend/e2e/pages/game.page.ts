import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for the Game Page (/ar/game)
 */
export class GamePage {
  readonly page: Page;
  readonly url = '/ar/game';

  // Header elements
  readonly backLink: Locator;
  readonly pageTitle: Locator;

  // Challenge card elements
  readonly startCountryFlag: Locator;
  readonly startCountryName: Locator;
  readonly endCountryFlag: Locator;
  readonly endCountryName: Locator;
  readonly shortestPathInfo: Locator;

  // Map elements
  readonly mapContainer: Locator;
  readonly mapToggleButton: Locator;
  readonly zoomInButton: Locator;
  readonly zoomOutButton: Locator;
  readonly resetViewButton: Locator;

  // Input elements
  readonly countryInput: Locator;
  readonly autocompleteDropdown: Locator;

  // Guesses section
  readonly guessesCard: Locator;
  readonly guessItems: Locator;
  readonly noGuessesMessage: Locator;

  // Hints section
  readonly hintsCard: Locator;
  readonly hintButtons: Locator;

  // Completion elements
  readonly completionCard: Locator;
  readonly scoreDisplay: Locator;
  readonly shareButton: Locator;

  // Loading/Error states
  readonly loadingSpinner: Locator;
  readonly errorMessage: Locator;
  readonly retryButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Header
    this.backLink = page.locator('a:has-text("←")');
    this.pageTitle = page.locator('h1');

    // Challenge card
    this.startCountryFlag = page.locator('[class*="text-3xl"]').first();
    this.startCountryName = page.locator('[class*="font-bold"]').first();
    this.endCountryFlag = page.locator('[class*="text-3xl"]').last();
    this.endCountryName = page.locator('[class*="font-bold"]').nth(1);
    this.shortestPathInfo = page.locator('text=/أقصر.*مسار/i');

    // Map
    this.mapContainer = page.locator('[class*="aspect-[16/10]"]');
    this.mapToggleButton = page.locator('button:has-text("الخريطة")');
    this.zoomInButton = page.locator('button').filter({ has: page.locator('[class*="Plus"]') });
    this.zoomOutButton = page.locator('button').filter({ has: page.locator('[class*="Minus"]') });
    this.resetViewButton = page.locator('button').filter({ has: page.locator('[class*="RotateCcw"]') });

    // Input
    this.countryInput = page.locator('input[type="text"]');
    this.autocompleteDropdown = page.locator('[role="listbox"], [class*="dropdown"], [class*="suggestions"]');

    // Guesses
    this.guessesCard = page.locator('section, div').filter({ hasText: /التخمينات/ });
    this.guessItems = page.locator('[class*="bg-gray-50"][class*="rounded-lg"]');
    this.noGuessesMessage = page.locator('text=/لم تقم بأي تخمين/');

    // Hints
    this.hintsCard = page.locator('section, div').filter({ hasText: /تلميحات/ });
    this.hintButtons = page.locator('button').filter({ hasText: /حدود|الحرف الأول/ });

    // Completion
    this.completionCard = page.locator('[class*="bg-success"]');
    this.scoreDisplay = page.locator('text=/النقاط/');
    this.shareButton = page.locator('button:has-text("مشاركة")');

    // States
    this.loadingSpinner = page.locator('[class*="animate-spin"]');
    this.errorMessage = page.locator('[class*="text-error"]');
    this.retryButton = page.locator('button:has-text("إعادة المحاولة")');
  }

  /**
   * Navigate to the game page
   */
  async goto() {
    await this.page.goto(this.url);
  }

  /**
   * Wait for the page to fully load
   */
  async waitForLoad() {
    // Wait for loading to complete
    await this.loadingSpinner.waitFor({ state: 'hidden', timeout: 10000 });
    // Wait for challenge to be displayed
    await this.startCountryFlag.waitFor({ state: 'visible' });
  }

  /**
   * Wait for the map to render
   */
  async waitForMap() {
    await this.mapContainer.waitFor({ state: 'visible' });
    // Wait for SVG to render
    await this.page.waitForSelector('svg', { state: 'visible', timeout: 10000 });
  }

  /**
   * Type a country name in the search input
   */
  async searchCountry(name: string) {
    await this.countryInput.fill(name);
    // Wait for debounce
    await this.page.waitForTimeout(350);
  }

  /**
   * Select a country from the autocomplete results
   */
  async selectCountry(name: string) {
    const option = this.page.locator(`[role="option"]:has-text("${name}")`);
    await option.click();
  }

  /**
   * Submit a guess by searching and selecting
   */
  async submitGuess(countryName: string) {
    await this.searchCountry(countryName);
    await this.selectCountry(countryName);
  }

  /**
   * Get the current number of guesses
   */
  async getGuessCount(): Promise<number> {
    const text = await this.guessesCard.textContent();
    const match = text?.match(/\((\d+)\)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Check if game is completed
   */
  async isCompleted(): Promise<boolean> {
    return await this.completionCard.isVisible().catch(() => false);
  }

  /**
   * Get the score after completion
   */
  async getScore(): Promise<number | null> {
    if (!(await this.isCompleted())) return null;
    const scoreText = await this.scoreDisplay.textContent();
    const match = scoreText?.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  }

  /**
   * Use a hint
   */
  async useHint(type: 'border' | 'allBorders' | 'firstLetter') {
    const hintTexts = {
      border: 'حدود',
      allBorders: 'كل الحدود',
      firstLetter: 'الحرف الأول',
    };
    const button = this.page.locator(`button:has-text("${hintTexts[type]}")`);
    await button.click();
  }

  /**
   * Toggle map visibility (mobile)
   */
  async toggleMap() {
    await this.mapToggleButton.click();
  }

  /**
   * Zoom in on the map
   */
  async zoomIn() {
    await this.zoomInButton.click();
  }

  /**
   * Zoom out on the map
   */
  async zoomOut() {
    await this.zoomOutButton.click();
  }

  /**
   * Reset map view
   */
  async resetView() {
    await this.resetViewButton.click();
  }

  /**
   * Get all guess entries
   */
  async getGuesses(): Promise<string[]> {
    const count = await this.guessItems.count();
    const guesses: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = await this.guessItems.nth(i).textContent();
      if (text) guesses.push(text);
    }
    return guesses;
  }

  /**
   * Assert challenge is displayed correctly
   */
  async assertChallengeDisplayed(startName: string, endName: string) {
    await expect(this.startCountryName).toContainText(startName);
    await expect(this.endCountryName).toContainText(endName);
  }
}
