import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for the Home Page (/ar)
 */
export class HomePage {
  readonly page: Page;
  readonly url = '/ar';

  // Main elements
  readonly logo: Locator;
  readonly title: Locator;
  readonly subtitle: Locator;
  readonly playButton: Locator;

  // Navigation
  readonly navLinks: Locator;

  constructor(page: Page) {
    this.page = page;

    this.logo = page.locator('[class*="logo"], h1');
    this.title = page.locator('h1, [class*="title"]');
    this.subtitle = page.locator('[class*="subtitle"], p').first();
    this.playButton = page.locator('a[href*="/game"], button:has-text("العب")');
    this.navLinks = page.locator('nav a, header a');
  }

  /**
   * Navigate to the home page
   */
  async goto() {
    await this.page.goto(this.url);
  }

  /**
   * Navigate to the game page via the play button
   */
  async goToGame() {
    await this.playButton.click();
    await this.page.waitForURL('**/game');
  }

  /**
   * Check if page has RTL layout
   */
  async hasRtlLayout(): Promise<boolean> {
    const html = this.page.locator('html');
    const dir = await html.getAttribute('dir');
    return dir === 'rtl';
  }
}
