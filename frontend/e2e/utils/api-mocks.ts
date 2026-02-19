import { Page, Route } from '@playwright/test';
import mockChallenge from '../fixtures/mock-challenge.json';
import mockCountries from '../fixtures/mock-countries.json';

/**
 * Sets up API mocks for the game endpoints
 */
export async function setupGameMocks(page: Page) {
  // Mock daily challenge endpoint
  await page.route('**/api/game/daily**', async (route: Route) => {
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

  // Mock countries search endpoint
  await page.route('**/api/autocomplete/countries**', async (route: Route) => {
    const url = new URL(route.request().url());
    const query = url.searchParams.get('q')?.toLowerCase() || '';

    const filteredCountries = mockCountries.filter(
      (country) =>
        country.name_ar.includes(query) ||
        country.name_en.toLowerCase().includes(query)
    );

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        query,
        suggestions: filteredCountries.slice(0, 5).map((country) => ({
          ...country,
          similarity: 0.9,
        })),
        total: filteredCountries.length,
      }),
    });
  });
}

/**
 * Sets up guess submission mock
 */
export async function setupGuessMock(
  page: Page,
  options?: {
    scoreEmoji?: string;
    gameComplete?: boolean;
  }
) {
  const { scoreEmoji = '🟡', gameComplete = false } = options || {};

  await page.route('**/api/game/guess', async (route: Route) => {
    const requestBody = JSON.parse(route.request().postData() || '{}');
    const countryId = requestBody.country_id;

    const country = mockCountries.find((c) => c.id === countryId);

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        country: country || mockCountries[0],
        score_emoji: scoreEmoji,
        score_description: 'mock',
        is_on_shortest_path: scoreEmoji === '🟢' || scoreEmoji === '🟡',
        is_destination: gameComplete,
        game_complete: gameComplete,
        total_guesses: 1,
        score: gameComplete ? 100 : null,
        route_mode: 'shortest',
        gap_from_optimal: null,
        quality_tier: gameComplete ? 'perfect' : null,
        quality_explanation_ar: gameComplete ? 'مسار ممتاز' : null,
      }),
    });
  });
}

/**
 * Sets up mock for guess with dynamic scoring
 */
export async function setupDynamicGuessMock(page: Page) {
  let guessCount = 0;
  const optimalPath = mockChallenge.optimal_path;

  await page.route('**/api/game/guess', async (route: Route) => {
    const requestBody = JSON.parse(route.request().postData() || '{}');
    const countryId = requestBody.country_id;
    const country = mockCountries.find((c) => c.id === countryId);

    guessCount++;

    // Determine score emoji based on whether country is on optimal path
    let scoreEmoji = '🔴';
    const countryCode = country?.code;

    if (countryCode && optimalPath.includes(countryCode)) {
      // On the optimal path
      scoreEmoji = '🟢';
    } else if (country?.continent === mockChallenge.start_country.continent) {
      // Same continent as start
      scoreEmoji = '🟠';
    } else if (country?.continent !== mockChallenge.start_country.continent) {
      // Different continent
      scoreEmoji = '⚫';
    }

    // Check if game is complete (reached destination)
    const isComplete = countryCode === mockChallenge.end_country.code;

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        country: country || mockCountries[0],
        score_emoji: isComplete ? '🟢' : scoreEmoji,
        score_description: 'mock',
        is_on_shortest_path: Boolean(countryCode && optimalPath.includes(countryCode)),
        is_destination: isComplete,
        game_complete: isComplete,
        total_guesses: guessCount,
        score: isComplete ? 100 : null,
        route_mode: 'shortest',
        gap_from_optimal: null,
        quality_tier: isComplete ? 'perfect' : null,
        quality_explanation_ar: isComplete ? 'مسار ممتاز' : null,
      }),
    });
  });
}

/**
 * Sets up API error mock
 */
export async function setupApiErrorMock(page: Page, endpoint: string, statusCode = 500) {
  await page.route(`**${endpoint}**`, async (route: Route) => {
    await route.fulfill({
      status: statusCode,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Internal Server Error' }),
    });
  });
}
