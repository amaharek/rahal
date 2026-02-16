import { test, expect } from '@playwright/test';

test.describe('Phase 3 Critical Paths', () => {
  test('leaderboard loads and filter changes API query type', async ({ page }) => {
    let requestedType = 'max_streak';

    await page.route('**/api/users/leaderboard**', async (route) => {
      const url = new URL(route.request().url());
      requestedType = url.searchParams.get('type') || 'max_streak';
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          type: requestedType,
          entries: [
            {
              rank: 1,
              user_id: '00000000-0000-0000-0000-000000000001',
              username: 'user1',
              display_name: 'User One',
              avatar_url: null,
              home_country_code: 'EGY',
              score: 12,
              games_played: 40,
            },
          ],
          total_users: 1,
          user_rank: null,
        }),
      });
    });

    await page.goto('/en/leaderboard');
    await expect(page.locator('[data-testid="leaderboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="leaderboard-item"]')).toHaveCount(1);

    await page.getByRole('button', { name: 'Games Won' }).click();
    await expect.poll(() => requestedType).toBe('games_won');
  });

  test('stats page shows guest-safe sign-in CTA', async ({ page }) => {
    await page.goto('/en/stats');
    await expect(page.getByText('Sign in to view your personal statistics.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  });

  test('practice mode can create a session and complete a run', async ({ page }) => {
    await page.route('**/api/autocomplete/countries**', async (route) => {
      const url = new URL(route.request().url());
      const q = (url.searchParams.get('q') || '').toLowerCase();

      const suggestions =
        q.startsWith('egy') || q.includes('egy')
          ? [
              {
                id: '00000000-0000-0000-0000-000000000010',
                code: 'EGY',
                name_ar: 'مصر',
                name_en: 'Egypt',
                flag_emoji: '🇪🇬',
                similarity: 1,
              },
            ]
          : [
              {
                id: '00000000-0000-0000-0000-000000000011',
                code: 'SDN',
                name_ar: 'السودان',
                name_en: 'Sudan',
                flag_emoji: '🇸🇩',
                similarity: 1,
              },
            ];

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ query: q, suggestions, total: suggestions.length }),
      });
    });

    await page.route('**/api/game/practice/session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          session_id: '00000000-0000-0000-0000-000000000100',
          mode: 'practice',
          start_country: {
            id: '00000000-0000-0000-0000-000000000010',
            code: 'EGY',
            name_ar: 'مصر',
            name_en: 'Egypt',
            flag_emoji: '🇪🇬',
          },
          end_country: {
            id: '00000000-0000-0000-0000-000000000011',
            code: 'SDN',
            name_ar: 'السودان',
            name_en: 'Sudan',
            flag_emoji: '🇸🇩',
          },
          shortest_path: 1,
          path_country_codes: [],
          user_progress: null,
        }),
      });
    });

    await page.route('**/api/game/practice/guess', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          country: {
            id: '00000000-0000-0000-0000-000000000011',
            code: 'SDN',
            name_ar: 'السودان',
            name_en: 'Sudan',
            flag_emoji: '🇸🇩',
          },
          score_emoji: '🟢',
          score_description: 'ممتاز',
          is_on_shortest_path: true,
          is_destination: true,
          game_complete: true,
          total_guesses: 1,
        }),
      });
    });

    await page.goto('/en/game/practice');
    const inputs = page.locator('input');
    await inputs.nth(0).fill('Egypt');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    await inputs.nth(1).fill('Sudan');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    await page.getByRole('button', { name: 'Start Practice' }).click();
    await expect(page.getByText('Practice run complete.')).toBeVisible();
  });
});
