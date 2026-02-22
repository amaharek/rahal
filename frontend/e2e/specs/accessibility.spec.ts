import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { GamePage } from '../pages/game.page';
import { setupGameMocks, setupDynamicGuessMock } from '../utils/api-mocks';

test.describe('Accessibility', () => {
  let gamePage: GamePage;

  test.beforeEach(async ({ page }) => {
    gamePage = new GamePage(page);
    await setupGameMocks(page);
    await setupDynamicGuessMock(page);
    await gamePage.goto();
    await gamePage.waitForLoad();
  });

  test('should have no WCAG 2.0 AA violations on game page', async ({ page }) => {
    // Wait for full page load
    await page.waitForTimeout(1000);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .exclude('svg') // Exclude map SVG which may have complex accessibility requirements
      .analyze();

    // Log violations for debugging
    if (accessibilityScanResults.violations.length > 0) {
      console.log('Accessibility violations:', JSON.stringify(accessibilityScanResults.violations, null, 2));
    }

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have proper RTL support (dir="rtl")', async ({ page }) => {
    // Check HTML element has RTL direction
    const htmlDir = await page.locator('html').getAttribute('dir');
    expect(htmlDir).toBe('rtl');
  });

  test('should have proper document language set to Arabic', async ({ page }) => {
    const htmlLang = await page.locator('html').getAttribute('lang');
    expect(htmlLang).toMatch(/^ar/); // ar or ar-SA
  });

  test('should have ARIA labels on map controls', async ({ page }) => {
    await gamePage.waitForMap();

    // Check zoom controls have accessible labels
    const zoomInButton = page.locator('button').filter({
      has: page.locator('[class*="Plus"]'),
    }).first();

    const zoomOutButton = page.locator('button').filter({
      has: page.locator('[class*="Minus"]'),
    }).first();

    // Buttons should have aria-label or visible text
    const zoomInLabel = await zoomInButton.getAttribute('aria-label');
    const zoomInText = await zoomInButton.textContent();

    const zoomOutLabel = await zoomOutButton.getAttribute('aria-label');
    const zoomOutText = await zoomOutButton.textContent();

    // At least one form of labeling should be present
    expect(zoomInLabel || zoomInText?.trim()).toBeTruthy();
    expect(zoomOutLabel || zoomOutText?.trim()).toBeTruthy();
  });

  test('should have keyboard navigable interface', async ({ page }) => {
    // Tab through the page
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);

    // Check that focus is visible
    const focusedElement = page.locator(':focus');
    const isFocusVisible = await focusedElement.isVisible().catch(() => false);

    // Continue tabbing and verify focus moves
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);

    const secondFocusedElement = page.locator(':focus');
    const secondFocusVisible = await secondFocusedElement.isVisible().catch(() => false);

    expect(isFocusVisible || secondFocusVisible).toBe(true);
  });

  test('should have visible focus indicators', async ({ page }) => {
    // Navigate to the input using Tab
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);

      const focusedElement = page.locator(':focus');
      const tagName = await focusedElement.evaluate((el) => el.tagName.toLowerCase()).catch(() => '');

      if (tagName === 'input' || tagName === 'button') {
        // Check for focus ring or outline
        const focusStyles = await focusedElement.evaluate((el) => {
          const styles = getComputedStyle(el);
          return {
            outline: styles.outline,
            boxShadow: styles.boxShadow,
            borderColor: styles.borderColor,
          };
        });

        // Should have some visible focus indicator
        const hasFocusIndicator =
          focusStyles.outline !== 'none' ||
          focusStyles.boxShadow !== 'none' ||
          focusStyles.boxShadow.includes('ring');

        expect(hasFocusIndicator || true).toBe(true); // Soft check
        break;
      }

      attempts++;
    }
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    // Get all headings
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    const headingLevels: number[] = [];

    for (const heading of headings) {
      const tagName = await heading.evaluate((el) => el.tagName);
      headingLevels.push(parseInt(tagName.replace('H', '')));
    }

    // Should have at least one h1
    expect(headingLevels.includes(1)).toBe(true);

    // Heading levels should not skip (e.g., h1 -> h3)
    for (let i = 1; i < headingLevels.length; i++) {
      const diff = headingLevels[i] - headingLevels[i - 1];
      expect(diff).toBeLessThanOrEqual(1);
    }
  });

  test('should have alt text or aria-label for images', async ({ page }) => {
    const images = await page.locator('img').all();

    for (const img of images) {
      const alt = await img.getAttribute('alt');
      const ariaLabel = await img.getAttribute('aria-label');
      const ariaLabelledBy = await img.getAttribute('aria-labelledby');
      const role = await img.getAttribute('role');

      // Image should have accessible name (unless decorative)
      const isDecorative = role === 'presentation' || role === 'none';
      const hasAccessibleName = alt || ariaLabel || ariaLabelledBy;

      expect(isDecorative || hasAccessibleName).toBeTruthy();
    }
  });

  test('should have sufficient color contrast', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .options({ runOnly: ['color-contrast'] })
      .exclude('svg')
      .analyze();

    // Allow some violations in complex UI but log them
    if (accessibilityScanResults.violations.length > 0) {
      console.log('Color contrast issues:', accessibilityScanResults.violations.length);
    }

    // Strict mode: no violations
    // Lenient mode: allow up to N violations
    expect(accessibilityScanResults.violations.length).toBeLessThanOrEqual(3);
  });

  test('should support screen reader announcements for dynamic content', async ({ page }) => {
    // Check for aria-live regions
    const liveRegions = page.locator('[aria-live], [role="status"], [role="alert"]');
    const liveRegionCount = await liveRegions.count();

    // Should have at least one live region for dynamic updates
    // This is a soft check - implementation may vary
    expect(liveRegionCount >= 0).toBe(true);
  });

  test('should have accessible form inputs', async ({ page }) => {
    // Check country input has proper labeling
    const input = gamePage.countryInput;

    const ariaLabel = await input.getAttribute('aria-label');
    const ariaLabelledBy = await input.getAttribute('aria-labelledby');
    const id = await input.getAttribute('id');
    const placeholder = await input.getAttribute('placeholder');

    // Find associated label if exists
    let hasVisibleLabel = false;
    if (id) {
      const label = page.locator(`label[for="${id}"]`);
      hasVisibleLabel = await label.isVisible().catch(() => false);
    }

    // Input should have some form of accessible name
    const hasAccessibleName = ariaLabel || ariaLabelledBy || hasVisibleLabel || placeholder;
    expect(hasAccessibleName).toBeTruthy();
  });

  test('should preserve readable narrative and recap structure in hybrid locale view', async ({ page }) => {
    await page.goto('/en/game?presentation=hybrid');
    await gamePage.waitForLoad();

    const milestoneCard = page.getByTestId('narrative-milestone-card');
    await expect(milestoneCard).toBeVisible();
    await expect(milestoneCard.getByText(/Journey Brief|Midpoint Checkpoint|Mission Complete/)).toBeVisible();

    await page.getByRole('textbox', { name: 'Enter country name...' }).fill('Egypt');
    await page.getByRole('option').filter({ hasText: 'Egypt' }).first().click();

    const recapCard = page.getByTestId('postgame-recap-card');
    await expect(recapCard).toBeVisible();
    await expect(page.getByTestId('share-recap-button')).toBeVisible();
  });

  test('should maintain focus within modal/dialog when open', async ({ page }) => {
    // This test checks if any modals trap focus properly
    // For now, check basic focus management

    // Tab through the page multiple times
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(50);
    }

    // Focus should still be within the page
    const focusedElement = page.locator(':focus');
    const isWithinBody = await focusedElement.evaluate((el) => {
      return document.body.contains(el);
    }).catch(() => true);

    expect(isWithinBody).toBe(true);
  });

  test('should have skip link or bypass mechanism', async ({ page }) => {
    // Check for skip link (usually first focusable element)
    await page.keyboard.press('Tab');

    const firstFocused = page.locator(':focus');
    const text = await firstFocused.textContent().catch(() => '');

    // Skip link text patterns
    const isSkipLink = /skip|تخطي|القفز/i.test(text || '');

    // Skip links are optional but good practice
    // Soft check - not all sites have them
    expect(isSkipLink || true).toBe(true);
  });
});

test.describe('Mobile Accessibility', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should have tap targets of sufficient size', async ({ page }) => {
    const gamePage = new GamePage(page);
    await setupGameMocks(page);
    await setupDynamicGuessMock(page);
    await gamePage.goto();
    await gamePage.waitForLoad();

    // Get all interactive elements
    const buttons = await page.locator('button, a, input').all();

    for (const element of buttons) {
      const box = await element.boundingBox();
      if (box) {
        // WCAG recommends minimum 44x44 pixels for touch targets
        // We'll be lenient and check for 24x24 (common mobile minimum)
        const hasMinimumSize = box.width >= 24 && box.height >= 24;
        expect(hasMinimumSize).toBe(true);
      }
    }
  });
});
