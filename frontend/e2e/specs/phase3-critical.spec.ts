import { test, expect, type Page, type Route } from '@playwright/test';

async function mockDailyGameRoutes(page: Page) {
  await page.route('**/api/game/challenge/daily**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: '00000000-0000-0000-0000-000000000900',
        challenge_date: '2026-02-20',
        mode: 'shortest',
        shortest_path: 1,
        path_country_codes: ['EGY', 'SDN'],
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
        user_progress: null,
      }),
    });
  });

  await page.route('**/api/game/stats**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        games_played: 10,
        games_won: 7,
        win_rate: 70,
        current_streak: 3,
        max_streak: 5,
        average_guesses: 4.2,
        hints_used_total: 2,
        last_played: '2026-02-19',
      }),
    });
  });

  await page.route('**/api/autocomplete/countries**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        query: 'sud',
        suggestions: [
          {
            id: '00000000-0000-0000-0000-000000000011',
            code: 'SDN',
            name_ar: 'السودان',
            name_en: 'Sudan',
            flag_emoji: '🇸🇩',
            similarity: 1,
          },
        ],
        total: 1,
      }),
    });
  });

  await page.route('**/api/game/guess', async (route: Route) => {
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
        score_description: 'excellent',
        is_on_shortest_path: true,
        is_destination: true,
        game_complete: true,
        total_guesses: 1,
        score: 100,
        route_mode: 'shortest',
        gap_from_optimal: 0,
        quality_tier: 'perfect',
        quality_explanation_ar: 'مسار ممتاز',
      }),
    });
  });
}

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
    await expect(page.getByRole('heading', { name: 'Leaderboard' })).toBeVisible();
    await expect(page.getByText('User One')).toBeVisible();

    await page.getByRole('button', { name: 'Games Won' }).click();
    await expect.poll(() => requestedType).toBe('games_won');
  });

  test('stats page shows guest-safe sign-in CTA', async ({ page }) => {
    await page.goto('/en/stats');
    await expect(page.getByText('Sign in to view your personal statistics.')).toBeVisible();
    const signInButtons = page.getByRole('button', { name: 'Sign In' });
    await expect(signInButtons).toHaveCount(2);
    await expect(signInButtons.nth(1)).toBeVisible();
  });

  test('practice mode can create a session and enter active run state', async ({ page }) => {
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
    await page.getByRole('option').filter({ hasText: 'Egypt' }).first().click();

    await inputs.nth(1).fill('Sudan');
    await page.getByRole('option').filter({ hasText: 'Sudan' }).first().click();

    const startPracticeButton = page.getByRole('button', { name: 'Start Practice' });
    await expect(startPracticeButton).toBeEnabled();
    await startPracticeButton.click();

    await expect(page.getByText('Shortest Path: 1 countries')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Guesses (0)' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Enter country name...' })).toBeVisible();
  });

  test('daily game shows narrative milestone and post-game recap surfaces', async ({ page }) => {
    await mockDailyGameRoutes(page);
    await page.addInitScript(() => {
      (window as any).__rahalTelemetryEvents = [];
      (navigator as any).share = async () => {};
      window.addEventListener('rahal:telemetry', (event: Event) => {
        const customEvent = event as CustomEvent;
        (window as any).__rahalTelemetryEvents.push(customEvent.detail.eventName);
      });
    });

    await page.goto('/en/game?presentation=hybrid');
    await expect(page.getByTestId('narrative-milestone-card')).toBeVisible();

    await page.getByRole('textbox', { name: 'Enter country name...' }).fill('Sudan');
    await page.getByRole('option').filter({ hasText: 'Sudan' }).first().click();

    await expect(page.getByTestId('postgame-recap-card')).toBeVisible();
    await expect(page.getByTestId('share-recap-button')).toBeVisible();
    await page.getByTestId('share-recap-button').click();

    const eventNames = await page.evaluate(() => (window as any).__rahalTelemetryEvents as string[]);
    expect(eventNames).toContain('ab_variant_assigned');
    expect(eventNames).toContain('ab_outcome_completion');
    expect(eventNames).toContain('recap_share_clicked');
  });

  test('daily game baseline variant hides milestone and recap surfaces', async ({ page }) => {
    await mockDailyGameRoutes(page);
    await page.addInitScript(() => {
      (window as any).__rahalTelemetryEvents = [];
      window.addEventListener('rahal:telemetry', (event: Event) => {
        const customEvent = event as CustomEvent;
        (window as any).__rahalTelemetryEvents.push(customEvent.detail.eventName);
      });
    });

    await page.goto('/en/game?presentation=baseline');
    await expect(page.getByTestId('narrative-milestone-card')).toHaveCount(0);

    await page.getByRole('textbox', { name: 'Enter country name...' }).fill('Sudan');
    await page.getByRole('option').filter({ hasText: 'Sudan' }).first().click();

    await expect(page.getByTestId('postgame-recap-card')).toHaveCount(0);
    await expect(page.getByTestId('share-recap-button')).toHaveCount(0);

    const eventNames = await page.evaluate(() => (window as any).__rahalTelemetryEvents as string[]);
    expect(eventNames).toContain('ab_variant_assigned');
    expect(eventNames).not.toContain('recap_card_viewed');
  });
});
