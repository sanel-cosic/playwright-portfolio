import { test, expect } from '../../fixtures';

/**
 * Seed test for the Playwright Test Agents (planner / generator / healer).
 * The planner runs this first to get the app into a ready state, and the
 * generator copies its style (fixtures import, page objects, assertions).
 * Keep it short and idiomatic – it is the template for AI-generated tests.
 */
test('seed: signed-in user on the inventory page', async ({ inventoryPage }) => {
  await inventoryPage.goto();
  await expect(inventoryPage.title).toHaveText('Products');
});
