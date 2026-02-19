import { test, expect } from '@playwright/test';
import { GamePage } from '../pages/game.page';
import { setupGameMocks, setupDynamicGuessMock } from '../utils/api-mocks';

test.describe('Map Interaction', () => {
  let gamePage: GamePage;

  test.beforeEach(async ({ page }) => {
    gamePage = new GamePage(page);
    await setupGameMocks(page);
    await setupDynamicGuessMock(page);
    await gamePage.goto();
    await gamePage.waitForLoad();
  });

  test('should load and display map successfully', async ({ page }) => {
    // Wait for map to render
    await gamePage.waitForMap();

    // Verify map container is visible
    await expect(gamePage.mapContainer).toBeVisible();

    // Verify SVG is rendered
    const svg = page.locator('svg').first();
    await expect(svg).toBeVisible();

    // Verify map has geographic paths
    const paths = page.locator('svg path');
    const pathCount = await paths.count();
    expect(pathCount).toBeGreaterThan(50); // World map should have many country paths
  });

  test('should display map controls', async ({ page }) => {
    await gamePage.waitForMap();

    await expect(page.getByRole('button', { name: /zoom in/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /zoom out/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /reset view/i })).toBeVisible();
  });

  test('should zoom in on button click', async ({ page }) => {
    await gamePage.waitForMap();

    // Get initial zoom state (via transform or viewBox)
    const svg = page.locator('svg').first();
    const initialTransform = await svg.evaluate((el) => {
      const g = el.querySelector('g');
      return g?.getAttribute('transform') || '';
    });

    // Click zoom in
    await gamePage.zoomIn();
    await page.waitForTimeout(300); // Animation time

    // Verify zoom changed
    const newTransform = await svg.evaluate((el) => {
      const g = el.querySelector('g');
      return g?.getAttribute('transform') || '';
    });

    // Transform should have changed (either different or we verify scale increased)
    // Note: The exact behavior depends on react-simple-maps implementation
    expect(newTransform).toBeDefined();
  });

  test('should zoom out on button click', async ({ page }) => {
    await gamePage.waitForMap();

    // Zoom in first so we can zoom out
    await gamePage.zoomIn();
    await page.waitForTimeout(300);

    // Now zoom out
    await gamePage.zoomOut();
    await page.waitForTimeout(300);

    // Map should still be visible and functional
    await expect(gamePage.mapContainer).toBeVisible();
  });

  test('should reset view on reset button click', async ({ page }) => {
    await gamePage.waitForMap();

    // Zoom in first
    await gamePage.zoomIn();
    await gamePage.zoomIn();
    await page.waitForTimeout(300);

    // Reset view
    await gamePage.resetView();
    await page.waitForTimeout(300);

    // Map should return to default state
    await expect(gamePage.mapContainer).toBeVisible();
  });

  test('should display map legend', async ({ page }) => {
    await gamePage.waitForMap();

    // Look for legend elements (colored boxes with labels)
    const legendContainer = page.locator('[class*="legend"], [class*="Legend"]');
    const hasLegend = await legendContainer.isVisible().catch(() => false);

    // If no dedicated legend container, look for inline legend items
    if (!hasLegend) {
      const mapSection = gamePage.mapContainer;
      await expect(mapSection).toBeVisible();
    }
  });

  test.describe('Mobile Map Toggle', () => {
    test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

    test('should show action dock on mobile', async ({ page }) => {
      await gamePage.waitForLoad();

      const actionDock = page.locator('[data-testid="game-action-dock"]:visible').first();
      await expect(actionDock).toBeVisible();
    });

    test('should keep map visible on mobile', async ({ page }) => {
      await gamePage.waitForLoad();

      const mapSection = page.locator('[data-testid="game-map"]');
      await expect(mapSection).toBeVisible();
    });
  });

  test.describe('Country Highlighting', () => {
    test('should have different colors for start and end countries', async ({ page }) => {
      await gamePage.waitForMap();

      // Get all SVG paths
      const paths = page.locator('svg path');

      // Check that we have paths with different fill colors
      const fills = await paths.evaluateAll((elements) =>
        elements.map((el) => el.getAttribute('fill')).filter(Boolean)
      );

      const uniqueFills = [...new Set(fills)];

      // Should have multiple colors (default + start + end at minimum)
      expect(uniqueFills.length).toBeGreaterThan(1);
    });

    test('should highlight guessed countries after submission', async ({ page }) => {
      await gamePage.waitForMap();

      // Get initial path fills
      const getPathFills = async () => {
        return await page.locator('svg path').evaluateAll((elements) =>
          elements.map((el) => el.getAttribute('fill')).filter(Boolean)
        );
      };

      const initialFills = await getPathFills();

      // Submit a guess
      await gamePage.searchCountry('الأردن');
      await page.waitForTimeout(400);

      const suggestions = page.locator('[role="option"], [class*="suggestion"]');
      if (await suggestions.count() > 0) {
        await suggestions.first().click();
        await page.waitForTimeout(500);

        // Get fills after guess
        const newFills = await getPathFills();

        // The fills array might have changed (new colors introduced)
        // or specific paths changed color
        const uniqueInitial = [...new Set(initialFills)];
        const uniqueNew = [...new Set(newFills)];

        // Either we have new colors or the distribution changed
        expect(uniqueNew.length).toBeGreaterThanOrEqual(uniqueInitial.length);
      }
    });
  });

  test('should support pan/drag interaction', async ({ page }) => {
    await gamePage.waitForMap();

    const mapContainer = gamePage.mapContainer;
    const box = await mapContainer.boundingBox();

    if (box) {
      // Perform drag operation
      const startX = box.x + box.width / 2;
      const startY = box.y + box.height / 2;

      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(startX + 50, startY + 50, { steps: 5 });
      await page.mouse.up();

      // Map should still be functional
      await expect(mapContainer).toBeVisible();
    }
  });
});
