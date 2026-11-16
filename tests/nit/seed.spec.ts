import { test, expect } from '../../fixtures';

/**
 * Seed test for the Playwright Test Agents when working on the nIT site.
 * The planner runs it to reach a ready state; the generator copies its style
 * (fixtures import, page objects, web-first assertions). Keep it short.
 */
test('seed: nIT home page with the services tabs ready', async ({ nitHome }) => {
  await nitHome.goto();
  await expect(nitHome.serviceTabs.getByRole('tab', { selected: true })).toBeVisible();
});
