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
  readonly hud: Locator;
  readonly hudCombo: Locator;
  readonly hudBenchmark: Locator;
  readonly hudMomentum: Locator;

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
  readonly completionGrade: Locator;
  readonly retryCta: Locator;

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
    this.startCountryFlag = page.locator('[data-testid="game-challenge-card"] [class*="text-2xl"]').first();
    this.startCountryName = page.locator('[data-testid="game-challenge-card"] [class*="font-bold"]').first();
    this.endCountryFlag = page.locator('[data-testid="game-challenge-card"] [class*="text-2xl"]').last();
    this.endCountryName = page.locator('[data-testid="game-challenge-card"] [class*="font-bold"]').nth(1);
    this.shortestPathInfo = page.locator('text=/أقصر.*مسار/i');
    this.hud = page.locator('[data-testid="game-hud"]');
    this.hudCombo = page.locator('[data-testid="hud-combo"]');
    this.hudBenchmark = page.locator('[data-testid="hud-benchmark"]');
    this.hudMomentum = page.locator('[data-testid="hud-momentum-indicator"]');

    // Map
    this.mapContainer = page.locator('[data-testid="game-map"]');
    this.mapToggleButton = page.locator('[data-testid="game-action-dock"]:visible button').first();
    this.zoomInButton = page.getByRole('button', { name: /zoom in/i });
    this.zoomOutButton = page.getByRole('button', { name: /zoom out/i });
    this.resetViewButton = page.getByRole('button', { name: /reset view/i });

    // Input
    this.countryInput = page.locator('[data-testid="game-action-dock"]:visible input[type="text"]').first();
    this.autocompleteDropdown = page.locator('[role="listbox"], [class*="dropdown"], [class*="suggestions"]');

    // Guesses
    this.guessesCard = page.locator('[data-testid="game-guess-list"]');
    this.guessItems = page.locator('[class*="bg-gray-50"][class*="rounded-lg"]');
    this.noGuessesMessage = page.locator('text=/لم تقم بأي تخمين/');

    // Hints
    this.hintsCard = page.locator('text=/تلميحات|Hints|Pistas/');
    this.hintButtons = page.locator('[data-testid="game-hint-button"]');

    // Completion
    this.completionCard = page.locator('[data-testid="game-completion-card"]');
    this.scoreDisplay = page.locator('text=/النتيجة|score|puntuación/i');
    this.shareButton = page.locator('button:has-text("مشاركة")');
    this.completionGrade = page.locator('[data-testid="completion-grade"]');
    this.retryCta = page.locator('[data-testid="completion-retry-cta"]');

    // States
    this.loadingSpinner = page.locator('[class*="animate-spin"]');
    this.errorMessage = page.locator('[class*="text-error"]');
    this.retryButton = page.locator('button:has-text("إعادة المحاولة"), button:has-text("Retry")');
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
