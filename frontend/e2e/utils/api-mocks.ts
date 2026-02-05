import { Page, Route } from '@playwright/test';
import mockChallenge from '../fixtures/mock-challenge.json';
import mockCountries from '../fixtures/mock-countries.json';

/**
 * Sets up API mocks for the game endpoints
 */
export async function setupGameMocks(page: Page) {
  // Mock daily challenge endpoint
  await page.route('**/api/challenge/daily', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockChallenge),
    });
  });

  // Mock countries search endpoint
  await page.route('**/api/countries/search**', async (route: Route) => {
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
      body: JSON.stringify(filteredCountries.slice(0, 5)),
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

  await page.route('**/api/guess', async (route: Route) => {
    const requestBody = JSON.parse(route.request().postData() || '{}');
    const countryId = requestBody.country_id;

    const country = mockCountries.find((c) => c.id === countryId);

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        country: country || mockCountries[0],
        score_emoji: scoreEmoji,
        game_complete: gameComplete,
        total_guesses: 1,
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

  await page.route('**/api/guess', async (route: Route) => {
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
        game_complete: isComplete,
        total_guesses: guessCount,
      }),
    });
  });
}

/**
 * Sets up API error mock
 */
export async function setupApiErrorMock(page: Page, endpoint: string, statusCode = 500) {
  await page.route(`**${endpoint}`, async (route: Route) => {
    await route.fulfill({
      status: statusCode,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Internal Server Error' }),
    });
  });
}
